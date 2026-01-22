import os
from functools import lru_cache

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


def get_answer(question: str):
    if not os.path.isdir(VECTOR_DB_PATH):
        return "Vector store missing. Upload documents first."

    llm = _get_llm()
    index = _get_index()

    query_engine = index.as_query_engine(
        llm=llm,
        similarity_top_k=8,
        vector_store_query_mode="mmr",
        vector_store_query_kwargs={"mmr_threshold": 0.4},
    )
    response = query_engine.query(question)

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
