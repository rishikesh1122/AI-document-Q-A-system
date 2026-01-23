import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Default to llama3; allow override via env. Keep a widely available model to avoid 404s.
LLM_MODEL = os.environ.get("LLM_MODEL", "llama3")
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

VECTOR_DB_PATH = os.path.join(BASE_DIR, "vectorstore")
UPLOAD_DIR = os.path.join(BASE_DIR, "data", "uploads")

# Ollama connection settings
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_REQUEST_TIMEOUT = int(os.environ.get("OLLAMA_REQUEST_TIMEOUT", "120"))
