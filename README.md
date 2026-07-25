# LifeOS v3

A focused life management frontend application built with Next.js. Combines task and habit tracking, daily planning, and note-taking with a context-aware UI designed for an AI assistant.

## 🚀 Features

- **Dashboard** - Unified view of your day — habits, todos, planner, and water intake at a glance.
- **Task Management** - Full todo list with priorities and a daily planner
- **Habit Tracking** - Build streaks, visualise last-7-day completion grids, get milestone insights
- **Note Taking** - Create and organise notes with markdown support
- **AI Chat** - Context-aware assistant UI (ready for backend integration)
- **Offline Support** - Progressive Web App with offline capabilities

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript
- **UI Library**: Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **PWA**: @ducanh2912/next-pwa
- **Drag & Drop**: dnd-kit

## 📋 Prerequisites

- **Node.js 18** or higher
- **Firebase Project** (for authentication)

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd LifeOS-v3
```

### 2. Frontend Setup

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
   NEXT_PUBLIC_USE_MOCK_API=true # Enable if running offline without backend
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:9002` (or 3000 depending on config)

## 📦 Building for Production

### Frontend

```bash
cd frontend
npm run build
npm start
```

## 🤖 AI Architecture (Frontend Integration)

The AI chat UI supports streaming updates and can be linked to a compatible chat backend supporting SSE (Server-Sent Events) for real-time model token streaming.

## 🔒 Security

- Firebase Authentication for user management
- Environment-based configuration — no secrets in source control

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run test
```

## 📱 Progressive Web App

The application can be installed as a PWA on supported devices:
- Offline functionality
- Push notifications interface
- Native app experience

## 🆘 Troubleshooting

### Frontend Build Errors
- Clear Next.js cache: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Built with ❤️ for better life management**
