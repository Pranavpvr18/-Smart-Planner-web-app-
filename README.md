# Smart Planner – AI-Assisted Student Productivity System

A modern, fully responsive digital planner web app with calendar timeline, task manager, tick done system, and productivity analytics.

## Features

### Core Features
- ✅ Add, edit, delete, and complete tasks
- ✅ Priority levels (High / Medium / Low)
- ✅ Task categories: Homework, Exams, Projects, Revision, Personal, Goals/Habits
- ✅ Smart Calendar View: Monthly + Weekly + Daily views
- ✅ Today Dashboard with due soon tasks and progress tracking
- ✅ Focus Timer (Pomodoro technique)
- ✅ Activity Tracker: Task streaks, XP points, and levels (Gamification)
- ✅ Analytics Page with completion rates and productivity trends
- ✅ Search and Filter functionality
- ✅ Keyboard Shortcuts (A to add task, Space to complete)
- ✅ Offline-first PWA support

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Python Flask (optional, with localStorage fallback)
- **Storage**: JSON files (backend) or LocalStorage (frontend-only mode)
- **Libraries**:
  - Chart.js (for analytics)
  - Day.js (date/time utilities)
- **PWA**: Service Worker for offline functionality

## Installation

1. Clone or download this repository
2. Install Python dependencies (for backend):
```bash
pip install -r requirements.txt
```
3. No build process required - just open `index.html` in a modern browser
4. For PWA features, serve via HTTP(S) (not file://)

### Local Development Server

**Frontend Only (LocalStorage):**
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then open http://localhost:8000

**With Backend (Recommended):**
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start backend (Terminal 1)
python run_backend.py

# 3. Start frontend (Terminal 2)
python -m http.server 8000
```

See `START_BACKEND.md` for detailed backend setup instructions.

## Project Structure

```
digiplanner/
├── backend/            # Python Flask backend
│   ├── __init__.py
│   └── app.py         # Main Flask application
├── index.html          # Dashboard/Home page
├── dashboard.html      # Tasks list page
├── calendar.html       # Calendar views
├── analytics.html      # Analytics and charts
├── style.css           # Main stylesheet
├── calendar.css        # Calendar-specific styles
├── script.js           # Core functionality
├── api.js              # Backend API client
├── tasks.js            # Task management logic
├── analytics.js        # Analytics and charts
├── calendar-view.js    # Calendar rendering
├── calendar-notes.js   # Calendar notes feature
├── offline.js          # PWA offline support
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── run_backend.py     # Backend startup script
├── start_backend.bat  # Windows batch file
├── start_backend.ps1  # PowerShell script
├── requirements.txt    # Python dependencies
├── README.md          # Main documentation
├── START_BACKEND.md   # Backend setup guide
└── assets/
    └── icons/         # App icons (optional)
```

## Usage

### Adding Tasks
- Click the floating action button (+) or press `A`
- Fill in task details (title, category, priority, due date, notes)
- Click "Save Task"

### Completing Tasks
- Click on a task or its checkbox
- Completed tasks show confetti animation
- Gain XP points based on priority

### Calendar Views
- **Month View**: See all tasks for the month
- **Week View**: Detailed weekly timeline
- **Day View**: Hourly breakdown of tasks
- **Double-click any date** to add notes/tasks for that date

### Keyboard Shortcuts
- `A` - Add new task
- `Escape` - Close modal

### Analytics
- View completion rates by category
- Track productivity trends (last 30 days)
- See priority distribution
- Review time spent estimates

## Backend API

The backend provides RESTful APIs for tasks, calendar notes, and statistics. See `START_BACKEND.md` for setup and API documentation.

**Key Features:**
- Task CRUD operations
- Calendar date notes
- Statistics and analytics endpoints
- JSON file storage (easily upgradeable to database)

## Data Model

Tasks are stored in JSON files (backend) or LocalStorage (frontend-only) with the following structure:

```javascript
{
  id: "task_1234567890_abc123",
  title: "Math Homework",
  category: "Homework",
  priority: "High",
  dueDate: "2026-01-07",
  status: "pending" | "completed",
  notes: "Complete exercises 1-10",
  createdAt: "2026-01-01T10:00:00.000Z",
  completedAt: null
}
```

## Deployment

### Netlify
1. Connect your repository to Netlify
2. Set build command: (leave empty)
3. Set publish directory: `/` (root)
4. Deploy!

### GitHub Pages
1. Push code to GitHub
2. Go to repository Settings > Pages
3. Select source branch (usually `main`)
4. Your app will be live at `https://username.github.io/repository-name`

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Follow prompts

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Optional: Adding Icons

1. Create 192x192 and 512x512 PNG icons
2. Place them in `assets/icons/`:
   - `icon-192.png`
   - `icon-512.png`
3. The manifest.json is already configured

## Optional: Firebase Upgrade

The app is designed to work offline-first with LocalStorage. To add Firebase:

1. Create a Firebase project
2. Enable Firestore Database
3. Replace LocalStorage calls with Firestore operations
4. Add Firebase authentication for multi-user support

## License

MIT License - feel free to use and modify for your projects!

## Credits

- Icons: Emoji-based (📚, ✅, 📝, etc.)
- Fonts: Inter & Poppins (Google Fonts)
- Charts: Chart.js
- Date Library: Day.js

---

**Built with ❤️ for students everywhere**
# -Smart-Planner-web-app-
