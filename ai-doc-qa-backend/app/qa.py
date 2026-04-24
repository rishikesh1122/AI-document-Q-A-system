import os
import json
from functools import lru_cache
from urllib.error import URLError
from urllib.request import urlopen

from llama_index.core import StorageContext, load_index_from_storage
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.faiss import FaissVectorStore

from app.config import (
    LLM_MODEL,
    EMBED_MODEL,
    VECTOR_DB_PATH,
    OLLAMA_BASE_URL,
    OLLAMA_REQUEST_TIMEOUT,
)


class LLMUnavailableError(RuntimeError):
    """Raised when the local LLM service is not available for answering."""


def get_answer(question: str):
    if not os.path.isdir(VECTOR_DB_PATH):
        return "Vector store missing. Upload documents first."

    _ensure_ollama_ready()

    try:
        llm = _get_llm()
        index = _get_index()

        # Trim retrieval depth and skip MMR reranking to speed up responses
        query_engine = index.as_query_engine(
            llm=llm,
            similarity_top_k=4,
        )
        response = query_engine.query(question)
    except Exception as exc:
        msg = str(exc)
        if "llama runner process has terminated" in msg:
            raise LLMUnavailableError(
                "Ollama runner crashed while generating a response. "
                "Restart Ollama and try a smaller model (for example: llama3.2:1b), "
                "or free up RAM and retry."
            ) from exc
        raise

    return str(response)


@lru_cache(maxsize=1)
def _get_llm():
    return Ollama(
        model=LLM_MODEL,
        base_url=OLLAMA_BASE_URL,
        request_timeout=OLLAMA_REQUEST_TIMEOUT,
    )


@lru_cache(maxsize=1)
def _get_index():
    embed_model = HuggingFaceEmbedding(model_name=EMBED_MODEL)
    vector_store = FaissVectorStore.from_persist_dir(VECTOR_DB_PATH)
    storage_context = StorageContext.from_defaults(
        vector_store=vector_store,
        persist_dir=VECTOR_DB_PATH,
    )
    return load_index_from_storage(storage_context, embed_model=embed_model)


def _ensure_ollama_ready():
    tags_url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/tags"
    try:
        with urlopen(tags_url, timeout=3) as resp:  # nosec B310: local trusted URL from config
            payload = json.loads(resp.read().decode("utf-8"))
    except URLError as exc:
        raise LLMUnavailableError(
            f"Cannot reach Ollama at {OLLAMA_BASE_URL}. "
            "Start Ollama (or run `ollama serve`) and try again."
        ) from exc
    except Exception as exc:
        raise LLMUnavailableError(
            "Ollama is not responding correctly. Restart Ollama and retry."
        ) from exc

    model_names = {m.get("name") for m in payload.get("models", []) if isinstance(m, dict)}
    if LLM_MODEL not in model_names and f"{LLM_MODEL}:latest" not in model_names:
        raise LLMUnavailableError(
            f"Model '{LLM_MODEL}' is not installed in Ollama. "
            f"Run `ollama pull {LLM_MODEL}` and retry."
        )
