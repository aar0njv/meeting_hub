# Meeting Intelligence Hub Design Document

## 1. Document Control

- Product: Meeting Intelligence Hub
- Version: 1.0
- Last updated: 2026-04-07
- Status: Active implementation-aligned design
- Audience: Engineers, reviewers, technical stakeholders, maintainers

## 2. Executive Summary

Meeting Intelligence Hub converts raw meeting transcripts into structured insights and interactive knowledge using a multi-tier microservice architecture:

1. A Node.js API handles secure data operations, user sessions, and file routing via Supabase.
2. A Python AI microservice processes transcripts to automatically extract Action Items, Decisions, and Focus Scores.
3. An embedded RAG (Retrieval-Augmented Generation) Chatbot allows users to query transcript context instantly.

The system is built with a React frontend (Vite), an Express Node.js backend, and a FastAPI vector microservice processing LLM pipelines with Google GenAI.

## 3. Problem Statement

Teams often waste valuable hours after meetings manually summarizing discussions, assigning action items, and scrolling endlessly through raw transcripts to find past decisions. Traditional meeting notes lack context, and searching for specific insights is slow and inefficient. 

Meeting Intelligence Hub addresses this by providing a centralized, automated way to extract actionable intelligence from meeting text instantly.

## 4. Goals and Non-Goals

### 4.1 Goals

- Automatically generate insights (decisions, action items, focus scores) from uploaded meeting transcripts.
- Enable contextual Q&A against past meetings using an embedded RAG AI chatbot.
- Securely store and associate transcripts with authenticated user profiles.
- Containerize all services using Docker Compose for seamless deployment and operation.
- Implement automated Continuous Integration (CI/CD) pipelines for code quality and build verification.
- Provide a clean, modern dashboard interface for navigating past meetings.

### 4.2 Non-Goals (Current Version)

- Live audio/video transcription (requires pre-generated text transcripts).
- Direct bot integrations with video conferencing software (e.g., Zoom/Teams ingest).
- Asynchronous job queues for background processing (processes currently run synchronously).
- Multi-tenant enterprise governance and role-based access control (RBAC).

## 5. Scope

### In Scope

- Meeting transcript ingestion, validation, and storage.
- AI-driven extraction of key meeting insights.
- Vectorization and semantic search capabilities via ChromaDB.
- Frontend dashboard with a dedicated chatbot UI pane.
- Supabase PostgreSQL integration with Row Level Security (RLS).
- Automated CI/CD workflows using GitHub Actions for testing and container validation.

### Out of Scope

- Real-time speech-to-text.
- Automated email or Slack distribution of action items.
- Deep, real-time multi-user collaboration (like commenting directly on transcripts).

## 6. System Context and Flow

### 6.1 High-Level Flow

1. User uploads a meeting transcript via the React frontend.
2. The Node.js backend validates the meeting ID and manages data ingestion into Supabase PostgreSQL.
3. The Node.js backend forwards the payload to the FastAPI AI microservice for processing and vectorization (`/analyze` and `/vectorize`).
4. The AI service processes the text with Google GenAI to extract structured decisions and action items, while embedding chunks into a local ChromaDB instance.
5. The AI service returns the insights to the Node.js backend, which finalizes the database commit.
6. When the user opens the Chatbot to ask a question, the query is routed to the AI service via `/chat`, performs RAG using ChromaDB against the specific meeting ID, and returns the response.

### 6.2 Architectural Pattern

- Pattern: Multi-tier microservices with an embedded vector database layout.
- Orchestration style: Event-driven API execution across dependent containers.
- Delivery style: HTTP REST APIs for CRUD operations and processing.

## 7. Functional Requirements

### FR-1: Source Ingestion

- Accept raw `.txt` or `.md` transcript files from the user UI.
- Validate payload and meeting association in the Node.js backend.

### FR-2: AI Extraction Service

- Extract structured core facts (decisions, action items) dynamically using prompt instructions.
- Analyze topics to assign an overall meeting Focus Score.
- Fall back gracefully if the LLM output fails validation.

### FR-3: RAG Chatbot

- Receive a natural language user query.
- Convert query to embedding and retrieve top-*k* relevant transcript chunks from ChromaDB.
- Generate context-aware response using GenAI based specifically on retrieved context, ensuring the AI cites original transcript filenames.

### FR-4: Secure Storage

- Leverage Supabase Row Level Security (RLS) so users only access their own meetings.
- Overcome write policies on the backend securely using a Service Role Key.

### FR-5: Container Orchestration & CI/CD

- Run the frontend dashboard, Express backend, and FastAPI microservice securely via Docker Compose.
- Automatically validate backend/frontend dependency installation and Docker image compilation on every push and pull request via GitHub Actions.

## 8. Non-Functional Requirements

- Reliability: Graceful error handling for LLM timeouts or structural parsing failures.
- Security: Secure handling of API keys using strictly ignored `.env` environments.
- Usability: Responsive, collapsible dashboard layout tailored for complex data viewing.
- Portability: Dockerized application ensuring environmental parity across macOS, Windows, and Linux.
- Maintainability: Strict separation of concerns (Node.js for DB/auth operations vs. Python for math/vectors/LLM logic).

## 9. Component Design

## 9.1 Backend (Node.js)

### Framework and API Layer

- Framework: Express.js
- Primary endpoints managed:
  - `POST /api/meetings`
  - `POST /api/upload-transcript`
  - `GET /api/meetings/:id`

### Orchestration & State

- Relies on normalized Supabase tables for relational queries.
- Synchronous block waiting for FastAPI microservice to return structured metadata before returning 200 OK to the client.

## 9.2 AI Microservice (Python)

### Agent Operations

- Framework: FastAPI via Uvicorn
- Base Models: Google Gemini (`gemini-2.5-flash`), with open compatibility for OpenAI.
- Output constraints: Strictly parses and returns JSON shapes containing `decisions`, `action_items`, `segments`, and `sentiment`.
- Internal Endpoints:
  - `POST /analyze`
  - `POST /vectorize`
  - `POST /chat`

### Vector Storage

- Provider: ChromaDB (Local filesystem volume)
- Embeddings: `sentence-transformers` utilizing PyTorch natively.
- Retrieval Strategy: Filtered vector nearest-neighbor search bound by meeting ID.

## 9.3 Frontend

- Framework: React (via Vite build tool)
- UI/Styling: Custom CSS, embedded HTML/JS modularization.
- State management: Standard React Context and Hooks.
- UX patterns:
  - Interactive transcript view next to an embedded chat widget.
  - Distinct data visualization (Sentiment Analysis and Focus Score) charts using Recharts.

## 10. API Contract Summary

### 10.1 `POST /api/upload-transcript` (Node.js)

Request:

- meetingId: string
- transcript_text (via Multer form load)

Response:

- Inserts data into Supabase and returns the extracted AI insights JSON.

### 10.2 `POST /analyze` (FastAPI)

Request shape:

- transcript: string

Response shape:

- decisions: array
- action_items: array
- segments: array
- focus_score: integer
- sentiment: string

### 10.3 `POST /vectorize` (FastAPI)

Request shape:

- transcript_id: string
- filename: string
- content: string

Response form: Inserts text chunks into ChromaDB and returns `{"status": "success", "chunks_added": int}`.

### 10.4 `POST /chat` (FastAPI)

Request shape:

- question: string
- transcript_ids: array (optional)
- transcript_content: string (optional)

Response form: Generative response created from local ChromaDB semantic matches mapping the exact `sources_used`.

## 11. Tech Stack Chosen and Rationale

### Backend

- Node.js + Express
- Supabase (PostgreSQL)

Why:

- Node combined with Supabase offers the fastest integration for DB operations and Row Level Security without standing up custom auth services.

### AI Microservice

- Python 3 + FastAPI
- ChromaDB, Sentence Transformers

Why:

- Python has a native, unmatched ecosystem for machine learning, vector arithmetic, and robust LLM orchestration. 
- Separation of concerns: keeps expensive Python-based ML overhead isolated from high-volume database CRUD operations.

### Frontend

- React.js + Vite

Why:

- Rapid UI compilation and hot-reloading. Strong ecosystem for data tables and charts (Recharts).

### Models

- Gemini 2.5 Flash

Why:

- Highly efficient reasoning speed combined with a massive context window natively suited for digesting large transcript blocks.

## 12. Trade-offs Made

### 12.1 Local Chroma DB vs Cloud Vector Store

- Decision: Use a localized instance of ChromaDB stored on a Docker Volume.
- Benefit: Absolute privacy, zero network latency for retrieval, and zero recurring cloud costs.
- Cost: Makes horizontal scaling of the Python service trickier compared to leaning on a managed Pinecone or Weaviate cluster.

### 12.2 Sync vs Async Processing

- Decision: Synchronous response upon transcript upload.
- Benefit: Simplified mental model and frontend loading state (no WebSockets/polling required).
- Cost: Exceedingly long transcripts risk HTTP timeout gaps if the LLM takes over standard request limits.

## 13. Edge Case Handling

| Edge case | Detection | Handling |
|---|---|---|
| Transcript Too Large | Token count limit violation | Basic chunking arrays used natively before ingestion |
| Invalid Meeting ID | Database relational conflict | Node.js middleware catches and blocks Supabase write before proceeding |
| LLM Response Malformed | JSON parse validation failure | Try-catch block wraps the result and returns an empty structural state |
| Supabase RLS Conflict | Insert returns 401/403 | Elevated system procedures use the `SUPABASE_SERVICE_ROLE_KEY` internally to bypass |

## 14. Security and Privacy Considerations

- **Keys & Secrets**: Regulated exclusively by `.env` mechanisms. `node_modules` and `.env` are rigorously ignored in git.
- **Tenant Isolation**: Backend leverages Supabase Auth tokens alongside RLS policies to guarantee that user queries only cross sections of the DB they own.
- **Data Transfer**: Chatbot context queries do not blend organizational data due to hard filtering on `meeting_id` identifiers within ChromaDB collections.

Recommended hardening for production:

- Impose strict rate limiting on the `/chat` endpoints to discourage abuse.
- Move entirely to async processing to prevent Denial of Service via concurrent massive uploads.

## 15. Performance and Scalability

Current characteristics:

- Suitable for personal productivity to small-team internal deployment. 
- Scalable database via Supabase's managed Postgres instance.

Future scaling options:

- Transitioning FastAPI endpoints to offload transcript breakdown into a Redis/Celery queue.

## 16. Reliability and Recovery

- Microservices gracefully decline processing if the adjacent container is down.
- Persistent volumes ensure that the ChromaDB index survives container rebuilds.

## 17. Browser and UX Compatibility Notes

- Tested successfully in Chrome and standard Chromium-based distributions (Brave/Edge).
- Visual styling gracefully degrades for narrower viewports using responsive flex properties.

## 18. Testing Strategy

Recommended test matrix:

- Unit tests:
  - Parsing structural consistency in the Python LLM responses.
  - JWT token validation checks on the Node router.
- Integration tests:
  - Database commit -> FastAPI extraction -> Database update pipeline.
- CI/CD Verification:
  - Automated Node.js and Python environment installations checked via GitHub Actions.
  - Consistent compilation validation using `docker compose build` on main branch pushes.

## 19. Deployment and Configuration

### Continuous Integration (CI/CD)

The project leverages GitHub Actions (`.github/workflows/ci.yml`) to ensure repository health. Upon any push or pull request to the `main` branch, the automated pipeline:
1. Sets up Node.js v20 and strictly installs Backend and Frontend dependencies.
2. Compiles the React Vite frontend application to ensure there are no component-level syntax failures.
3. Sets up Python 3.10 and validates FastAPI AI constraints.
4. Completes an end-to-end sandbox build using `docker compose build` to rapidly identify containerization failures before any formal deployment.

### Required environment variables

- Node Backend `.env`:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `AI_SERVICE_URL`
- AI Service `.env`:
  - `GEMINI_API_KEY`
- Frontend `.env`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Runtime dependencies

- Docker runtime required for `docker-compose up --build`.

## 20. Known Limitations

- Direct live audio recording is unsupported.
- Re-running analysis on a transcript overrides prior insights rather than maintaining a historical versioned queue.

## 21. Future Enhancements

- **Advanced CI/CD Pipelines**: Expand the existing GitHub Actions setup to feature fully automated continuous deployment (CD) workflows pushing the Docker containers directly to cloud compute clusters (such as AWS ECS or GCP Cloud Run). Incorporate semantic release versioning and automated API contract testing directly into the CI pipeline.
- Integrate actual Audio to Text processing natively.
- Speaker diarization to detect who specifically was assigned an Action Item.
- Push intelligence automatically to tools like Slack, Notion, or Jira.

## 22. Conclusion

Meeting Intelligence Hub establishes a highly structured, scalable bridge between traditional CRUD web paradigms and modern RAG vector microservices. By cleanly separating the Node.js API logic from the Python data science tier, the architecture retains flexibility. The system is fundamentally resilient, prioritizing correct contextual retrieval overlaid with an elegant, responsive UI dashboard.
