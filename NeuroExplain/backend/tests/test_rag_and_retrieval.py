import pytest
from app.services.retriever import medical_retriever
from app.services.rag_pipeline import rag_pipeline
from app.services.knowledge_base import get_all_knowledge_documents


def test_retriever_initialization_and_availability():
    """Confirms retriever initializes properly and index is ready."""
    medical_retriever.initialize()
    assert medical_retriever.is_ready is True
    assert medical_retriever.vector_store is not None


def test_retrieval_for_tumor_question():
    """Asking 'What is a tumor?' must retrieve tumor/oncology guidelines, not carpal tunnel."""
    results = medical_retriever.retrieve("What is a tumor?", k=3, min_similarity=0.35)
    assert len(results) > 0

    top_source = results[0]
    assert top_source["id"] == "KB-MASS-003"
    assert "tumor" in top_source["title"].lower() or "mass" in top_source["title"].lower()

    # Verify carpal tunnel is NOT dominating the results
    result_ids = [r["id"] for r in results]
    assert "KB-EMG-005" not in result_ids


def test_retrieval_for_brain_vs_spinal_cord():
    """Asking about brain vs spinal cord retrieves spine/cord or anatomy guidelines."""
    results = medical_retriever.retrieve("What is the difference between the brain and the spinal cord?", k=3, min_similarity=0.35)
    assert len(results) > 0
    result_ids = [r["id"] for r in results]
    assert "KB-SPINE-006" in result_ids


def test_retrieval_threshold_filters_irrelevant_queries():
    """Unrelated questions (e.g., photosynthesis) return empty list when filtered by threshold."""
    results = medical_retriever.retrieve("What is photosynthesis?", k=3, min_similarity=0.35)
    assert len(results) == 0


def test_similarity_score_validity_and_sorting():
    """Scores must be valid cosine similarities in range [0.0, 1.0] and sorted descending."""
    results = medical_retriever.retrieve("acute ischemic stroke and diffusion restriction", k=4, min_similarity=0.1)
    assert len(results) > 0
    scores = [r["similarity_score"] for r in results]

    for score in scores:
        assert 0.0 <= score <= 1.0

    # Must be sorted descending
    assert scores == sorted(scores, reverse=True)


def test_empty_query_returns_empty_list():
    """Empty or whitespace queries must return an empty list safely."""
    assert medical_retriever.retrieve("", k=3) == []
    assert medical_retriever.retrieve("   ", k=3) == []
