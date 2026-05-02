# Next.js Frontend Plan — Matia RAG Chatbot

## Stack
- Next.js 14 App Router + TypeScript + Tailwind CSS
- No extra UI libs — keep it lean
- Deploy to **Netlify** (static export — no server needed since all data comes from Railway API)

---

## Project Setup

```bash
# Inside Matia-RAG repo
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd frontend
```

Add to `next.config.ts`:
```ts
const nextConfig = {
  output: 'export',   // static HTML — deploys perfectly to Netlify
}
```

Add `netlify.toml` in `frontend/`:
```toml
[build]
  base    = "frontend"
  command = "npm run build"
  publish = "out"
```

`.env.local`:
```
NEXT_PUBLIC_API_URL=https://matia-rag-production.up.railway.app
```

---

## Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx          — dark bg, global font
│   ├── page.tsx            — renders <Sidebar> + <ChatArea> side by side
│   └── globals.css         — base Tailwind + scrollbar styles
├── components/
│   ├── Sidebar.tsx         — conversations, store, upload, file list
│   ├── ChatArea.tsx        — message history + input bar
│   ├── FileList.tsx        — file rows with badge + delete
│   ├── IngestPanel.tsx     — folder path input + progress bar + polling
│   └── Toast.tsx           — fixed bottom-right notifications
├── lib/
│   └── api.ts              — typed fetch wrappers for all Railway endpoints
├── next.config.ts
├── netlify.toml
└── .env.local
```

---

## Components

### `lib/api.ts`
Typed wrappers for every backend endpoint:

| Function | Method | Endpoint |
|----------|--------|----------|
| `getStore()` | GET | `/api/store` |
| `createStore()` | POST | `/api/store` |
| `deleteStore()` | DELETE | `/api/store` |
| `uploadFile(file)` | POST | `/api/upload` |
| `startIngest(path)` | POST | `/api/ingest-folder` |
| `getIngestStatus()` | GET | `/api/ingest-status` |
| `listFiles()` | GET | `/api/files` |
| `deleteFile(id)` | DELETE | `/api/files/:id` |
| `listConversations()` | GET | `/api/conversations` |
| `createConversation()` | POST | `/api/conversations` |
| `deleteConversation(id)` | DELETE | `/api/conversations/:id` |
| `getMessages(convId)` | GET | `/api/conversations/:id/messages` |
| `sendMessage(msg, convId?)` | POST | `/api/chat` |

---

### `Sidebar.tsx`
- **Conversations section** — list with active highlight, delete button on hover, "+ New chat" button
- **Knowledge Store section** — green dot status pill, Create / Delete store buttons
- **Upload File section** — drag & drop zone (hidden when no store)
- **Bulk Ingest section** — folder path text input + Ingest button (hidden when no store)
- **Files section** — file rows with state badge (ACTIVE / PENDING / FAILED) + delete (hidden when no store)

### `ChatArea.tsx`
- Header: "Document Q&A" title + "DOCS ONLY" badge
- Scrollable message list — user bubbles right (purple), bot bubbles left (dark)
- Typing indicator (3 bouncing dots) while waiting for API
- Citations panel below each bot message — collapsible source cards
- Textarea input bar — auto-grows, Enter to send, Shift+Enter for newline
- Send button disabled when no store or message empty

### `IngestPanel.tsx`
- Text input for absolute folder path on the server
- Ingest button → calls `POST /api/ingest-folder` → polls `GET /api/ingest-status` every 2s
- Progress bar + label "Uploading 3 / 10 — field-manual.md"
- On complete: toast "All 10 files uploaded!" + refresh file list

### `Toast.tsx`
- Fixed bottom-right, auto-dismisses after 3.5s
- Three variants: `success` (green), `error` (red), `info` (purple)

---

## State Management
Plain React `useState` + `useEffect` — no Redux/Zustand needed.

Key state in `page.tsx` (passed as props):
```ts
storeReady: boolean
activeConvId: string | null
messages: Message[]
conversations: Conversation[]
files: FileEntry[]
ingestState: IngestStatus
toasts: Toast[]
```

---

## Deployment to Netlify

1. Push repo to GitHub
2. Netlify → **Add new site → Import from GitHub**
3. Set build settings (auto-detected from `netlify.toml`):
   - Base: `frontend`
   - Build command: `npm run build`
   - Publish: `out`
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://matia-rag-production.up.railway.app`
5. Deploy — Netlify gives a URL like `https://matia-rag.netlify.app`

---

## Feature Parity Checklist

- [ ] Store create / delete with green dot indicator
- [ ] Drag & drop single file upload with per-file progress
- [ ] Bulk folder ingest + 2s polling progress bar
- [ ] File list with state badges + delete
- [ ] Conversations sidebar — load, switch, delete, new chat
- [ ] Chat with markdown formatting (bold, code, pre blocks)
- [ ] Collapsible citations below bot messages
- [ ] Toast notifications (success / error / info)
- [ ] Textarea auto-grow + Enter to send
- [ ] Typing dots animation while waiting

---

## What's NOT changing
- FastAPI backend on Railway — untouched
- All API endpoints — no backend changes needed
- Supabase schema — unchanged
