# RAG Pipeline directory
# This directory contains the full RAG (Retrieval Augmented Generation) pipeline.
#
# Subdirectories (Phase 2):
# - loaders/    → Document loaders (PDF, PPTX, text, web)
# - chunking/   → Source-specific chunking strategies
# - embeddings/ → Embedding model setup (HuggingFace local or API-based)
# - retriever/  → LangChain retriever wrappers around Qdrant
# - qdrant/     → Qdrant client, collection management, insertion helpers
