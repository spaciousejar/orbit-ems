# Orbit EMS

A modern Employee Management System built with React, Firebase, and Express. Orbit EMS provides comprehensive HR tools including attendance tracking, payroll management, performance reviews, recruitment, and AI-powered assistance.

## Features

- **Dashboard** - Real-time analytics and employee insights
- **Employee Directory** - Manage team profiles, roles, and departments
- **Attendance & Timesheets** - Track clock-ins, overtime, and generate reports
- **Leave Management** - Request, approve, and track time-off
- **Payroll** - Process salaries, bonuses, and tax deductions
- **Performance Reviews** - Set goals and track employee growth
- **Recruitment** - Job postings, applications, and interview scheduling
- **Training** - Create courses and track employee progress
- **Expense Management** - Submit and approve expense reports
- **Document Manager** - Upload and organize company documents
- **Shift Scheduler** - Plan and assign employee shifts
- **AI Assistant** - Gemini-powered chat for HR queries and assistance
- **Role-Based Access** - Admin, HR Manager, and Employee permissions
- **Dark/Light Theme** - System-aware theme switching

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, shadcn/ui, Motion
- **Backend:** Express.js, Node.js
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication (Google OAuth)
- **Storage:** Firebase Storage
- **AI:** Google Gemini API
- **Build:** Vite, Bun
- **Deployment:** Vercel

## Prerequisites

- [Bun](https://bun.sh/) v1.3+ (or npm/yarn)
- Firebase project with Firestore enabled
- Google Gemini API key
- Google OAuth credentials

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_FIRESTORE_DATABASE_ID=

# Server
GEMINI_API_KEY=
PORT=3001
```

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/orbit-ems.git
cd orbit-ems

# Install dependencies
bun install
```

## Running Locally

```bash
# Start both frontend and backend
bun run dev:full

# Or start them separately
bun run dev      # Frontend on http://localhost:5173
bun run start    # Backend on http://localhost:3001
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start Vite dev server |
| `bun run start` | Start Express backend |
| `bun run dev:full` | Start both frontend and backend concurrently |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run lint` | Run TypeScript type checking |

## API Routes

| Endpoint | Description |
|----------|-------------|
| `/api/users` | User management |
| `/api/attendance` | Attendance tracking |
| `/api/leaves` | Leave requests |
| `/api/holidays` | Holiday calendar |
| `/api/tasks` | Task management |
| `/api/payroll` | Payroll processing |
| `/api/performance` | Performance reviews |
| `/api/recruitment` | Job postings & applications |
| `/api/training` | Training programs |
| `/api/expenses` | Expense reports |
| `/api/documents` | Document storage |
| `/api/shifts` | Shift scheduling |
| `/api/timesheets` | Timesheet management |
| `/api/notifications` | Notifications |
| `/api/settings` | System settings |
| `/api/chat` | Gemini AI chat (streaming) |
| `/api/fast-chat` | Gemini AI quick responses |

## Deployment

### Vercel

1. Push to GitHub
2. Import repository in Vercel dashboard
3. Configure environment variables
4. Deploy automatically

The project includes `vercel.json` with:
- API route rewrites
- Serverless function configuration (512MB memory, 30s timeout)
- Static file serving from `dist/`

## Project Structure

```
orbit-ems/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application pages
│   ├── services/       # API service layer
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and helpers
│   └── types/          # TypeScript definitions
├── server/
│   ├── routes/         # Express API routes
│   └── firebase.js     # Server-side Firebase config
├── scripts/            # Build scripts
└── public/             # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
