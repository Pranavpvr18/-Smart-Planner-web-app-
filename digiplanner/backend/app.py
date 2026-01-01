"""
Smart Planner - Flask Backend API
Handles task management, calendar notes, and user statistics
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Data storage directory (relative to project root, not backend folder)
BASE_DIR = Path(__file__).parent.parent  # Go up from backend/ to project root
DATA_DIR = BASE_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)

TASKS_FILE = DATA_DIR / 'tasks.json'
CALENDAR_NOTES_FILE = DATA_DIR / 'calendar_notes.json'
STATS_FILE = DATA_DIR / 'stats.json'

def load_json(file_path, default=None):
    """Load JSON data from file"""
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return default if default is not None else []

def save_json(file_path, data):
    """Save JSON data to file"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# Initialize data files if they don't exist
if not TASKS_FILE.exists():
    save_json(TASKS_FILE, [])
if not CALENDAR_NOTES_FILE.exists():
    save_json(CALENDAR_NOTES_FILE, {})
if not STATS_FILE.exists():
    save_json(STATS_FILE, {
        'streak': 0,
        'xp': 0,
        'level': 1,
        'lastActivityDate': None,
        'totalTasks': 0,
        'completedTasks': 0
    })

# ============================================
# Tasks API Endpoints
# ============================================

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks"""
    tasks = load_json(TASKS_FILE, [])
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    data = request.get_json()
    
    task = {
        'id': f"task_{int(datetime.now().timestamp() * 1000)}_{os.urandom(4).hex()}",
        'title': data.get('title', ''),
        'category': data.get('category', 'Personal'),
        'priority': data.get('priority', 'Medium'),
        'dueDate': data.get('dueDate', ''),
        'status': data.get('status', 'pending'),
        'notes': data.get('notes', ''),
        'createdAt': datetime.now().isoformat(),
        'completedAt': data.get('completedAt')
    }
    
    tasks = load_json(TASKS_FILE, [])
    tasks.append(task)
    save_json(TASKS_FILE, tasks)
    
    # Update stats
    update_stats_on_task_change('create', task)
    
    return jsonify(task), 201

@app.route('/api/tasks/<task_id>', methods=['GET'])
def get_task(task_id):
    """Get a specific task"""
    tasks = load_json(TASKS_FILE, [])
    task = next((t for t in tasks if t['id'] == task_id), None)
    
    if task:
        return jsonify(task)
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a task"""
    data = request.get_json()
    tasks = load_json(TASKS_FILE, [])
    
    task_index = next((i for i, t in enumerate(tasks) if t['id'] == task_id), None)
    
    if task_index is None:
        return jsonify({'error': 'Task not found'}), 404
    
    old_task = tasks[task_index].copy()
    tasks[task_index].update({
        'title': data.get('title', tasks[task_index]['title']),
        'category': data.get('category', tasks[task_index]['category']),
        'priority': data.get('priority', tasks[task_index]['priority']),
        'dueDate': data.get('dueDate', tasks[task_index]['dueDate']),
        'status': data.get('status', tasks[task_index]['status']),
        'notes': data.get('notes', tasks[task_index]['notes']),
    })
    
    if data.get('status') == 'completed' and not tasks[task_index].get('completedAt'):
        tasks[task_index]['completedAt'] = datetime.now().isoformat()
    elif data.get('status') != 'completed':
        tasks[task_index]['completedAt'] = None
    
    save_json(TASKS_FILE, tasks)
    
    # Update stats
    if old_task['status'] != tasks[task_index]['status']:
        update_stats_on_task_change('toggle', tasks[task_index], old_task)
    
    return jsonify(tasks[task_index])

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    tasks = load_json(TASKS_FILE, [])
    task = next((t for t in tasks if t['id'] == task_id), None)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    tasks = [t for t in tasks if t['id'] != task_id]
    save_json(TASKS_FILE, tasks)
    
    # Update stats
    update_stats_on_task_change('delete', task)
    
    return jsonify({'message': 'Task deleted'}), 200

@app.route('/api/tasks/<task_id>/toggle', methods=['POST'])
def toggle_task(task_id):
    """Toggle task completion status"""
    tasks = load_json(TASKS_FILE, [])
    task_index = next((i for i, t in enumerate(tasks) if t['id'] == task_id), None)
    
    if task_index is None:
        return jsonify({'error': 'Task not found'}), 404
    
    old_task = tasks[task_index].copy()
    tasks[task_index]['status'] = 'completed' if tasks[task_index]['status'] == 'pending' else 'pending'
    
    if tasks[task_index]['status'] == 'completed':
        tasks[task_index]['completedAt'] = datetime.now().isoformat()
    else:
        tasks[task_index]['completedAt'] = None
    
    save_json(TASKS_FILE, tasks)
    
    # Update stats
    update_stats_on_task_change('toggle', tasks[task_index], old_task)
    
    return jsonify(tasks[task_index])

# ============================================
# Calendar Notes API Endpoints
# ============================================

@app.route('/api/calendar/notes', methods=['GET'])
def get_all_calendar_notes():
    """Get all calendar notes"""
    notes = load_json(CALENDAR_NOTES_FILE, {})
    return jsonify(notes)

@app.route('/api/calendar/notes/<date>', methods=['GET'])
def get_calendar_note(date):
    """Get calendar note for a specific date"""
    notes = load_json(CALENDAR_NOTES_FILE, {})
    note = notes.get(date, {'date': date, 'checked': False, 'notes': '', 'tasks': []})
    return jsonify(note)

@app.route('/api/calendar/notes/<date>', methods=['POST', 'PUT'])
def save_calendar_note(date):
    """Save or update calendar note for a date"""
    data = request.get_json()
    notes = load_json(CALENDAR_NOTES_FILE, {})
    
    notes[date] = {
        'date': date,
        'checked': data.get('checked', False),
        'notes': data.get('notes', ''),
        'tasks': data.get('tasks', []),
        'updatedAt': datetime.now().isoformat()
    }
    
    save_json(CALENDAR_NOTES_FILE, notes)
    return jsonify(notes[date])

@app.route('/api/calendar/notes/<date>', methods=['DELETE'])
def delete_calendar_note(date):
    """Delete calendar note for a date"""
    notes = load_json(CALENDAR_NOTES_FILE, {})
    
    if date in notes:
        del notes[date]
        save_json(CALENDAR_NOTES_FILE, notes)
        return jsonify({'message': 'Note deleted'}), 200
    
    return jsonify({'error': 'Note not found'}), 404

# ============================================
# Statistics API Endpoints
# ============================================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get user statistics"""
    stats = load_json(STATS_FILE, {})
    
    # Calculate additional stats
    tasks = load_json(TASKS_FILE, [])
    stats['totalTasks'] = len(tasks)
    stats['completedTasks'] = len([t for t in tasks if t.get('status') == 'completed'])
    stats['pendingTasks'] = len([t for t in tasks if t.get('status') == 'pending'])
    stats['completionRate'] = round((stats['completedTasks'] / stats['totalTasks'] * 100) if stats['totalTasks'] > 0 else 0, 2)
    
    return jsonify(stats)

@app.route('/api/stats/completion-trends', methods=['GET'])
def get_completion_trends():
    """Get task completion trends for the last 30 days"""
    tasks = load_json(TASKS_FILE, [])
    
    # Get last 30 days
    trends = {}
    for i in range(30):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        trends[date] = {
            'date': date,
            'completed': 0,
            'created': 0,
            'total': 0
        }
    
    for task in tasks:
        # Count created tasks
        if task.get('createdAt'):
            created_date = datetime.fromisoformat(task['createdAt'].replace('Z', '+00:00')).strftime('%Y-%m-%d')
            if created_date in trends:
                trends[created_date]['created'] += 1
                trends[created_date]['total'] += 1
        
        # Count completed tasks
        if task.get('status') == 'completed' and task.get('completedAt'):
            completed_date = datetime.fromisoformat(task['completedAt'].replace('Z', '+00:00')).strftime('%Y-%m-%d')
            if completed_date in trends:
                trends[completed_date]['completed'] += 1
    
    return jsonify(list(trends.values())[::-1])  # Reverse to show oldest first

@app.route('/api/stats/category-breakdown', methods=['GET'])
def get_category_breakdown():
    """Get task breakdown by category"""
    tasks = load_json(TASKS_FILE, [])
    
    categories = ['Homework', 'Exams', 'Projects', 'Revision', 'Personal', 'Goals']
    breakdown = {}
    
    for category in categories:
        cat_tasks = [t for t in tasks if t.get('category') == category]
        breakdown[category] = {
            'category': category,
            'total': len(cat_tasks),
            'completed': len([t for t in cat_tasks if t.get('status') == 'completed']),
            'pending': len([t for t in cat_tasks if t.get('status') == 'pending']),
            'completionRate': round((len([t for t in cat_tasks if t.get('status') == 'completed']) / len(cat_tasks) * 100) if len(cat_tasks) > 0 else 0, 2)
        }
    
    return jsonify(list(breakdown.values()))

@app.route('/api/stats/priority-breakdown', methods=['GET'])
def get_priority_breakdown():
    """Get task breakdown by priority"""
    tasks = load_json(TASKS_FILE, [])
    
    priorities = ['High', 'Medium', 'Low']
    breakdown = {}
    
    for priority in priorities:
        pri_tasks = [t for t in tasks if t.get('priority') == priority]
        breakdown[priority] = {
            'priority': priority,
            'total': len(pri_tasks),
            'completed': len([t for t in pri_tasks if t.get('status') == 'completed']),
            'pending': len([t for t in pri_tasks if t.get('status') == 'pending'])
        }
    
    return jsonify(list(breakdown.values()))

# ============================================
# Helper Functions
# ============================================

def update_stats_on_task_change(action, task, old_task=None):
    """Update statistics when task changes"""
    stats = load_json(STATS_FILE, {
        'streak': 0,
        'xp': 0,
        'level': 1,
        'lastActivityDate': None,
        'totalTasks': 0,
        'completedTasks': 0
    })
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    if action == 'create':
        stats['totalTasks'] = stats.get('totalTasks', 0) + 1
    elif action == 'delete':
        stats['totalTasks'] = max(0, stats.get('totalTasks', 0) - 1)
        if task.get('status') == 'completed':
            stats['completedTasks'] = max(0, stats.get('completedTasks', 0) - 1)
    elif action == 'toggle':
        if task.get('status') == 'completed':
            # Award XP
            priority_xp = {'High': 20, 'Medium': 15, 'Low': 10}
            xp_gain = priority_xp.get(task.get('priority', 'Medium'), 10)
            stats['xp'] = stats.get('xp', 0) + xp_gain
            stats['level'] = (stats.get('xp', 0) // 100) + 1
            
            # Update streak
            last_date = stats.get('lastActivityDate')
            if last_date != today:
                if last_date:
                    last_dt = datetime.strptime(last_date, '%Y-%m-%d')
                    today_dt = datetime.strptime(today, '%Y-%m-%d')
                    if (today_dt - last_dt).days == 1:
                        stats['streak'] = stats.get('streak', 0) + 1
                    else:
                        stats['streak'] = 1
                else:
                    stats['streak'] = 1
                stats['lastActivityDate'] = today
            
            stats['completedTasks'] = stats.get('completedTasks', 0) + 1
        else:
            stats['completedTasks'] = max(0, stats.get('completedTasks', 0) - 1)
    
    save_json(STATS_FILE, stats)

# ============================================
# Health Check
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    # Create data directory if it doesn't exist
    DATA_DIR.mkdir(exist_ok=True)
    
    print("Starting Smart Planner Backend...")
    print("API will be available at http://localhost:5000")
    print("API Documentation:")
    print("  GET    /api/tasks - Get all tasks")
    print("  POST   /api/tasks - Create task")
    print("  GET    /api/tasks/<id> - Get task")
    print("  PUT    /api/tasks/<id> - Update task")
    print("  DELETE /api/tasks/<id> - Delete task")
    print("  POST   /api/tasks/<id>/toggle - Toggle task status")
    print("  GET    /api/calendar/notes - Get all calendar notes")
    print("  GET    /api/calendar/notes/<date> - Get calendar note")
    print("  POST   /api/calendar/notes/<date> - Save calendar note")
    print("  GET    /api/stats - Get statistics")
    print("  GET    /api/stats/completion-trends - Get completion trends")
    print("  GET    /api/stats/category-breakdown - Get category breakdown")
    print("  GET    /api/stats/priority-breakdown - Get priority breakdown")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
