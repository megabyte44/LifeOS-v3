# LifeOS v3

A comprehensive life management application built with Spring Boot and Next.js, featuring task management, habit tracking, expense tracking, note-taking, password management, and AI-powered chat assistance.

## 🚀 Features

- **Dashboard** - Unified view of your daily activities and goals
- **Task Management** - Organize todos and manage your daily planner
- **Habit Tracking** - Build and track healthy habits
- **Goal Setting** - Set and monitor personal and professional goals
- **Expense Tracking** - Manage finances and track transactions
- **Note Taking** - Create and organize notes with markdown support
- **Password Manager** - Securely store and manage credentials
- **Gym Tracker** - Track workouts and fitness progress
- **AI Chat** - AI-powered assistant for productivity
- **Reminders** - Never miss important tasks
- **Notifications** - Web push notifications support
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

2. Copy environment template:
   ```bash
   cp .env.example .env
   ```

3. Update `backend/src/main/resources/application.yaml` with your database credentials

4. Place your `firebase-service-account.json` in `backend/src/main/resources/`

5. Build and run:
   ```bash
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

## 📚 API Documentation

The backend exposes RESTful APIs for:
- User management
- Tasks and todos
- Habits
- Goals
- Expenses/Transactions
- Notes
- Password manager (credentials)
- Gym workouts
- Notifications
- AI chat
- Preferences

See [API_CONTRACT.md](frontend/src/services/API_CONTRACT.md) for detailed API documentation.

## 🔒 Security

- Firebase Authentication for user management
- AES-256 encryption for sensitive data (passwords in password manager)
- CORS configured for frontend origin
- Secure password storage
- Environment-based configuration

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

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Built with ❤️ for better life management**
