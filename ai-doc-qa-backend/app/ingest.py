import os
import faiss
from llama_index.core import (
    SimpleDirectoryReader,
    VectorStoreIndex,
    StorageContext,
    load_index_from_storage,
)
from llama_index.vector_stores.faiss import FaissVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

from app.config import EMBED_MODEL, VECTOR_DB_PATH, UPLOAD_DIR


_EMBED_MODEL = HuggingFaceEmbedding(model_name=EMBED_MODEL)


def ingest_documents(file_paths: list[str] | None = None):
    reader = (
        SimpleDirectoryReader(
            input_files=file_paths,
            filename_as_id=True,
        )
        if file_paths
        else SimpleDirectoryReader(
            UPLOAD_DIR,
            filename_as_id=True,
        )
    )
    documents = reader.load_data()
    if not documents:
        return

    os.makedirs(VECTOR_DB_PATH, exist_ok=True)

    try:
        # Fast path: append to existing FAISS store without re-embedding prior docs
        vector_store = FaissVectorStore.from_persist_dir(VECTOR_DB_PATH)
        storage_context = StorageContext.from_defaults(
            vector_store=vector_store, persist_dir=VECTOR_DB_PATH
        )
        index = load_index_from_storage(storage_context, embed_model=_EMBED_MODEL)
        index.insert_documents(documents)
        index.storage_context.persist(persist_dir=VECTOR_DB_PATH)
        return
    except Exception:
        # Fall back to rebuilding if no prior index or incompatible state
        pass

    embed_dim = len(_EMBED_MODEL.get_text_embedding("dimension probe"))
    faiss_index = faiss.IndexFlatL2(embed_dim)
    vector_store = FaissVectorStore(faiss_index=faiss_index)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        embed_model=_EMBED_MODEL,
    )

    index.storage_context.persist(persist_dir=VECTOR_DB_PATH)
