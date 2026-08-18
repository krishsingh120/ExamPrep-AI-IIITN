# scripts/ingest.ts will be created in Phase 2.
# This script is the document ingestion entry point.
#
# Usage: npm run ingest
#
# What it will do:
# 1. Load documents from the /docs directory
# 2. Clean and normalize content
# 3. Attach structured metadata (subject, unit, topic, category, etc.)
# 4. Apply source-specific chunking strategies
# 5. Generate embeddings
# 6. Insert into Qdrant
