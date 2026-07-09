# FitnessTracker AI — Full-Stack Demo

A production-quality, AI-powered fitness tracking application built with **FastAPI** (Python) and **React Native** (Expo).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Frontend | React Native + Expo + Expo Router |
| State Management | Zustand + React Query |
| UI | NativeWind (Tailwind) + Victory Charts |
| Backend API | FastAPI + SQLAlchemy + Alembic |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (access + refresh tokens) |
| AI | OpenAI / Gemini / Ollama (configurable) |
| Containerization | Docker + Docker Compose |

---

## Project Structure

```
fitness-tracker/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/v1/           # REST endpoints
│   │   ├── ai/               # AI provider abstractions
│   │   ├── auth/             # JWT + bcrypt
│   │   ├── core/             # Config + exceptions
│   │   ├── database/         # SQLAlchemy session + init
│   │   ├── middleware/        # Logging + CORS
│   │   ├── models/           # ORM models
│   │   ├── repositories/     # Data access layer
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   └── utils/            # Helpers + constants
│   ├── alembic/              # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── fitness-app/              # React Native app
│   ├── src/
│   │   ├── app/              # Expo Router screens
│   │   ├── components/       # UI + cards + charts
│   │   ├── hooks/            # React Query hooks
│   │   ├── services/         # API client layer
│   │   ├── store/            # Zustand stores
│   │   └── theme/            # Design system tokens
│   └── package.json
└── docker-compose.yml
```

---

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env       # fill in your AI API key
pip install -r requirements.txt
python -m app.main         # starts on http://localhost:8000
# API docs: http://localhost:8000/docs
```

### Mobile App

```bash
cd fitness-app
npm install
npx expo start             # scan QR with Expo Go
```

### Docker

```bash
# Copy and fill env
cp backend/.env.example backend/.env

# Start backend + local AI (Ollama)
docker compose --profile local-ai up

# Or with cloud AI (set OPENAI_API_KEY in env)
docker compose up
```

---

## AI Provider Configuration

Set `AI_PROVIDER` in `.env`:

| Value | Provider | Required key |
|---|---|---|
| `openai` | OpenAI GPT-4o | `OPENAI_API_KEY` |
| `gemini` | Google Gemini | `GEMINI_API_KEY` |
| `ollama` | Local Ollama | None (run Ollama locally) |

---

## Architecture Decisions

- **Clean Architecture**: API → Service → Repository → Database. No leakage across layers.
- **Repository Pattern**: Each domain has a typed async repository extending `BaseRepository[T]`. Tests can inject a fake repo without touching the DB.
- **AI Provider Pattern**: `AIProvider` abstract base class + factory. New LLM = new file + one factory branch.
- **UUID PKs**: All tables use string UUIDs for PostgreSQL compatibility and distributed ID generation.
- **React Query**: All server state lives in the React Query cache. Zustand only holds UI state and auth tokens.
- **Token refresh**: Axios interceptor silently refreshes the access token on 401 — the user never sees an auth error unless the refresh token itself expires.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Get JWT tokens |
| GET | `/api/v1/auth/me` | Current user |
| PATCH | `/api/v1/users/me` | Update profile |
| GET | `/api/v1/workouts/exercises` | Exercise library |
| POST | `/api/v1/workouts/logs` | Start workout |
| POST | `/api/v1/meals/logs` | Log meal |
| GET | `/api/v1/meals/summary?date=YYYY-MM-DD` | Daily nutrition |
| POST | `/api/v1/water` | Log water |
| GET | `/api/v1/water/summary?date=YYYY-MM-DD` | Daily water |
| POST | `/api/v1/weight` | Log weight |
| GET | `/api/v1/weight/progress` | Weight trend + BMI |
| POST | `/api/v1/habits/{id}/log` | Check-in habit |
| POST | `/api/v1/ai/chat` | AI Coach chat |
| GET | `/api/v1/ai/weekly-summary` | Weekly AI analysis |

Full interactive docs at `/docs` (Swagger) or `/redoc`.
