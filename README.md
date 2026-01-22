# AI Document Q&A (Full Stack)

A local-first document question-answering demo. The backend ingests uploaded PDFs into a FAISS vector store using Hugging Face embeddings and answers questions with an Ollama-served LLM. The frontend is a simple React UI for uploading and chatting.

## Repo Layout
- `ai-doc-qa-backend/` – FastAPI app for upload + retrieval/QA; persists a FAISS index in `vectorstore/`.
- `ai-doc-qa-frontend/` – Vite/React client for uploads and chat.
- `data/uploads/` – Where incoming files are written.

## Requirements
- Python 3.10+ (tested with virtualenv/venv).
- Node 18+ (Vite) and npm.
- [Ollama](https://ollama.com) running locally with the `llama3` model pulled.
- Internet access for Hugging Face embeddings (`sentence-transformers/all-MiniLM-L6-v2`) unless cached.

## Backend (FastAPI)
1) Install deps:
```bash
cd ai-doc-qa-backend
python -m venv .venv
. .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```
2) Run the API:
```bash
uvicorn app.main:app --reload --port 8000
```
3) Configuration (optional env vars):
- `OLLAMA_BASE_URL` (default `http://localhost:11434`)
- `OLLAMA_REQUEST_TIMEOUT` (seconds, default `120`)
- Paths are defined in `app/config.py` and default to `vectorstore/` and `data/uploads/` inside the repo.

### API Endpoints
- `POST /upload` – multipart `file` (PDF). Stores file, ingests into FAISS. Returns `{ "message": "Document indexed successfully" }`.
- `GET /ask?q=question` – queries the vector index with an MMR retriever and responds with the model answer. Returns `{ "answer": "..." }`. If no index exists, returns a friendly message.

### Vector Store Behavior
- Uses `faiss.IndexFlatL2` with Hugging Face embeddings.
- Tries to append to an existing store; if loading fails, rebuilds from current files.
- Persistent files live under `ai-doc-qa-backend/vectorstore/`.
- To reset, stop the server and delete `ai-doc-qa-backend/vectorstore/` and `data/uploads/` contents, then restart and re-upload.

## Frontend (React + Vite)
1) Install deps:
```bash
cd ai-doc-qa-frontend
npm install
```
2) Run dev server:
```bash
npm run dev
```
3) Open the printed localhost URL (defaults to `http://127.0.0.1:5173`). CORS is already allowed for this origin in the backend.

### UI Flow
- Upload a PDF via the left card; progress is shown via XHR upload events.
- Ask questions in the chat pane; answers stream back as single responses.

## Notes & Troubleshooting
- Ensure Ollama is running and `llama3` is available: `ollama list` then `ollama run llama3` (first run downloads weights).
- If answers say the vector store is missing, upload a document to trigger ingestion.
- If embeddings fail due to model download, check internet/connectivity or pre-download the Hugging Face model cache.
- For production, add auth, input validation, rate limiting, and persistence hardening.

## License
Provided as-is for demo purposes. Adapt licensing as needed for your use.
