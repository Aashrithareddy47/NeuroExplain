"""
Vector Retriever Service for NeuroExplain.
Uses Sentence Transformers (sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2)
and LangChain FAISS vector store for cross-lingual medical literature retrieval.
"""

import os
from typing import List, Dict, Any, Optional
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from sentence_transformers import SentenceTransformer

from app.config import settings
from app.services.knowledge_base import get_all_knowledge_documents, save_knowledge_base_to_disk

class HuggingFaceSentenceTransformerEmbeddings(Embeddings):
    """LangChain Embeddings wrapper around SentenceTransformer."""
    def __init__(self, model_name: str):
        try:
            self.model = SentenceTransformer(model_name, local_files_only=True)
        except Exception:
            self.model = SentenceTransformer(model_name)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
        return embeddings.tolist()

    def embed_query(self, text: str) -> List[float]:
        embedding = self.model.encode(text, show_progress_bar=False, normalize_embeddings=True)
        return embedding.tolist()

class MedicalRetriever:
    def __init__(self):
        self.embeddings: Optional[HuggingFaceSentenceTransformerEmbeddings] = None
        self.vector_store: Optional[FAISS] = None
        self.is_ready: bool = False

    def initialize(self):
        """Initializes embeddings model and FAISS vector index."""
        if self.is_ready:
            return

        print(f"Loading embedding model: {settings.EMBEDDING_MODEL}...")
        self.embeddings = HuggingFaceSentenceTransformerEmbeddings(settings.EMBEDDING_MODEL)
        
        # Ensure knowledge base JSON docs exist on disk
        save_knowledge_base_to_disk(settings.KNOWLEDGE_BASE_DOCS_DIR)

        # Check if FAISS index exists on disk
        index_file = os.path.join(settings.FAISS_INDEX_DIR, "index.faiss")
        if os.path.exists(index_file):
            try:
                print(f"Loading pre-built FAISS index from {settings.FAISS_INDEX_DIR}...")
                self.vector_store = FAISS.load_local(
                    settings.FAISS_INDEX_DIR,
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                self.is_ready = True
                print("FAISS index loaded successfully.")
                return
            except Exception as e:
                print(f"Failed to load existing FAISS index ({e}). Rebuilding...")

        # Rebuild FAISS index from clinical knowledge documents
        self.build_index()

    def build_index(self):
        """Builds FAISS index from knowledge base chunks."""
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

            for chunk_idx, chunk_text in enumerate(doc.get("chunks", [])):
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
                langchain_docs.append(Document(page_content=chunk_text, metadata=metadata))

        print(f"Indexing {len(langchain_docs)} clinical reference chunks into FAISS...")
        self.vector_store = FAISS.from_documents(langchain_docs, self.embeddings)
        
        # Persist locally
        os.makedirs(settings.FAISS_INDEX_DIR, exist_ok=True)
        self.vector_store.save_local(settings.FAISS_INDEX_DIR)
        self.is_ready = True
        print(f"FAISS index saved to {settings.FAISS_INDEX_DIR}")

    def retrieve(self, query: str, k: int = 4) -> List[Dict[str, Any]]:
        """
        Performs semantic vector search for a query (in EN, TE, or HI)
        and returns scored clinical reference passages.
        """
        if not self.is_ready or not self.vector_store:
            self.initialize()

        # Perform similarity search with score
        results_with_scores = self.vector_store.similarity_search_with_relevance_scores(query, k=k)
        
        retrieved_items = []
        for doc, score in results_with_scores:
            meta = doc.metadata
            retrieved_items.append({
                "id": meta.get("source_id", "REF-001"),
                "title": meta.get("title", "Clinical Reference"),
                "publisher_or_journal": meta.get("publisher", "Medical Literature"),
                "year": meta.get("year"),
                "doi_or_url": meta.get("url") or meta.get("doi"),
                "relevant_excerpt": doc.page_content,
                "similarity_score": round(float(score), 3) if score is not None else 0.85
            })

        return retrieved_items

medical_retriever = MedicalRetriever()
