# Product Requirements Document (PRD) & SOP: Matia RAG Chatbot Frontend

## 1. Overview
The Matia RAG Chatbot frontend is a lightweight, responsive web application designed to interface with a FastAPI backend (running on Railway). It provides a sleek, dark-themed UI for uploading documents, managing knowledge stores, and chatting with an AI model powered by Retrieval-Augmented Generation (RAG).

The application is built to be exported as purely static HTML/CSS/JS and deployed via Netlify, as the backend handles all heavy lifting, database operations, and AI processing.

## 2. Technology Stack
* **Framework:** Next.js 14 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS (custom dark theme, no external UI libraries like shadcn or MUI)
* **Build Target:** Static Export (`output: 'export'`)
* **Deployment:** Netlify

## 3. Directory Structure
```text
frontend/
├── app/
│   ├── layout.tsx          # Global layout, dark theme, font injection
│   ├── page.tsx            # Main view orchestrating state and layout
│   └── globals.css         # Tailwind base and custom scrollbar styles
├── components/
│   ├── Sidebar.tsx         # Left panel (conversations, store, upload, file list)
│   ├── ChatArea.tsx        # Right panel (messages, citations, input, typing indicator)
│   ├── FileList.tsx        # Sub-component rendering uploaded files and status badges
│   ├── IngestPanel.tsx     # Sub-component handling bulk folder ingestion & polling
│   └── Toast.tsx           # Global notification system (success, error, info)
├── lib/
│   └── api.ts              # Strongly typed fetch wrappers for the Railway backend
├── next.config.ts          # Next.js configuration (static export)
├── netlify.toml            # Netlify build configuration
└── .env.local              # Environment variables
```

## 4. API Integration Layer (`lib/api.ts`)
The frontend communicates exclusively via REST endpoints using `fetch`. No complex data fetching libraries (like React Query or SWR) are used to keep the bundle lean.

**Endpoints Mapped:**
* **Store Management:** `GET /api/store`, `POST /api/store`, `DELETE /api/store`
* **File Management:** `GET /api/files`, `DELETE /api/files/:id`
* **Uploads & Ingestion:** `POST /api/upload`, `POST /api/ingest-folder`, `GET /api/ingest-status`
* **Chat & Conversations:** `GET /api/conversations`, `POST /api/conversations`, `DELETE /api/conversations/:id`, `GET /api/conversations/:id/messages`, `POST /api/chat`

## 5. Core Components & Features

### 5.1 Main Layout (`app/page.tsx`)
Acts as the central state manager using React `useState` and `useEffect`.
* **State Tracked:** `storeReady`, `conversations`, `activeConvId`, `messages`, `files`, `toasts`, `isTyping`, `isInitialized`.
* Orchestrates data flow downward into the `Sidebar` and `ChatArea`.

### 5.2 Sidebar (`components/Sidebar.tsx`)
* **Conversations:** Lists chat history. Highlights active chat. Includes hover-to-delete functionality and a "New Chat" button.
* **Knowledge Store:** Visual indicator (glowing green dot when active, red when inactive). Includes buttons to create/delete the store.
* **Upload Zone:** Drag-and-drop region for single files (hidden/disabled if store is inactive).
* **Ingest Panel (`IngestPanel.tsx`):** Accepts absolute server folder paths. Initiates bulk upload and polls `/api/ingest-status` every 2 seconds to update a dynamic progress bar.
* **File List (`FileList.tsx`):** Displays uploaded files with color-coded badges (`ACTIVE`, `PENDING`, `FAILED`) and a hover-to-delete button.

### 5.3 Chat Area (`components/ChatArea.tsx`)
* **Message History:** Left/right bubble layout (purple for user, dark gray for bot).
* **Markdown Formatting:** Custom lightweight regex parser handles `**bold**`, `` `inline code` ``, and ```pre blocks``` without needing external markdown libraries.
* **Citations:** Collapsible "View Sources" accordion under bot messages showing referenced document titles and snippets.
* **Typing Indicator:** Custom CSS bouncing dots animation when waiting for the API.
* **Input Bar:** Auto-growing textarea constrained to 150px. Supports `Enter` to send and `Shift+Enter` for new lines.

### 5.4 Toast Notifications (`components/Toast.tsx`)
* Fixed bottom-right sliding notifications.
* Three variants: Success (Green), Error (Red), Info (Purple).
* Auto-dismisses after 3.5 seconds.

## 6. Standard Operating Procedure (SOP) for Deployment

Follow these steps to deploy updates to Netlify.

**Prerequisites:**
1. Code must be pushed to a GitHub repository.
2. You must have a Netlify account linked to your GitHub.

**Step 1: Verify Build Locally**
Before pushing code, always verify the static export works.
```bash
cd frontend
npm run build
```
*Ensure it completes with `Exit code: 0` and generates an `out/` folder.*

**Step 2: Connect Repository to Netlify**
1. Log in to Netlify.
2. Click **Add new site** > **Import from an existing project**.
3. Select GitHub and authorize.
4. Choose the `Matia-RAG` repository.

**Step 3: Configure Build Settings**
Netlify should automatically read the `netlify.toml` file, but verify the following settings:
* **Base directory:** `frontend`
* **Build command:** `npm run build`
* **Publish directory:** `frontend/out`

**Step 4: Set Environment Variables**
1. In the Netlify deploy settings, add the following environment variable:
   * **Key:** `NEXT_PUBLIC_API_URL`
   * **Value:** `https://matia-rag-production.up.railway.app` (or your active backend URL).

**Step 5: Deploy**
1. Click **Deploy Site**.
2. Netlify will run the build and publish the static HTML.
3. Subsequent pushes to the `main` branch on GitHub will automatically trigger new builds.
