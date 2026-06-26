# LifeOS v3

A focused life management application built with Spring Boot and Next.js. Combines task and habit tracking, daily planning, and note-taking with a context-aware AI assistant that understands your schedule, habits, and notes in real time.

## 🚀 Features

- **Dashboard** - Unified view of your day — habits, todos, planner, and water intake at a glance
- **Task Management** - Full todo list with priorities and a daily planner
- **Habit Tracking** - Build streaks, visualise last-7-day completion grids, get milestone insights
- **Note Taking** - Create and organise notes with markdown support; notes are fully searchable by the AI
- **AI Chat** - Context-aware assistant powered by a 3-layer RAG system (vector search + live SQL snapshots + long-term memory extraction)
- **Notifications** - Web push notifications with insight-driven alerts (streak breaks, milestones, overdue todos)
- **Offline Support** - Progressive Web App with offline capabilities

## 🏗️ Tech Stack

### Backend
- **Framework**: Spring Boot 4.0.3
- **Language**: Java 17
- **Database**: PostgreSQL 16
- **Migration**: Flyway
- **Authentication**: Firebase Auth
- **Security**: AES encryption for sensitive data
- **Push Notifications**: Web Push (VAPID)
- **Containerization**: Docker

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript
- **UI Library**: Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **PWA**: @ducanh2912/next-pwa
- **AI Integration**: Google Generative AI
- **Drag & Drop**: dnd-kit

## 📋 Prerequisites

- **Java 17** or higher
- **Node.js 18** or higher
- **PostgreSQL 16** (or use Docker)
- **Maven** (bundled with project)
- **Firebase Project** (for authentication)

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd LifeOS-v3
```

### 2. Backend Setup

#### Option A: Using Docker (Recommended)

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

   ```powershell
   # Windows PowerShell
   Copy-Item .env.example .env
   ```

3. Edit `.env` and configure your settings:
   - Database credentials
   - Firebase service account
   - Encryption key
   - VAPID keys for push notifications

4. Place your `firebase-service-account.json` in `backend/src/main/resources/`

5. Start services with Docker Compose:
   ```bash
   docker-compose up -d
   ```

The backend will be available at `http://localhost:8000`

#### Option B: Local Development

1. Install PostgreSQL 16 and create database:
   ```sql
   CREATE DATABASE lifeos;
   ```

2. Navigate to backend directory:
   ```bash
   cd backend
   ```

3. Copy environment template:
   ```bash
   cp .env.example .env
   ```

   ```powershell
   # Windows PowerShell
   Copy-Item .env.example .env
   ```

4. Update `src/main/resources/application.yaml` with your database credentials

5. Place your `firebase-service-account.json` in `src/main/resources/`

6. Build and run:
   ```powershell
   # Windows (PowerShell/CMD)
   .\mvnw.cmd clean install
   .\mvnw.cmd spring-boot:run
   ```

   ```bash
   # macOS/Linux/Git Bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```

### 3. Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file with your configuration:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   # ... other Firebase config
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:9002`

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_DB` | PostgreSQL database name | Yes |
| `POSTGRES_USER` | PostgreSQL username | Yes |
| `POSTGRES_PASSWORD` | PostgreSQL password | Yes |
| `ENCRYPTION_SECRET_KEY` | AES encryption key (Base64) | Yes |
| `VAPID_PUBLIC_KEY` | VAPID public key for push notifications | Optional |
| `VAPID_PRIVATE_KEY` | VAPID private key for push notifications | Optional |

### Generating Encryption Key

```bash
# Generate a 256-bit AES key
openssl rand -base64 32
```

### Generating VAPID Keys

```bash
# Generate VAPID keys for web push notifications
npx web-push generate-vapid-keys
```

## 📦 Building for Production

### Backend

```bash
cd backend
./mvnw clean package -DskipTests
```

The JAR file will be created in `target/backend-0.0.1-SNAPSHOT.jar`

### Frontend

```bash
cd frontend
npm run build
npm start
```

## 🐳 Docker Deployment

Build and run the entire stack:

```bash
cd backend
docker-compose up --build
```

Services:
- PostgreSQL: `localhost:5432`
- Backend API: `localhost:8000`

For frontend, configure a separate container or deploy to Vercel/Netlify.

## 🤖 AI Architecture

The AI chat assistant uses a three-layer context assembly pipeline built on top of PostgreSQL + pgvector:

- **Layer 1 — RAG / Vector Search**: every note, todo, habit, planner item, and past conversation is embedded on save and stored in pgvector. On each message the user's query is vectorised and the top semantically similar chunks are retrieved via cosine similarity, merged with BM25-scored conversation memories, and ranked by a composite score (similarity × quality × recency × access-boost).
- **Layer 2 — Structured SQL Snapshots**: a fast keyword-based intent classifier (HABITS / TODOS / SCHEDULE / NOTES / GENERAL) gates targeted SQL queries so the AI always sees live, exact data — current streak counts, today's schedule, pending todos.
- **Layer 3 — Memory Graph Profile**: facts learned from past conversations (name, preferences, life events) are extracted asynchronously after each chat turn and injected as a persistent user profile on every future request.

After each response the system asynchronously extracts new user facts, embeds the conversation turn, and evaluates RAG quality (faithfulness, answer relevancy, context precision).

## 📚 API Documentation

The backend exposes RESTful APIs for:
- User management and admin
- Tasks and todos
- Habits
- Daily planner
- Notes
- Notifications and web push
- AI chat (streaming SSE + conversation history)
- User preferences and profile

See [API_CONTRACT.md](frontend/src/services/API_CONTRACT.md) for detailed API documentation.

## 🔒 Security

- Firebase Authentication for user management (JWT validated on every request)
- CORS configured for frontend origin
- All data scoped strictly to the authenticated user's UID
- Environment-based configuration — no secrets in source control

## 🧪 Testing

### Backend
```bash
cd backend
./mvnw test
```

### Frontend
```bash
cd frontend
npm run test
```

## 📱 Progressive Web App

The application can be installed as a PWA on supported devices:
- Offline functionality
- Push notifications
- Native app experience

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🆘 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env` or `application.yaml`
- Verify connection string format

### Firebase Authentication Errors
- Verify `firebase-service-account.json` is in the correct location
- Check Firebase project configuration
- Ensure Firebase Auth is enabled in your project

### Frontend Build Errors
- Clear Next.js cache: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

### Maven Wrapper Error on Windows
- Symptom: `'powershell' is not recognized` followed by `Cannot start maven from wrapper`
- Cause: Maven wrapper launcher cannot find a PowerShell executable from `PATH`
- Fix in this repository: `backend/mvnw.cmd` now checks `powershell`, `pwsh`, and `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe`
- Run commands from `backend`:
   - `./mvnw.cmd -v`
   - `./mvnw.cmd clean install -DskipTests`
   - `./mvnw.cmd spring-boot:run`

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Built with ❤️ for better life management**
