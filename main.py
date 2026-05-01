import os
import json
import httpx
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API", "").strip()
BASE = "https://generativelanguage.googleapis.com"
STORE_FILE = "store_config.json"
MODEL = "gemini-2.0-flash"

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


# ── Files ──────────────────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    cfg = load_cfg()
    if not cfg.get("name"):
        raise HTTPException(status_code=400, detail="Create a store first")

    store = cfg["name"]
    data = await file.read()
    size = len(data)
    mime = file.content_type or "application/octet-stream"

    async with httpx.AsyncClient(timeout=120) as h:
        # Phase 1 — start resumable upload session
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
            json={"displayName": file.filename, "mimeType": mime},
        )
        if r1.status_code not in (200, 201):
            raise HTTPException(status_code=r1.status_code, detail=r1.text)

        upload_url = r1.headers.get("x-goog-upload-url") or r1.headers.get("X-Goog-Upload-URL")
        if not upload_url:
            raise HTTPException(status_code=500, detail="No upload URL returned from Gemini")

        # Phase 2 — stream file bytes
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
            raise HTTPException(status_code=r2.status_code, detail=r2.text)

        return r2.json()


@app.get("/api/files")
async def list_files():
    cfg = load_cfg()
    if not cfg.get("name"):
        return {"files": []}
    async with httpx.AsyncClient(timeout=30) as h:
        r = await h.get(f"{BASE}/v1beta/{cfg['name']}/files", headers=api_headers())
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
            f"{BASE}/v1beta/{cfg['name']}/files/{file_id}",
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

    # Build conversation contents (role must be "user" or "model" for Gemini)
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
                "tools": [{"fileSearch": {"fileSearchStore": store}}],
                "systemInstruction": {
                    "parts": [{
                        "text": (
                            "You are a helpful assistant. Answer questions based on the "
                            "uploaded documents in the knowledge store. If the answer is "
                            "not in the documents, say so clearly and concisely."
                        )
                    }]
                },
            },
        )
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.text)

        d = r.json()
        try:
            text = d["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            text = "No response generated."

        return {"response": text}


# ── Static UI (mount last so API routes take priority) ─────────────────────────
app.mount("/", StaticFiles(directory="static", html=True), name="static")
