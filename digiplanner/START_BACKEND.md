# How to Start the Backend

Since all backend files are in the `backend/` folder, here's how to start it:

## Quick Start (Easiest Method)

1. **Open Command Prompt or PowerShell in the project root** (`digiplanner/` folder)

2. **Install dependencies (first time only):**
```bash
pip install -r requirements.txt
```

3. **Start the backend:**
```bash
python run_backend.py
```

That's it! The backend will start on `http://localhost:5000`

## Alternative Methods

### Method 2: Direct Python Command

From the project root directory:
```bash
python backend/app.py
```

### Method 3: Using Flask CLI

1. **Set environment variable:**
```bash
# Windows Command Prompt
set FLASK_APP=backend.app

# Windows PowerShell
$env:FLASK_APP="backend.app"

# Linux/Mac
export FLASK_APP=backend.app
```

2. **Run Flask:**
```bash
flask run --host=0.0.0.0 --port=5000
```

## Project Structure

```
digiplanner/                    ← You should be HERE (project root)
├── backend/                    ← Backend files are here
│   ├── __init__.py
│   ├── app.py                 ← Main Flask application
│   └── config.py              ← Configuration
├── data/                      ← Data storage (created automatically)
│   ├── tasks.json
│   ├── calendar_notes.json
│   └── stats.json
├── run_backend.py             ← Use this script to start
└── requirements.txt           ← Python dependencies
```

## Verify Backend is Running

1. Open your browser
2. Visit: `http://localhost:5000/api/health`
3. You should see: `{"status": "healthy", "timestamp": "..."}`

## Important Notes

- ⚠️ **Always run from the project root** (`digiplanner/`), NOT from inside the `backend/` folder
- The `data/` folder will be created automatically in the project root
- Backend files stay in `backend/` folder - don't move them

## Troubleshooting

### "ModuleNotFoundError: No module named 'backend'"
**Solution:** Make sure you're in the project root directory, not inside `backend/`

### "Port 5000 already in use"
**Solution:** 
- Close other applications using port 5000, OR
- Change port in `run_backend.py`: `app.run(debug=True, host='0.0.0.0', port=5001)`

### "pip: command not found"
**Solution:** Install Python from python.org (includes pip)

### "Flask not found"
**Solution:** Install dependencies: `pip install -r requirements.txt`

## Complete Setup Example

```bash
# 1. Navigate to project root
cd digiplanner

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start backend
python run_backend.py

# You should see:
# ============================================================
# Smart Planner Backend Server
# ============================================================
# Starting server on http://localhost:5000
# ...
```

## Next Steps

Once backend is running, start the frontend (in a new terminal):

```bash
# In project root
python -m http.server 8000
```

Then open: `http://localhost:8000`