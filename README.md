# AI RAG Chatbot

Production-grade Retrieval-Augmented Generation chatbot with PDF ingestion, vector search, and real-time streaming.

![Tech Stack](https://img.shields.io/badge/React-TypeScript-blue?logo=react) ![Backend](https://img.shields.io/badge/FastAPI-Python-green?logo=fastapi) ![Database](https://img.shields.io/badge/PostgreSQL-pgVector-blue?logo=postgresql) ![AI](https://img.shields.io/badge/OpenAI-Compatible-black?logo=openai)

## Features

- **JWT Authentication** — Signup/login with bcrypt hashing
- **PDF Upload & Parsing** — PyMuPDF text extraction + chunking
- **Embedding Generation** — OpenAI-compatible API (supports Azure OpenAI, custom endpoints)
- **Vector Search** — pgVector cosine similarity across all user documents
- **RAG Chat** — Context-augmented prompts to any OpenAI-compatible LLM
- **SSE Streaming** — Real-time token streaming via Server-Sent Events
- **Conversation History** — Multiple chat sessions with persistent messages
- **Source Attribution** — See which document pages informed each response
- **Storage Abstraction** — Local filesystem now, Azure Blob ready (swap one env var)

## Architecture

```
Frontend (React+TS+Vite) ←→ FastAPI Backend
                                  │
  auth_service ──── document_service ──── embedding_service
  chat_service ──── vector_search_service ──── storage_service
                                  │
                    PostgreSQL 16 + pgVector
```

## Quick Start

### 1. Database
```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # Edit: set OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install && npm run dev
```

Open **http://localhost:5173** → Sign up → Upload PDFs → Chat

### 4. (Optional) Seed PDF
```bash
python scripts/create_seed_pdf.py
```

## Full Docker Deployment
```bash
docker compose up --build
```
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/docs |

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/signup` | No | Create account |
| POST | `/api/v1/auth/login` | No | Get JWT token |
| GET | `/api/v1/auth/me` | Yes | Current user |
| POST | `/api/v1/documents/upload` | Yes | Upload PDF |
| GET | `/api/v1/documents/` | Yes | List documents |
| GET | `/api/v1/documents/{id}` | Yes | Get document |
| DELETE | `/api/v1/documents/{id}` | Yes | Delete document |
| POST | `/api/v1/chat/send` | Yes | Send message (SSE) |
| GET | `/api/v1/chat/conversations` | Yes | List conversations |
| GET | `/api/v1/chat/conversations/{id}` | Yes | Get conversation |
| PATCH | `/api/v1/chat/conversations/{id}` | Yes | Rename conversation |
| DELETE | `/api/v1/chat/conversations/{id}` | Yes | Delete conversation |
| GET | `/api/v1/health` | No | Health check |

## AI Provider Config

**OpenAI:** `AI_PROVIDER=openai` + `OPENAI_API_KEY=sk-...`
**Azure:** `AI_PROVIDER=azure` + Azure env vars
**Custom (Ollama etc):** `OPENAI_BASE_URL=http://localhost:11434/v1`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Zustand |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2 |
| Database | PostgreSQL 16 + pgVector |
| Auth | JWT (PyJWT + passlib bcrypt) |
| AI | OpenAI-compatible API |
| PDF | PyMuPDF |
| Streaming | SSE |

## License
MIT
