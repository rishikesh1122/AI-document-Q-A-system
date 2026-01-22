import os
from fastapi import FastAPI, UploadFile, File, Response, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from app.ingest import ingest_documents
from app.qa import get_answer
from app.config import UPLOAD_DIR

app = FastAPI(title="AI Document Q&A")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")

@app.get("/favicon.ico")
async def favicon():
    return Response(status_code=204)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    ingest_documents([file_path])
    return {"message": "Document indexed successfully"}

@app.get("/ask")
async def ask(q: str):
    try:
        return {"answer": get_answer(q)}
    except Exception as exc:  # surface backend errors to client
        raise HTTPException(status_code=500, detail=str(exc))
