# ExamPrep AI --- Architecture & Design

## 1. Project Overview

**ExamPrep AI** is a lightweight, exam-focused multi-agent RAG assistant
for IIIT Nagpur students.

The system combines:

-   IIITN official syllabus
-   Previous Year Questions (PYQs)
-   Faculty lecture PPTs
-   Class notes

The goal is not to build a generic chatbot. The system is designed
around the actual exam-preparation workflow:

1.  Understand the student's question.
2.  Decide which capability is required.
3.  Retrieve course-specific evidence when necessary.
4.  Analyze historical PYQs for topic weightage.
5.  Generate trend-based question predictions.
6.  Solve doubts using faculty/course material.
7.  Return source-grounded answers.
8.  Cache repeated questions to reduce latency and LLM usage.

The implementation intentionally uses **LangChain.js without
LangGraph**. Multi-agent orchestration is handled through structured
routing and normal TypeScript application logic.

------------------------------------------------------------------------

## 2. Design Goals

### Primary Goals

-   High relevance to course material.
-   Simple and explainable agent architecture.
-   Low latency during exam-time traffic.
-   Minimal backend complexity.
-   Easy local development and deployment.
-   Strong interview-level architecture without unnecessary
    infrastructure.

### Non-Goals

The first version does not attempt to implement:

-   Microservices
-   Kubernetes
-   Kafka
-   BullMQ
-   Complex authentication
-   Large analytics dashboards
-   Automated evaluation pipelines
-   Complex agent memory
-   Full textbook ingestion

------------------------------------------------------------------------

## 3. High-Level Architecture

``` text
                         ┌──────────────────┐
                         │     Student      │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   React + UI     │
                         │   Basic Chat     │
                         └────────┬─────────┘
                                  │ REST
                                  ▼
                         ┌──────────────────┐
                         │ Node.js/Express  │
                         │   Chat API       │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   Redis Cache    │
                         │ Answer + Locks   │
                         └────────┬─────────┘
                                  │
                              Cache MISS
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   Query Router   │
                         │   LangChain.js   │
                         └────────┬─────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
       ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
       │ Retriever   │    │  Weightage   │    │    Doubt    │
       │   Agent     │    │    Agent     │    │   Solver    │
       └──────┬──────┘    └──────┬───────┘    └──────┬──────┘
              │                  │                   │
              ▼                  ▼                   ▼
           Qdrant           PYQ Frequency          Qdrant
              │                  │                   │
              │                  ▼                   │
              │            ┌─────────────┐           │
              │            │  Predictor  │           │
              │            │    Agent    │           │
              │            └──────┬──────┘           │
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  ▼
                         ┌──────────────────┐
                         │ Response         │
                         │ Generator        │
                         │ + Citations      │
                         └────────┬─────────┘
                                  │
                                  ▼
                              Redis SET
                                  │
                                  ▼
                               Student
```

------------------------------------------------------------------------

## 4. Knowledge Ingestion Architecture

``` text
IIITN Official Website ─┐
PYQs ───────────────────┤
Faculty PPTs ───────────┼──► Parse/Clean
Class Notes ────────────┘
                           │
                           ▼
                       Metadata
                           │
                           ▼
                       Chunking
                           │
                           ▼
                       Embeddings
                           │
                           ▼
                         Qdrant
```

### Source categories

  -----------------------------------------------------------------------
  Category                Source                  Main purpose
  ----------------------- ----------------------- -----------------------
  `syllabus`              IIITN official website  Units and topic mapping

  `pyq`                   Crisper / collected     Retrieval, frequency,
                          PYQs                    weightage, prediction

  `lecture_slide`         Faculty PPTs            Primary concept source

  `class_note`            Class notes             Supporting concept
                                                  context
  -----------------------------------------------------------------------

Full textbooks are intentionally excluded because faculty PPTs and class
notes are more directly aligned with the actual course delivery and exam
scope.

------------------------------------------------------------------------

## 5. Document Metadata

Every chunk should preserve metadata.

``` ts
{
  subject: "DBMS",
  semester: 5,
  unit: "Unit 3",
  topic: "Normalization",
  category: "lecture_slide",
  year: 2025,
  source: "DBMS Unit 3 Faculty Slides",
  documentId: "..."
}
```

Metadata is critical for:

-   subject filtering
-   unit filtering
-   source filtering
-   PYQ analysis
-   citations
-   debugging retrieval

------------------------------------------------------------------------

## 6. Source-Specific Chunking

Different sources should use different chunking strategies.

### Syllabus

Chunk by unit/section.

### PYQs

Prefer:

> One question = one logical document/chunk.

This makes question retrieval and frequency analysis easier.

### Faculty PPTs

Prefer:

> One or two related slides = one logical chunk.

### Class Notes

Chunk by logical paragraph/section.

The system should avoid blindly applying the same chunk size to every
source.

------------------------------------------------------------------------

## 7. Multi-Agent Architecture

The system contains four specialist capabilities plus a router and final
response layer.

``` text
Student Query
     │
     ▼
Query Router
     │
     ├──► Retriever Agent
     │
     ├──► Weightage Agent
     │         │
     │         └──► Predictor Agent
     │
     └──► Doubt Solver
                    │
                    ▼
             Response Generator
                    │
                    ▼
                Student
```

The router does not generate the final answer. It determines which
capabilities are required.

The application code executes the selected agents.

------------------------------------------------------------------------

## 8. Caching Architecture

Redis uses a simple cache-aside pattern.

``` text
Request
   │
   ▼
Normalize Query
   │
   ▼
Generate Cache Key
   │
   ▼
Redis GET
   │
   ├── HIT ──► Return cached response
   │
   └── MISS
          │
          ▼
      Agent Workflow
          │
          ▼
      Final Answer
          │
          ▼
       Redis SET
          │
          ▼
       Student
```

### Cache candidates

-   Final answers
-   Retrieval results where useful
-   Weightage results
-   Prediction results

Caching is especially valuable because exam traffic is naturally
repetitive.

------------------------------------------------------------------------

## 9. Request Deduplication

If multiple students ask the same question at nearly the same time:

``` text
Student A ─┐
Student B ─┤
Student C ─┼── same question
Student D ─┘
```

Without deduplication, each request may trigger an expensive agent/LLM
pipeline.

With a Redis lock:

``` text
A → acquire lock → execute → cache result

B → sees lock
C → sees lock
D → sees lock

After result is cached:

B/C/D → read cached result
```

A Redis atomic `SET NX` style lock with expiration is sufficient for the
initial implementation.

------------------------------------------------------------------------

## 10. Persistence

MongoDB is used only for lightweight application persistence.

Suggested collections:

### `chat_sessions`

``` text
sessionId
subject
messages[]
createdAt
updatedAt
```

### `query_logs` (optional lightweight logging)

``` text
query
subject
intent
agentsUsed[]
cacheHit
latencyMs
createdAt
```

The project does not require a complex relational data model.

------------------------------------------------------------------------

## 11. API Boundary

The core API can remain small.

``` text
POST /api/v1/chat
GET  /api/v1/chat/:sessionId
GET  /api/v1/subjects
GET  /api/v1/health
```

Example request:

``` json
{
  "sessionId": "abc123",
  "subject": "DBMS",
  "message": "Explain normalization"
}
```

Example response:

``` json
{
  "answer": "...",
  "sources": [
    {
      "title": "DBMS Unit 3 Faculty Slides",
      "page": 18,
      "category": "lecture_slide"
    }
  ],
  "intent": "doubt",
  "agentsUsed": [
    "retriever",
    "doubt_solver"
  ]
}
```

------------------------------------------------------------------------

## 12. Frontend Architecture

The frontend intentionally remains minimal.

### Main screen

``` text
┌────────────────────────────────────────────────────┐
│ ExamPrep AI                    Subject: [DBMS ▼]  │
├──────────────┬─────────────────────────────────────┤
│              │                                     │
│ + New Chat   │          Chat Messages              │
│              │                                     │
│ Recent Chats │ User: Explain normalization         │
│              │                                     │
│ • DBMS       │ AI: Normalization is...             │
│ • CN         │                                     │
│              │ Sources:                             │
│              │ • DBMS Unit 3 PPT                    │
│              │ • PYQ 2024                           │
│              │                                     │
│              ├─────────────────────────────────────┤
│              │ Ask your question...          [➤]  │
└──────────────┴─────────────────────────────────────┘
```

No heavy dashboard or multiple feature pages are required.

------------------------------------------------------------------------

## 13. Technology Stack

  Layer                 Technology
  --------------------- --------------------------------------
  Language              TypeScript
  Backend               Node.js + Express
  Frontend              React + Tailwind CSS
  Agent/RAG framework   LangChain.js
  LLM                   Groq
  Structured output     Zod
  Vector DB             Qdrant
  Embeddings            Local/free embedding model initially
  Cache                 Redis
  Persistence           MongoDB
  Tracing               LangSmith
  Containerization      Docker

LangGraph is intentionally not part of the implementation.

------------------------------------------------------------------------

## 14. Design Principles

### Keep the agent boundaries meaningful

An agent should exist because it has a distinct responsibility.

### Prefer deterministic code where possible

PYQ frequency is calculated using normal TypeScript logic rather than
asking an LLM to count questions.

### Use LLMs for reasoning

LLMs are used for:

-   routing
-   explanations
-   prediction reasoning
-   synthesis

### Preserve evidence

Every RAG answer should retain source metadata.

### Cache repeated work

Exam traffic is expected to contain many repeated questions.

### Keep infrastructure proportional

The project is a modular monolith, not a collection of unnecessary
microservices.

------------------------------------------------------------------------

## 15. Failure Boundaries

Expected failure points:

``` text
Groq unavailable
      │
      ▼
Retry / graceful error

Qdrant unavailable
      │
      ▼
Clear retrieval failure

Redis unavailable
      │
      ▼
Skip cache and continue when possible

MongoDB unavailable
      │
      ▼
Chat persistence unavailable,
core AI flow can be isolated from it
```

The system should not treat Redis as a hard dependency for correctness.

------------------------------------------------------------------------

## 16. Deployment Model

Initial deployment can be simple:

``` text
React
  │
  ▼
Node/Express
  │
  ├── Redis
  ├── MongoDB
  ├── Qdrant
  └── Groq API
```

Docker Compose can be used for local development.

The architecture can later be separated into services only if actual
traffic or operational requirements justify it.
