import os
import json
import mimetypes
import httpx
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API", "").strip()
BASE = "https://generativelanguage.googleapis.com"
STORE_FILE = "store_config.json"
MODEL = "gemini-3-flash-preview"

SUPPORTED_EXTS = {".pdf", ".md", ".txt", ".docx", ".xlsx", ".csv", ".json", ".html", ".xml"}

CATEGORY_MAP = {
    "accommodation": "accommodation", "hotel": "accommodation",
    "after-dark": "nightlife", "neon": "nightlife",
    "detour": "detours",
    "diner": "dining", "food": "dining",
    "field-manual": "planning", "manual": "planning",
    "rider": "motorcycle", "bike": "motorcycle",
    "map": "maps", "interactive": "maps",
    "bucket": "experiences", "centennial": "experiences",
    "travel-guide": "history", "travel_guide": "history",
    "route66-pdf": "general", "route66_pdf": "general",
}

STRICT_SYSTEM_PROMPT = (
    "You are a document assistant. You MUST answer ONLY using information explicitly "
    "stated in the uploaded documents. Do NOT use any outside knowledge, general knowledge, "
    "or assumptions beyond what is written in the documents. "
    "If the answer is not found in the documents, respond with exactly: "
    "'I could not find that information in the uploaded documents.' "
    "Always cite the source document name for every fact you state."
)

ingest_state: dict = {"total": 0, "done": 0, "failed": [], "current": "", "running": False}

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def load_cfg() -> dict:
    if Path(STORE_FILE).exists():
        return json.loads(Path(STORE_FILE).read_text())
    return {}


def save_cfg(d: dict):
    Path(STORE_FILE).write_text(json.dumps(d))


def api_headers() -> dict:
    return {"x-goog-api-key": API_KEY, "Content-Type": "application/json"}


def detect_category(filename: str) -> str:
    name = filename.lower()
    for keyword, category in CATEGORY_MAP.items():
        if keyword in name:
            return category
    return "general"


async def upload_bytes_to_store(store: str, filename: str, data: bytes, mime: str, metadata: list) -> dict:
    size = len(data)
    async with httpx.AsyncClient(timeout=120) as h:
        r1 = await h.post(
            f"{BASE}/upload/v1beta/{store}:uploadToFileSearchStore",
            headers={
                "x-goog-api-key": API_KEY,
                "Content-Type": "application/json",
                "X-Goog-Upload-Protocol": "resumable",
                "X-Goog-Upload-Command": "start",
                "X-Goog-Upload-Header-Content-Length": str(size),
                "X-Goog-Upload-Header-Content-Type": mime,
            },
            json={"displayName": filename, "mimeType": mime, "customMetadata": metadata},
        )
        if r1.status_code not in (200, 201):
            raise RuntimeError(r1.text)

        upload_url = r1.headers.get("x-goog-upload-url") or r1.headers.get("X-Goog-Upload-URL")
        if not upload_url:
            raise RuntimeError("No upload URL returned")

        r2 = await h.post(
            upload_url,
            headers={
                "Content-Length": str(size),
                "X-Goog-Upload-Offset": "0",
                "X-Goog-Upload-Command": "upload, finalize",
            },
            content=data,
        )
        if r2.status_code not in (200, 201):
            raise RuntimeError(r2.text)

        return r2.json()


# ── Store ──────────────────────────────────────────────────────────────────────

@app.post("/api/store")
async def create_store():
    async with httpx.AsyncClient(timeout=30) as h:
        r = await h.post(
            f"{BASE}/v1beta/fileSearchStores",
            headers=api_headers(),
            json={"displayName": "RAG Store"},
        )
        if r.status_code not in (200, 201):
            raise HTTPException(status_code=r.status_code, detail=r.text)
        data = r.json()
        save_cfg({"name": data["name"]})
        return data


@app.get("/api/store")
async def get_store():
    cfg = load_cfg()
    if not cfg.get("name"):
        return {"name": None}
    async with httpx.AsyncClient(timeout=30) as h:
        r = await h.get(f"{BASE}/v1beta/{cfg['name']}", headers=api_headers())
        if r.status_code == 404:
            save_cfg({})
            return {"name": None}
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        return r.json()


@app.delete("/api/store")
async def delete_store():
    cfg = load_cfg()
    if not cfg.get("name"):
        raise HTTPException(status_code=400, detail="No store exists")
    async with httpx.AsyncClient(timeout=30) as h:
        r = await h.delete(
            f"{BASE}/v1beta/{cfg['name']}?force=true",
            headers=api_headers(),
        )
        if r.status_code not in (200, 204):
            raise HTTPException(status_code=r.status_code, detail=r.text)
    save_cfg({})
    return {"deleted": True}


# ── Single file upload ─────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    cfg = load_cfg()
    if not cfg.get("name"):
        raise HTTPException(status_code=400, detail="Create a store first")

    store = cfg["name"]
    data = await file.read()
    mime = file.content_type or "application/octet-stream"
    category = detect_category(file.filename or "")
    metadata = [
        {"key": "category", "stringValue": category},
        {"key": "file_type", "stringValue": Path(file.filename or "").suffix.lstrip(".")},
        {"key": "source", "stringValue": "route66_corpus"},
    ]
    try:
        return await upload_bytes_to_store(store, file.filename or "file", data, mime, metadata)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Bulk folder ingest ─────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    folder_path: str


async def _run_ingest(folder_path: str, store: str):
    global ingest_state
    folder = Path(folder_path)
    files = [f for f in folder.rglob("*") if f.is_file() and f.suffix.lower() in SUPPORTED_EXTS]

    ingest_state = {"total": len(files), "done": 0, "failed": [], "current": "", "running": True}

    for f in files:
        ingest_state["current"] = f.name
        mime = mimetypes.guess_type(f.name)[0] or "application/octet-stream"
        category = detect_category(f.name)
        metadata = [
            {"key": "category", "stringValue": category},
            {"key": "file_type", "stringValue": f.suffix.lstrip(".")},
            {"key": "source", "stringValue": "route66_corpus"},
        ]
        try:
            data = f.read_bytes()
            await upload_bytes_to_store(store, f.name, data, mime, metadata)
            ingest_state["done"] += 1
        except Exception as e:
            ingest_state["failed"].append({"file": f.name, "error": str(e)[:200]})

    ingest_state["running"] = False
    ingest_state["current"] = ""


@app.post("/api/ingest-folder")
async def ingest_folder(req: IngestRequest, background_tasks: BackgroundTasks):
    cfg = load_cfg()
    if not cfg.get("name"):
        raise HTTPException(status_code=400, detail="Create a store first")
    if ingest_state.get("running"):
        raise HTTPException(status_code=409, detail="Ingest already running")
    background_tasks.add_task(_run_ingest, req.folder_path, cfg["name"])
    return {"started": True}


@app.get("/api/ingest-status")
async def ingest_status():
    return ingest_state


# ── Files ──────────────────────────────────────────────────────────────────────

@app.get("/api/files")
async def list_files():
    cfg = load_cfg()
    if not cfg.get("name"):
        return {"files": []}
    async with httpx.AsyncClient(timeout=30) as h:
        r = await h.get(f"{BASE}/v1beta/{cfg['name']}/documents", headers=api_headers())
        if r.status_code == 404:
            return {"files": []}
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        return r.json()


@app.delete("/api/files/{file_id:path}")
async def delete_file(file_id: str):
    cfg = load_cfg()
    if not cfg.get("name"):
        raise HTTPException(status_code=400, detail="No store exists")
    async with httpx.AsyncClient(timeout=30) as h:
        r = await h.delete(
            f"{BASE}/v1beta/{cfg['name']}/documents/{file_id}?force=true",
            headers=api_headers(),
        )
        if r.status_code not in (200, 204):
            raise HTTPException(status_code=r.status_code, detail=r.text)
    return {"deleted": True}


# ── Chat ───────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    history: list = []


@app.post("/api/chat")
async def chat(req: ChatRequest):
    cfg = load_cfg()
    if not cfg.get("name"):
        raise HTTPException(status_code=400, detail="Create a store and upload files first")

    store = cfg["name"]
    contents = [
        {"role": m["role"], "parts": [{"text": m["content"]}]}
        for m in req.history
    ]
    contents.append({"role": "user", "parts": [{"text": req.message}]})

    async with httpx.AsyncClient(timeout=60) as h:
        r = await h.post(
            f"{BASE}/v1beta/models/{MODEL}:generateContent",
            headers=api_headers(),
            json={
                "contents": contents,
                "tools": [{"fileSearch": {"fileSearchStoreNames": [store]}}],
                "systemInstruction": {"parts": [{"text": STRICT_SYSTEM_PROMPT}]},
            },
        )
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.text)

        d = r.json()
        candidate = d.get("candidates", [{}])[0]

        # Extract answer text
        try:
            text = candidate["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            text = "No response generated."

        # Extract citations from groundingMetadata
        citations = []
        grounding = candidate.get("groundingMetadata", {})
        for chunk in grounding.get("groundingChunks", []):
            ctx = chunk.get("retrievedContext", {})
            title = ctx.get("title", "")
            snippet = ctx.get("text", "")
            if title or snippet:
                citations.append({"source": title, "snippet": snippet})

        return {"response": text, "citations": citations}


# ── Static UI ──────────────────────────────────────────────────────────────────
app.mount("/", StaticFiles(directory="static", html=True), name="static")
