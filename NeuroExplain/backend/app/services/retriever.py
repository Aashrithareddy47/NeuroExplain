import os
from typing import List, Dict, Any, Optional

# Vector store (FAISS) import with multi-version fallback
try:
    from langchain_community.vectorstores import FAISS
except (ImportError, ModuleNotFoundError):
    try:
        from langchain_community.vectorstores.faiss import FAISS
    except (ImportError, ModuleNotFoundError):
        try:
            from langchain.vectorstores import FAISS
        except (ImportError, ModuleNotFoundError):
            FAISS = None  # type: ignore

# Document import with fallback for langchain-core and legacy langchain
try:
    from langchain_core.documents import Document
except (ImportError, ModuleNotFoundError):
    try:
        from langchain.schema import Document
    except (ImportError, ModuleNotFoundError):
        try:
            from langchain.docstore.document import Document
        except (ImportError, ModuleNotFoundError):
            class Document:  # type: ignore
                def __init__(self, page_content: str, metadata: Optional[Dict[str, Any]] = None):
                    self.page_content = page_content
                    self.metadata = metadata or {}

# Embeddings base class import with fallbacks
try:
    from langchain_core.embeddings import Embeddings
except (ImportError, ModuleNotFoundError):
    try:
        from langchain.embeddings.base import Embeddings
    except (ImportError, ModuleNotFoundError):
        class Embeddings:  # type: ignore
            """Fallback Embeddings base class."""
            pass

# SentenceTransformer import with graceful fallback
try:
    from sentence_transformers import SentenceTransformer
except (ImportError, ModuleNotFoundError):
    SentenceTransformer = None  # type: ignore

from app.config import settings
from app.services.knowledge_base import (
    get_all_knowledge_documents,
    save_knowledge_base_to_disk,
)


class HuggingFaceSentenceTransformerEmbeddings(Embeddings):
    """LangChain Embeddings wrapper around SentenceTransformer."""

    def __init__(self, model_name: str):
        try:
            self.model = SentenceTransformer(
                model_name,
                local_files_only=True,
            )
        except Exception:
            self.model = SentenceTransformer(model_name)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(
            texts,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        return embeddings.tolist()

    def embed_query(self, text: str) -> List[float]:
        embedding = self.model.encode(
            text,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        return embedding.tolist()


class MedicalRetriever:
    """Retrieves relevant clinical reference passages from FAISS."""

    def __init__(self):
        self.embeddings: Optional[
            HuggingFaceSentenceTransformerEmbeddings
        ] = None
        self.vector_store: Optional[FAISS] = None
        self.is_ready: bool = False

    def initialize(self):
        """Initialize the embedding model and FAISS vector index."""

        if self.is_ready and self.vector_store is not None:
            return

        print(f"Loading embedding model: {settings.EMBEDDING_MODEL}...")

        self.embeddings = HuggingFaceSentenceTransformerEmbeddings(
            settings.EMBEDDING_MODEL
        )

        # Ensure knowledge-base documents exist on disk.
        save_knowledge_base_to_disk(settings.KNOWLEDGE_BASE_DOCS_DIR)

        index_file = os.path.join(
            settings.FAISS_INDEX_DIR,
            "index.faiss",
        )

        # Load an existing FAISS index when possible.
        if os.path.exists(index_file):
            try:
                print(
                    "Loading pre-built FAISS index from "
                    f"{settings.FAISS_INDEX_DIR}..."
                )

                self.vector_store = FAISS.load_local(
                    settings.FAISS_INDEX_DIR,
                    self.embeddings,
                    allow_dangerous_deserialization=True,
                )

                self.is_ready = True
                print("FAISS index loaded successfully.")
                return

            except Exception as exc:
                print(
                    f"Failed to load existing FAISS index: {exc}. "
                    "Rebuilding index..."
                )

        # No usable index was found.
        self.build_index()

    def build_index(self):
        """Build and persist a FAISS index from knowledge-base chunks."""

        if self.embeddings is None:
            self.embeddings = HuggingFaceSentenceTransformerEmbeddings(
                settings.EMBEDDING_MODEL
            )

        docs = get_all_knowledge_documents()
        langchain_docs: List[Document] = []

        for doc in docs:
            doc_id = doc["id"]
            title = doc["title"]
            publisher = doc.get("publisher", "Clinical Guidelines")
            year = doc.get("year")
            url = doc.get("url", "")
            doi = doc.get("doi", "")
            category = doc.get("category", "")

            for chunk_idx, chunk_text in enumerate(
                doc.get("chunks", [])
            ):
                if not isinstance(chunk_text, str) or not chunk_text.strip():
                    continue

                metadata = {
                    "source_id": doc_id,
                    "title": title,
                    "publisher": publisher,
                    "year": year,
                    "url": url,
                    "doi": doi,
                    "category": category,
                    "chunk_index": chunk_idx,
                }

                langchain_docs.append(
                    Document(
                        page_content=chunk_text,
                        metadata=metadata,
                    )
                )

        if not langchain_docs:
            raise RuntimeError(
                "No knowledge-base chunks were found. "
                "Check your knowledge-base documents."
            )

        print(
            f"Indexing {len(langchain_docs)} clinical reference "
            "chunks into FAISS..."
        )

        self.vector_store = FAISS.from_documents(
            langchain_docs,
            self.embeddings,
        )

        os.makedirs(settings.FAISS_INDEX_DIR, exist_ok=True)

        self.vector_store.save_local(settings.FAISS_INDEX_DIR)
        self.is_ready = True

        print(f"FAISS index saved to {settings.FAISS_INDEX_DIR}")

    def retrieve(
        self,
        query: str,
        k: int = 4,
        min_similarity: float = 0.35,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant clinical reference passages for a question.
        Uses mathematically sound cosine similarity from normalized FAISS L2 distances
        and filters irrelevant documents using a defensible threshold.
        """
        if not isinstance(query, str) or not query.strip():
            return []

        if not self.is_ready or self.vector_store is None:
            self.initialize()

        if self.vector_store is None:
            raise RuntimeError(
                "Medical vector store could not be initialized."
            )

        if k < 1:
            return []

        # Retrieve top-k candidates with raw distances
        results_with_scores = (
            self.vector_store.similarity_search_with_score(
                query.strip(),
                k=k,
            )
        )

        retrieved_items: List[Dict[str, Any]] = []

        for doc, distance in results_with_scores:
            metadata = doc.metadata or {}
            distance = float(distance)

            # For unit-normalized embeddings, squared L2 distance d^2 = 2*(1 - cos(theta)).
            # Therefore, true cosine similarity = 1.0 - (d^2 / 2.0).
            cosine_similarity = 1.0 - (distance / 2.0)
            similarity = max(0.0, min(1.0, cosine_similarity))

            # Discard passages that fall below the relevance threshold
            if similarity < min_similarity:
                continue

            retrieved_items.append(
                {
                    "id": metadata.get("source_id", "REF-001"),
                    "title": metadata.get(
                        "title",
                        "Clinical Reference",
                    ),
                    "publisher_or_journal": metadata.get(
                        "publisher",
                        "Medical Literature",
                    ),
                    "year": metadata.get("year"),
                    "doi_or_url": (
                        metadata.get("url")
                        or metadata.get("doi")
                    ),
                    "relevant_excerpt": doc.page_content,
                    "similarity_score": round(similarity, 3),
                }
            )

        # Sort items by similarity score descending
        retrieved_items.sort(key=lambda x: x["similarity_score"], reverse=True)

        print(f"\nRAG query: {query.strip()}")
        if retrieved_items:
            print(f"Retrieved {len(retrieved_items)} relevant documents (threshold >={min_similarity}):")
            for item in retrieved_items:
                print(
                    f"  - [{item['id']}] {item['title']} "
                    f"(similarity={item['similarity_score']})"
                )
        else:
            print(f"No documents met relevance threshold (>={min_similarity}).")

        return retrieved_items


# Shared retriever instance used by the application.
medical_retriever = MedicalRetriever()
