/**
 * Smart Planner - Main Script
 * Core functionality and shared utilities
 */

// ============================================
// Data Model and Storage
// ============================================

const DataStorage = {
    // Get all tasks (with backend fallback)
    async getTasks() {
        try {
            if (typeof API !== 'undefined') {
                return await API.getTasks();
            }
        } catch (error) {
            console.warn('Backend unavailable, using localStorage');
        }
        // Fallback to localStorage
        const tasks = localStorage.getItem('smartPlannerTasks');
        return tasks ? JSON.parse(tasks) : [];
    },

    // Save tasks (with backend sync)
    async saveTasks(tasks) {
        // Always backup to localStorage
        localStorage.setItem('smartPlannerTasks', JSON.stringify(tasks));
        // Backend sync happens in TaskManager methods
    },

    // Get user stats (with backend)
    async getStats() {
        try {
            if (typeof API !== 'undefined') {
                return await API.getStats();
            }
        } catch (error) {
            console.warn('Backend unavailable, using localStorage');
        }
        // Fallback to localStorage
        const stats = localStorage.getItem('smartPlannerStats');
        return stats ? JSON.parse(stats) : {
            streak: 0,
            xp: 0,
            level: 1,
            lastActivityDate: null,
            totalTasks: 0,
            completedTasks: 0,
            completionRate: 0
        };
    },

    // Save user stats
    async saveStats(stats) {
        localStorage.setItem('smartPlannerStats', JSON.stringify(stats));
        // Stats are managed by backend
    }
};

// ============================================
// Task Model
// ============================================

class Task {
    constructor(data) {
        this.id = data.id || this.generateId();
        this.title = data.title || '';
        this.category = data.category || 'Personal';
        this.priority = data.priority || 'Medium';
        this.dueDate = data.dueDate || '';
        this.status = data.status || 'pending';
        this.notes = data.notes || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.completedAt = data.completedAt || null;
    }

    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    toggle() {
        this.status = this.status === 'pending' ? 'completed' : 'pending';
        if (this.status === 'completed') {
            this.completedAt = new Date().toISOString();
        } else {
            this.completedAt = null;
        }
    }
}

// ============================================
// Utility Functions
// ============================================

const Utils = {
    // Format date
    formatDate(dateString) {
        if (!dateString || typeof dayjs === 'undefined') return '';
        const date = dayjs(dateString);
        return date.format('MMM D, YYYY');
    },

    // Format date with time
    formatDateTime(dateString) {
        if (!dateString || typeof dayjs === 'undefined') return '';
        const date = dayjs(dateString);
        return date.format('MMM D, YYYY h:mm A');
    },

    // Get relative time (e.g., "in 2 days", "yesterday")
    getRelativeTime(dateString) {
        if (!dateString || typeof dayjs === 'undefined') return '';
        const date = dayjs(dateString);
        const now = dayjs();
        const diffDays = date.diff(now, 'day');
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays > 0) return `In ${diffDays} days`;
        return `${Math.abs(diffDays)} days ago`;
    },

    // Check if date is today
    isToday(dateString) {
        if (!dateString || typeof dayjs === 'undefined') return false;
        return dayjs(dateString).isSame(dayjs(), 'day');
    },

    // Check if date is past
    isPast(dateString) {
        if (!dateString || typeof dayjs === 'undefined') return false;
        return dayjs(dateString).isBefore(dayjs(), 'day');
    },

    // Get days until due
    daysUntilDue(dateString) {
        if (!dateString || typeof dayjs === 'undefined') return null;
        return dayjs(dateString).diff(dayjs(), 'day');
    },

    // Get category color class
    getCategoryColor(category) {
        return category;
    },

    // Get priority color class
    getPriorityColor(priority) {
        return priority;
    }
};

// ============================================
// Confetti Animation
// ============================================

const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,

    init() {
        this.canvas = document.getElementById('confettiCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    createParticle(x, y) {
        const colors = ['#F44336', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4'];
        return {
            x,
            y,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * -8 - 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 6 + 4,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        };
    },

    celebrate() {
        if (!this.canvas || !this.ctx) return;
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Create particles
        for (let i = 0; i < 100; i++) {
            const angle = (Math.PI * 2 * i) / 100;
            const distance = Math.random() * 100;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            this.particles.push(this.createParticle(x, y));
        }

        this.animate();
    },

    animate() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // Gravity
            particle.rotation += particle.rotationSpeed;
            
            if (particle.y > this.canvas.height) return false;
            
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
            this.ctx.restore();
            
            return true;
        });
        
        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
};

// ============================================
// Modal Management
// ============================================

const Modal = {
    modal: null,
    form: null,
    currentTaskId: null,

    init() {
        this.modal = document.getElementById('taskModal');
        this.form = document.getElementById('taskForm');
        const closeBtn = document.getElementById('modalClose');
        const cancelBtn = document.getElementById('cancelBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });
        }
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    },

    open(task = null) {
        if (!this.modal) return;
        
        this.currentTaskId = task ? task.id : null;
        const titleInput = document.getElementById('modalTitle');
        
        if (titleInput) {
            titleInput.textContent = task ? 'Edit Task' : 'Add New Task';
        }

        if (task) {
            // Fill form with task data
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskCategory').value = task.category;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskDueDate').value = task.dueDate;
            document.getElementById('taskNotes').value = task.notes || '';
        } else {
            // Reset form
            this.form.reset();
            // Set default due date to today
            const today = dayjs().format('YYYY-MM-DD');
            document.getElementById('taskDueDate').value = today;
        }

        this.modal.classList.add('active');
        document.getElementById('taskTitle').focus();
    },

    close() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        this.currentTaskId = null;
        this.form.reset();
    },

    handleSubmit(e) {
        e.preventDefault();
        
        const taskData = {
            title: document.getElementById('taskTitle').value.trim(),
            category: document.getElementById('taskCategory').value,
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDueDate').value,
            notes: document.getElementById('taskNotes').value.trim()
        };

        if (!taskData.title) {
            alert('Please enter a task title');
            return;
        }

        (async () => {
            if (this.currentTaskId) {
                // Update existing task
                await TaskManager.updateTask(this.currentTaskId, taskData);
            } else {
                // Create new task
                await TaskManager.createTask(taskData);
            }
            this.close();
        })();
    }
};

// ============================================
// Navigation
// ============================================

const Navigation = {
    init() {
        // Mobile menu toggle
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Profile menu toggle
        const profileIcon = document.getElementById('profileIcon');
        const profileMenu = document.getElementById('profileMenu');
        
        if (profileIcon && profileMenu) {
            profileIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                profileMenu.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                profileMenu.classList.remove('active');
            });
        }

        // Export data
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportData();
            });
        }

        // Clear data
        const clearBtn = document.getElementById('clearData');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                    localStorage.clear();
                    location.reload();
                }
            });
        }
    },

    exportData() {
        const tasks = DataStorage.getTasks();
        const stats = DataStorage.getStats();
        const data = { tasks, stats, exportedAt: new Date().toISOString() };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smart-planner-backup-${dayjs().format('YYYY-MM-DD')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// ============================================
// Pomodoro Timer
// ============================================

const PomodoroTimer = {
    minutes: 25,
    seconds: 0,
    totalSeconds: 25 * 60,
    interval: null,
    mode: 25, // 25, 5, or 15

    init() {
        const startBtn = document.getElementById('timerStart');
        const pauseBtn = document.getElementById('timerPause');
        const resetBtn = document.getElementById('timerReset');
        const modeBtns = document.querySelectorAll('.mode-btn');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pause());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.mode = parseInt(btn.dataset.mode);
                this.reset();
            });
        });

        this.updateDisplay();
    },

    start() {
        if (this.interval) return;
        
        this.interval = setInterval(() => {
            this.totalSeconds--;
            this.minutes = Math.floor(this.totalSeconds / 60);
            this.seconds = this.totalSeconds % 60;
            
            if (this.totalSeconds <= 0) {
                this.complete();
            }
            
            this.updateDisplay();
        }, 1000);
    },

    pause() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    },

    reset() {
        this.pause();
        this.mode = parseInt(document.querySelector('.mode-btn.active')?.dataset.mode || '25');
        this.totalSeconds = this.mode * 60;
        this.minutes = this.mode;
        this.seconds = 0;
        this.updateDisplay();
    },

    complete() {
        this.pause();
        // Play notification sound (if supported)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
                body: `Your ${this.mode}-minute session is complete.`,
                icon: '/icon-192.png'
            });
        }
        
        // Try to play sound
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzOH0fPTgjMGHm7A7+SURgwPVK3l77BZFAg8ltryynoqBTGFzvPXizsIGGq88OWYSgwOU6rk8LJeFQc7kdjyznwsBSN3x/DdkEEKFF606euoVRQKRp/g8r5sIQczh9Hz04IzBh5uwO/klEYMD1St5e+wWRQIPJba8sp6KgUxhc7z14s7CBhqvPDlmEoMDlOq5PCyXhUHO5HY8s58LAUjd8fw3ZBBDhRetenrqFUTB0Wf4PK+bCEHM4fR89OCMwYebsDv5JRGDg5UreXvsFkUCDyW2vLKeioFMYXO89eLOwgYarzwhZhKDA5TquTwsl4VBzuR2PLOfCwFI3fH8N2QQQ4UXrXp66hVEwdFn+DyvmwhBzOH0fPTgjMGHm7A7+SURgwOVK3l77BZFAg8ltryynoqBTGFzvPXizsIGGq88OWYSgwOU6rk8LJeFQc7kdjyznwsBSN3x/DdkEE=');
            audio.play().catch(() => {});
        } catch (e) {}

        alert(`Timer complete! You've finished your ${this.mode}-minute session.`);
    },

    updateDisplay() {
        const minutesEl = document.getElementById('timerMinutes');
        const secondsEl = document.getElementById('timerSeconds');
        
        if (minutesEl) {
            minutesEl.textContent = this.minutes.toString().padStart(2, '0');
        }
        if (secondsEl) {
            secondsEl.textContent = this.seconds.toString().padStart(2, '0');
        }
    }
};

// ============================================
// Keyboard Shortcuts
// ============================================

const KeyboardShortcuts = {
    init() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if (e.key === 'Escape' && Modal.modal?.classList.contains('active')) {
                    Modal.close();
                }
                return;
            }

            // A - Add task
            if (e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                const fab = document.getElementById('fabAddTask');
                if (fab) fab.click();
            }

            // Escape - Close modal
            if (e.key === 'Escape') {
                Modal.close();
            }
        });
    }
};

// ============================================
// Initialize on DOM Load
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    Confetti.init();
    Modal.init();
    Navigation.init();
    KeyboardShortcuts.init();
    
    // Initialize timer if on dashboard
    if (document.getElementById('timerStart')) {
        PomodoroTimer.init();
    }

    // Update current date
    const currentDateEl = document.getElementById('currentDate');
    if (currentDateEl && typeof dayjs !== 'undefined') {
        currentDateEl.textContent = dayjs().format('dddd, MMMM D, YYYY');
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
