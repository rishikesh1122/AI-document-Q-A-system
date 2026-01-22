# AI Doc QA – Frontend

React + Vite UI for uploading PDFs and chatting with the document QA backend.

## Quickstart
1) Install deps:
```bash
npm install
```
2) Run dev server:
```bash
npm run dev
```
3) Open the printed local URL (default `http://127.0.0.1:5173`). The backend CORS policy already allows this origin.

## How it works
- `UploadCard` posts PDFs to the backend `/upload` endpoint and shows progress.
- `Chat` calls `/ask?q=...` to retrieve answers and appends them to the conversation.
- UI components (buttons, inputs, cards, scroll area) are simple Shadcn-style primitives in `src/components/ui/`.

## Environment assumptions
- Backend runs on `http://127.0.0.1:8000` (update the fetch URLs in components if you change it).
- Only PDF uploads are accepted by default.

## Production notes
- Run `npm run build` for a production bundle, then serve `dist/` via any static host.
- Add error boundaries, input sanitization, and auth before exposing publicly.
