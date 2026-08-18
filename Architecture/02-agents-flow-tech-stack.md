# ExamPrep AI --- Complete Agent Flow, Technology Usage & Solution Design

## 1. Problem the System Solves

Students usually have the required exam material scattered across:

-   syllabus
-   previous year papers
-   faculty slides
-   class notes

A normal chatbot does not know which material is relevant to the
student's specific course or exam.

ExamPrep AI creates a course-specific knowledge layer and combines it
with specialized AI capabilities.

The core question is:

> "Given this student's exam-related query, what information or
> reasoning capability is actually required?"

------------------------------------------------------------------------

# 2. End-to-End Flow

``` text
Student
   │
   ▼
React Chat UI
   │
   ▼
Express API
   │
   ▼
Query Normalization
   │
   ▼
Redis Cache
   │
   ├──────── HIT ────────► Response
   │
   ▼ MISS
Query Router
   │
   ├──── Retrieval ─────► Retriever Agent
   │
   ├──── Weightage ─────► Weightage Agent
   │                           │
   │                           ▼
   │                     Predictor Agent
   │
   └──── Doubt ─────────► Doubt Solver
                               │
                               ▼
                            Qdrant
                               │
                               ▼
                              Groq
                               │
                               ▼
                       Response Generator
                               │
                               ▼
                            Citations
                               │
                               ▼
                           Redis SET
                               │
                               ▼
                            MongoDB
                               │
                               ▼
                            Student
```

------------------------------------------------------------------------

# 3. Query Router

## Responsibility

The router determines:

-   what the student is asking
-   which subject is involved
-   which topic is involved
-   which agents are required

It should not answer the question.

### Example

Input:

``` text
"DBMS me normalization samjhao"
```

Structured output:

``` json
{
  "intent": "doubt",
  "subject": "DBMS",
  "topics": ["normalization"],
  "agents": [
    "retriever",
    "doubt_solver"
  ]
}
```

Another input:

``` text
"DBMS ke important topics batao"
```

Output:

``` json
{
  "intent": "weightage",
  "subject": "DBMS",
  "topics": [],
  "agents": [
    "weightage"
  ]
}
```

Another:

``` text
"Is baar DBMS me kya aa sakta hai?"
```

Output:

``` json
{
  "intent": "prediction",
  "subject": "DBMS",
  "topics": [],
  "agents": [
    "weightage",
    "predictor"
  ]
}
```

------------------------------------------------------------------------

# 4. How the Router is Implemented

Use LangChain.js with structured output.

Zod schema:

``` ts
const routeSchema = z.object({
  intent: z.enum([
    "retrieval",
    "weightage",
    "prediction",
    "doubt",
    "multi_intent"
  ]),
  subject: z.string(),
  topics: z.array(z.string()),
  agents: z.array(
    z.enum([
      "retriever",
      "weightage",
      "predictor",
      "doubt_solver"
    ])
  )
});
```

The LLM generates structured routing information.

Then TypeScript controls execution:

``` ts
if (route.agents.includes("retriever")) {
  // run retriever
}

if (route.agents.includes("weightage")) {
  // run weightage
}

if (route.agents.includes("predictor")) {
  // run predictor
}

if (route.agents.includes("doubt_solver")) {
  // run doubt solver
}
```

This gives multi-agent behavior without requiring LangGraph.

------------------------------------------------------------------------

# 5. Retriever Agent

## Responsibility

Retrieve the most relevant course material.

It should answer:

> "What evidence do we have that can help answer this question?"

It does not need to write a long final response.

### Flow

``` text
Query
  │
  ▼
Embedding
  │
  ▼
Qdrant
  │
  ▼
Metadata Filters
  │
  ▼
Top-K Chunks
  │
  ▼
Relevant Evidence
```

### Example

Query:

``` text
"Explain deadlock prevention"
```

Retriever returns:

``` text
DBMS Unit 4 Faculty Slides
Slide 27

DBMS Class Notes
Page 12
```

------------------------------------------------------------------------

# 6. Retrieval Metadata

Each chunk should preserve:

``` ts
{
  subject: "DBMS",
  semester: 5,
  unit: "Unit 4",
  topic: "Deadlock",
  category: "lecture_slide",
  source: "DBMS Unit 4 Faculty Slides",
  year: 2025,
  documentId: "..."
}
```

This metadata enables:

-   filtering
-   citations
-   source display
-   debugging
-   topic analysis

------------------------------------------------------------------------

# 7. Doubt Solver Agent

## Responsibility

Turn retrieved course evidence into an understandable explanation.

### Flow

``` text
Student Question
       │
       ▼
Retriever
       │
       ▼
Relevant PPT / Notes
       │
       ▼
Prompt + Context
       │
       ▼
Groq
       │
       ▼
Exam-focused Explanation
```

### Prompt behavior

The model should:

-   use retrieved material as the primary source
-   avoid unsupported course-specific claims
-   explain in simple language
-   include examples
-   highlight important exam points
-   preserve citations

------------------------------------------------------------------------

# 8. Example Doubt Flow

Student:

> "Normalization kya hota hai?"

Router:

``` text
doubt
```

Agents:

``` text
retriever
doubt_solver
```

Retriever:

``` text
DBMS Unit 3 PPT
+
DBMS Class Notes
```

Doubt Solver:

``` text
Normalization is a database design technique...
```

Final response:

``` text
Normalization
-------------

Simple explanation...

Example...

Exam point:
Focus on 1NF, 2NF and 3NF.

Sources:
- DBMS Unit 3 Faculty Slides
- DBMS Class Notes
```

------------------------------------------------------------------------

# 9. PYQ Weightage Agent

## Responsibility

Determine which topics appear most frequently in historical PYQs.

This is deliberately implemented using deterministic logic.

### Pipeline

``` text
PYQ Dataset
    │
    ▼
Topic Metadata
    │
    ▼
Frequency Engine
    │
    ▼
Topic Counts
    │
    ▼
Ranking
    │
    ▼
Weightage Response
```

Example:

``` text
Normalization → 18
Transactions → 15
Indexing     → 11
SQL          → 8
ER Model     → 5
```

------------------------------------------------------------------------

# 10. Why Frequency Analysis Should Not Use an LLM

Counting is deterministic.

If 18 questions are tagged `Normalization`, the application should
calculate:

``` ts
normalizationCount = 18;
```

not ask an LLM:

> "How many times does normalization appear?"

This reduces:

-   cost
-   latency
-   hallucination risk

The LLM can be used only to explain the statistical result in natural
language.

------------------------------------------------------------------------

# 11. Predictor Agent

The predictor takes historical trends and produces likely exam
topics/question types.

Inputs:

``` text
PYQ frequency
+
Syllabus
+
Recent question patterns
+
Topic coverage
```

Output:

``` text
High Priority:
- Normalization
- Transactions
- Indexing

Likely question types:
- Explain 3NF
- Explain serializability
- Explain B+ tree
```

The system must explicitly frame this as a trend-based prediction.

It should never claim:

> "This exact question will definitely appear."

------------------------------------------------------------------------

# 12. Predictor Architecture

``` text
                 PYQ History
                      │
                      ▼
               Weightage Engine
                      │
                      ▼
                  Weightage
                      │
            ┌─────────┴─────────┐
            │                   │
            ▼                   ▼
        Syllabus           Recent PYQs
            │                   │
            └─────────┬─────────┘
                      ▼
                Predictor Agent
                      │
                      ▼
            Likely Topics / Types
```

------------------------------------------------------------------------

# 13. Multi-Agent Example

Question:

> "Normalization explain karo aur batao kitni baar PYQ me aaya."

Router:

``` text
retriever
doubt_solver
weightage
```

Execution:

``` text
Retriever
   │
   └──► Faculty PPT + Notes

Doubt Solver
   │
   └──► Explanation

Weightage
   │
   └──► 18 occurrences
```

Response Generator:

``` text
Normalization is...

It appeared approximately 18 times
in the selected PYQ dataset.

Sources:
...
```

------------------------------------------------------------------------

# 14. Caching

Redis is used because exam traffic is expected to be repetitive.

### Exact query cache

``` text
"Explain normalization"
```

First request:

``` text
MISS
→ Agent pipeline
→ Groq
→ Redis SET
```

Next requests:

``` text
HIT
→ Redis
→ response
```

------------------------------------------------------------------------

# 15. Query Normalization

Before generating a cache key:

``` text
"Explain Normalization"
" explain normalization "
"Explain normalization?"
```

should be normalized.

Example:

``` ts
function normalizeQuery(query: string) {
  return query
    .toLowerCase()
    .trim()
    .replace(/[?!.]+$/g, "")
    .replace(/\s+/g, " ");
}
```

Cache key:

``` text
answer:{subject}:{hash(normalizedQuery)}
```

------------------------------------------------------------------------

# 16. Request Deduplication

Exam-time burst:

``` text
A ─┐
B ─┤
C ─┼── same question
D ─┘
```

The first request obtains a Redis lock.

``` text
A → lock → execute → cache

B/C/D → wait/check cache
```

After the answer is stored:

``` text
B → cached response
C → cached response
D → cached response
```

This prevents unnecessary concurrent LLM calls.

------------------------------------------------------------------------

# 17. Chat History

Chat history is intentionally basic.

MongoDB stores:

``` ts
{
  sessionId,
  subject,
  messages: [
    {
      role: "user",
      content: "Explain normalization"
    },
    {
      role: "assistant",
      content: "..."
    }
  ]
}
```

This supports:

``` text
User:
Explain normalization.

User:
Give me an example.
```

The second message can use the previous conversation context.

No complex memory framework is necessary.

------------------------------------------------------------------------

# 18. Source / Citation Flow

RAG chunks contain source metadata.

The metadata follows the request:

``` text
Qdrant
  ↓
Retriever
  ↓
Agent context
  ↓
Response Generator
  ↓
Sources
```

Example:

``` text
Sources:
1. DBMS Unit 3 Faculty Slides — Slide 18
2. DBMS Class Notes — Page 12
3. DBMS PYQ — 2024
```

The application should not fabricate sources.

------------------------------------------------------------------------

# 19. LLM Usage

Groq is the initial LLM provider.

Use a small model for:

-   routing
-   simple classification
-   topic extraction

Use a stronger available model for:

-   doubt solving
-   prediction reasoning
-   final synthesis

Keep the provider behind an LLM module so the project can later switch
to another provider.

------------------------------------------------------------------------

# 20. LangChain.js Usage

LangChain.js should be used for:

-   LLM integration
-   prompts
-   structured outputs
-   document objects
-   embeddings
-   retrievers
-   agent/tool abstractions
-   RAG pipeline composition

Do not force every piece of business logic through LangChain.

Normal TypeScript is preferable for:

-   frequency calculations
-   cache logic
-   request deduplication
-   API handling
-   persistence
-   routing execution
-   application state

------------------------------------------------------------------------

# 21. Technology Responsibilities

  Technology         Responsibility
  ------------------ ------------------------------
  Node.js            Runtime
  Express            REST API
  TypeScript         Application logic
  LangChain.js       LLM/RAG/agent layer
  Groq               LLM inference
  Zod                Structured model outputs
  Qdrant             Vector retrieval
  Local embeddings   Embedding generation
  Redis              Cache + request locks
  MongoDB            Chat history
  React              Chat UI
  Tailwind           Basic styling
  LangSmith          Basic tracing
  Docker             Local environment/deployment

------------------------------------------------------------------------

# 22. Recommended Implementation Order

``` text
1. Project setup
       ↓
2. Data ingestion
       ↓
3. Qdrant retrieval
       ↓
4. Doubt Solver
       ↓
5. Retriever Agent
       ↓
6. PYQ frequency engine
       ↓
7. Weightage Agent
       ↓
8. Predictor Agent
       ↓
9. Query Router
       ↓
10. Response Generator
       ↓
11. Redis cache
       ↓
12. Request deduplication
       ↓
13. MongoDB chat history
       ↓
14. LangSmith tracing
       ↓
15. Basic React UI
```

Build the core RAG before building the multi-agent layer.

------------------------------------------------------------------------

# 23. Definition of Done

The system should successfully handle:

### Doubt

``` text
"Explain normalization"
```

### Retrieval

``` text
"Show me PYQs related to normalization"
```

### Weightage

``` text
"What are the most important DBMS topics?"
```

### Prediction

``` text
"What topics are likely to be important this exam?"
```

### Multi-intent

``` text
"Explain normalization and tell me how often it appeared in PYQs"
```

### Repeated query

``` text
Same question from multiple users
→ Redis cache
```

### Follow-up

``` text
"Explain normalization"
→
"Give me an example"
```

------------------------------------------------------------------------

# 24. Core Philosophy

The project should demonstrate:

``` text
RAG
+
Meaningful Agent Routing
+
Deterministic Analytics
+
LLM Reasoning
+
Caching
+
Real Student Use Case
```

The objective is not to build the biggest AI system.

The objective is to build a system where every architectural decision
has a clear reason.
