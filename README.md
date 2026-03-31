# CampusTrack

CampusTrack is a college student productivity web app that helps students efficiently track assignments, tests, and exams — with smart priority ranking, a day-by-day study roadmap, and real-time notifications.

## Features

### Two User Roles
- **Teacher** — Post assignments, track submissions, schedule tests/exams/practicals
- **Student** — View tasks by priority, generate study roadmaps, sync to calendar, get notifications

### Teacher Portal
- Post assignments with: subject, type (assignment / project / lab record / quiz / test / practical), title, instructions, deadline, marks, submission format (soft copy PDF / hard copy spiral / hard copy hard binding / in-class), group or individual (with group size & topic allocation)
- Submission tracker per assignment — progress bar showing submitted vs pending, with per-student "Send Reminder" and bulk "Remind All Pending" buttons
- Add upcoming tests, model exams, and lab practicals with date, syllabus topics, and reference resources

### Student Dashboard
- Unified view of all assignments + tests sorted by deadline
- **Smart priority ranking** — tasks due soonest and highest marks weighted float to the top
- Calendar view — all deadlines and exam dates on a monthly grid
- Filters: All / Urgent / Assignments / Projects / Lab Records / Tests
- "DUE SOON" badge on anything within 5 days
- Submit assignments with a URL + notes modal

### Smart Study Roadmap
- Click any upcoming test to generate a day-by-day study plan from today until exam date
- Plan based on syllabus topics and resources the teacher entered
- 2 days before the exam: confidence check prompt — select unsure topics, plan auto-adjusts
- Each day: goal, topics to cover, resources, checkboxes to mark progress
- Final day is always Revision + Mock Practice
- Timeline UI with green (completed) / blue (today) / gray (upcoming) indicators

### Notifications System
- Students notified when: new assignment posted, deadline within 5 days, teacher sends a reminder
- Teachers notified when a student submits
- Unread notification badge on the bell icon

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT (role-based: teacher / student) |
| HTTP | Axios (frontend) |

## Project Structure

```
campustrack/
├── backend/
│   ├── migrations/
│   │   └── 001_initial.sql        # PostgreSQL schema
│   ├── src/
│   │   ├── db.js                  # PostgreSQL pool
│   │   ├── index.js               # Express entry point
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT middleware + requireRole
│   │   └── routes/
│   │       ├── auth.js            # /api/auth — register, login, me
│   │       ├── assignments.js     # /api/assignments — CRUD + notifications
│   │       ├── submissions.js     # /api/submissions — submit + tracker + remind
│   │       ├── tests.js           # /api/tests — tests/exams/practicals CRUD
│   │       ├── roadmap.js         # /api/roadmap — generate + track progress
│   │       └── notifications.js   # /api/notifications — list + mark read
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/axios.js            # Axios instance with auth interceptor
    │   ├── context/AuthContext.jsx # Auth state + login/logout
    │   ├── components/
    │   │   ├── NotificationBell.jsx  # Bell with unread count + dropdown
    │   │   └── TaskCard.jsx          # Reusable color-coded task card
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── teacher/
    │       │   ├── TeacherLayout.jsx
    │       │   ├── TeacherDashboard.jsx
    │       │   ├── PostAssignment.jsx
    │       │   ├── AssignmentsList.jsx
    │       │   ├── SubmissionTracker.jsx
    │       │   ├── PostTest.jsx
    │       │   └── TestsList.jsx
    │       └── student/
    │           ├── StudentLayout.jsx
    │           ├── StudentDashboard.jsx  # Priority-sorted task list
    │           ├── CalendarView.jsx      # Monthly deadline calendar
    │           ├── StudyRoadmap.jsx      # Day-by-day study timeline
    │           └── NotificationsPage.jsx
    ├── .env.example
    └── package.json
```

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database

```bash
psql -U postgres -c "CREATE DATABASE campustrack;"
psql -U postgres -d campustrack -f backend/migrations/001_initial.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database URL and JWT secret
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

**Environment variables (`backend/.env`):**
```
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/campustrack
JWT_SECRET=your_jwt_secret_here
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env if your backend runs on a different URL
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

**Environment variables (`frontend/.env`):**
```
VITE_API_URL=http://localhost:5000/api
```

## API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register (name, email, password, role) |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Get current user |

### Assignments
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/assignments` | All | List (priority-sorted) |
| POST | `/api/assignments` | Teacher | Create |
| GET | `/api/assignments/:id` | All | Get single |
| PUT | `/api/assignments/:id` | Teacher | Update |
| DELETE | `/api/assignments/:id` | Teacher | Delete |

### Submissions
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/submissions/assignments/:id/submit` | Student | Submit |
| GET | `/api/submissions/assignments/:id/submissions` | Teacher | View tracker |
| POST | `/api/submissions/assignments/:id/remind` | Teacher | Remind pending |

### Tests / Exams
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/tests` | All | List sorted by date |
| POST | `/api/tests` | Teacher | Create |
| GET | `/api/tests/:id` | All | Get single |
| PUT | `/api/tests/:id` | Teacher | Update |
| DELETE | `/api/tests/:id` | Teacher | Delete |

### Study Roadmap
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/roadmap/tests/:id/generate` | Student | Generate roadmap |
| GET | `/api/roadmap/tests/:id/roadmap` | Student | Get roadmap + progress |
| PUT | `/api/roadmap/tests/:id/roadmap/progress` | Student | Update progress / adjust plan |
| GET | `/api/roadmap/tests/:id/roadmap/status` | Student | Check 2-day confidence flag |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | List all |
| GET | `/api/notifications/unread-count` | Get unread count |
| PUT | `/api/notifications/:id/read` | Mark one read |
| PUT | `/api/notifications/read-all` | Mark all read |

## Color Coding

| Task Type | Color |
|-----------|-------|
| Assignment | Blue |
| Project | Purple |
| Lab Record | Green |
| Test / Quiz | Amber |
| Practical | Green |

## Design Principles
- Clean, minimal flat UI — no gradients or heavy shadows
- Mobile responsive with Tailwind CSS utility classes
- Color-coded task types with left border indicators
- Progress bars for submission tracking
- Vertical timeline for study roadmaps
