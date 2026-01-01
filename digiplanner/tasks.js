/**
 * Smart Planner - Task Management
 * Task CRUD operations and display logic
 */

// ============================================
// Task Manager
// ============================================

const TaskManager = {
    // Create a new task
    async createTask(taskData) {
        try {
            if (typeof API !== 'undefined') {
                const task = await API.createTask(taskData);
                await this.refreshDisplays();
                this.showNotification('Task created successfully!');
                return task;
            }
        } catch (error) {
            console.warn('Backend unavailable, using localStorage');
        }
        
        // Fallback to localStorage
        const tasks = await DataStorage.getTasks();
        const task = new Task(taskData);
        tasks.push(task);
        await DataStorage.saveTasks(tasks);
        this.updateStats(task, 'create');
        await this.refreshDisplays();
        this.showNotification('Task created successfully!');
        return task;
    },

    // Update an existing task
    async updateTask(taskId, taskData) {
        try {
            if (typeof API !== 'undefined') {
                const task = await API.updateTask(taskId, taskData);
                await this.refreshDisplays();
                this.showNotification('Task updated successfully!');
                return task;
            }
        } catch (error) {
            console.warn('Backend unavailable, using localStorage');
        }
        
        // Fallback to localStorage
        const tasks = await DataStorage.getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...taskData };
            await DataStorage.saveTasks(tasks);
            await this.refreshDisplays();
            this.showNotification('Task updated successfully!');
            return tasks[index];
        }
        return null;
    },

    // Delete a task
    async deleteTask(taskId) {
        try {
            if (typeof API !== 'undefined') {
                await API.deleteTask(taskId);
                await this.refreshDisplays();
                this.showNotification('Task deleted successfully!');
                return;
            }
        } catch (error) {
            console.warn('Backend unavailable, using localStorage');
        }
        
        // Fallback to localStorage
        const tasks = await DataStorage.getTasks();
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        await DataStorage.saveTasks(filteredTasks);
        await this.refreshDisplays();
        this.showNotification('Task deleted successfully!');
    },

    // Toggle task completion
    async toggleTask(taskId) {
        try {
            if (typeof API !== 'undefined') {
                const task = await API.toggleTask(taskId);
                if (task.status === 'completed') {
                    Confetti.celebrate();
                    this.showNotification('Task completed! 🎉');
                }
                await this.refreshDisplays();
                return task;
            }
        } catch (error) {
            console.warn('Backend unavailable, using localStorage');
        }
        
        // Fallback to localStorage
        const tasks = await DataStorage.getTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (task) {
            const wasCompleted = task.status === 'completed';
            task.status = task.status === 'pending' ? 'completed' : 'pending';
            
            if (task.status === 'completed') {
                task.completedAt = new Date().toISOString();
                Confetti.celebrate();
                this.updateStats(task, 'complete');
            } else {
                task.completedAt = null;
            }
            
            await DataStorage.saveTasks(tasks);
            await this.refreshDisplays();
            
            if (task.status === 'completed' && !wasCompleted) {
                this.showNotification('Task completed! 🎉');
            }
            return task;
        }
    },

    // Get tasks with filters
    async getFilteredTasks(filters = {}) {
        let tasks = await DataStorage.getTasks();
        
        // Filter by status
        if (filters.status && filters.status !== 'all') {
            tasks = tasks.filter(t => t.status === filters.status);
        }
        
        // Filter by category
        if (filters.category && filters.category !== 'all') {
            tasks = tasks.filter(t => t.category === filters.category);
        }
        
        // Filter by priority
        if (filters.priority && filters.priority !== 'all') {
            tasks = tasks.filter(t => t.priority === filters.priority);
        }
        
        // Search
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            tasks = tasks.filter(t => 
                t.title.toLowerCase().includes(searchLower) ||
                (t.notes && t.notes.toLowerCase().includes(searchLower))
            );
        }
        
        // Sort
        if (filters.sort) {
            tasks.sort((a, b) => {
                switch (filters.sort) {
                    case 'dueDate':
                        return new Date(a.dueDate) - new Date(b.dueDate);
                    case 'priority':
                        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
                        return priorityOrder[b.priority] - priorityOrder[a.priority];
                    case 'createdAt':
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    case 'title':
                        return a.title.localeCompare(b.title);
                    default:
                        return 0;
                }
            });
        }
        
        return tasks;
    },

    // Get tasks due soon (next 7 days)
    async getDueSoonTasks() {
        if (typeof dayjs === 'undefined') return [];
        const tasks = await DataStorage.getTasks();
        const today = dayjs().startOf('day');
        const weekFromNow = today.add(7, 'days');
        
        return tasks.filter(task => {
            if (task.status === 'completed') return false;
            const dueDate = dayjs(task.dueDate);
            return dueDate.isAfter(today.subtract(1, 'day')) && dueDate.isBefore(weekFromNow);
        }).sort((a, b) => {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }).slice(0, 5); // Limit to 5 tasks
    },

    // Get tasks for a specific date
    async getTasksForDate(date) {
        if (typeof dayjs === 'undefined') return [];
        const tasks = await DataStorage.getTasks();
        const targetDate = dayjs(date).format('YYYY-MM-DD');
        return tasks.filter(task => task.dueDate === targetDate);
    },

    // Update user stats
    updateStats(task, action) {
        if (typeof dayjs === 'undefined') return;
        const stats = DataStorage.getStats();
        const today = dayjs().format('YYYY-MM-DD');
        
        if (action === 'complete') {
            // Award XP
            const xpGain = task.priority === 'High' ? 20 : task.priority === 'Medium' ? 15 : 10;
            stats.xp = (stats.xp || 0) + xpGain;
            
            // Update level (100 XP per level)
            stats.level = Math.floor(stats.xp / 100) + 1;
            
            // Update streak
            if (stats.lastActivityDate !== today && typeof dayjs !== 'undefined') {
                const lastDate = stats.lastActivityDate ? dayjs(stats.lastActivityDate) : null;
                if (lastDate && lastDate.add(1, 'day').isSame(dayjs(), 'day')) {
                    stats.streak = (stats.streak || 0) + 1;
                } else if (!lastDate || !lastDate.isSame(dayjs(), 'day')) {
                    stats.streak = 1;
                }
                stats.lastActivityDate = today;
            }
        }
        
        DataStorage.saveStats(stats);
    },

    // Refresh all task displays
    async refreshDisplays() {
        // Check if we're on dashboard page
        if (document.getElementById('dueSoonTasks')) {
            await this.renderDueSoonTasks();
            await this.updateDashboardStats();
            await this.updateProgress();
        }
        
        // Check if we're on tasks page
        if (document.getElementById('tasksList')) {
            await this.renderTasksList();
        }
        
        // Check if we're on calendar page
        if (document.getElementById('calendarDays') && typeof CalendarRenderer !== 'undefined') {
            CalendarRenderer.render();
        }
    },

    // Render due soon tasks on dashboard
    async renderDueSoonTasks() {
        const container = document.getElementById('dueSoonTasks');
        if (!container) return;
        
        const tasks = await this.getDueSoonTasks();
        container.innerHTML = '';
        
        if (tasks.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No tasks due soon. Great job! 🎉</p>';
            return;
        }
        
        for (const task of tasks) {
            const taskEl = this.createTaskElement(task, { showActions: true, compact: true });
            container.appendChild(taskEl);
        }
    },

    // Render tasks list on tasks page
    async renderTasksList() {
        const container = document.getElementById('tasksList');
        const emptyState = document.getElementById('emptyState');
        if (!container) return;
        
        const statusFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
        const priorityFilter = document.getElementById('priorityFilter')?.value || 'all';
        const sortFilter = document.getElementById('sortFilter')?.value || 'dueDate';
        const searchQuery = document.getElementById('taskSearch')?.value || '';
        
        const filters = {
            status: statusFilter,
            category: categoryFilter,
            priority: priorityFilter,
            sort: sortFilter,
            search: searchQuery
        };
        
        const tasks = await this.getFilteredTasks(filters);
        container.innerHTML = '';
        
        if (tasks.length === 0) {
            container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            container.style.display = 'flex';
            if (emptyState) emptyState.style.display = 'none';
            
            for (const task of tasks) {
                const taskEl = this.createTaskElement(task, { showActions: true });
                container.appendChild(taskEl);
            }
        }
    },

    // Create task element
    createTaskElement(task, options = {}) {
        const { showActions = false, compact = false } = options;
        
        const taskEl = document.createElement('div');
        taskEl.className = `task-item ${task.status === 'completed' ? 'completed' : ''}`;
        taskEl.dataset.taskId = task.id;
        
        // Checkbox
        const checkbox = document.createElement('div');
        checkbox.className = `task-checkbox ${task.status === 'completed' ? 'checked' : ''}`;
        checkbox.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.toggleTask(task.id);
        });
        
        // Task content
        const content = document.createElement('div');
        content.className = 'task-content';
        
        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = task.title;
        
        const meta = document.createElement('div');
        meta.className = 'task-meta';
        
        const category = document.createElement('span');
        category.className = `task-category ${task.category}`;
        category.textContent = task.category;
        
        const priority = document.createElement('span');
        priority.className = `task-priority ${task.priority}`;
        priority.textContent = task.priority;
        
        const dueDate = document.createElement('span');
        dueDate.className = 'task-due-date';
        const dateText = Utils.isToday(task.dueDate) ? 'Today' : 
                        Utils.isPast(task.dueDate) ? `Overdue: ${Utils.formatDate(task.dueDate)}` :
                        Utils.formatDate(task.dueDate);
        dueDate.innerHTML = `📅 ${dateText}`;
        
        meta.appendChild(category);
        meta.appendChild(priority);
        meta.appendChild(dueDate);
        
        content.appendChild(title);
        content.appendChild(meta);
        
        taskEl.appendChild(checkbox);
        taskEl.appendChild(content);
        
        // Actions
        if (showActions) {
            const actions = document.createElement('div');
            actions.className = 'task-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'task-btn';
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Edit';
            editBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const tasks = await DataStorage.getTasks();
                const taskData = tasks.find(t => t.id === task.id);
                if (taskData) Modal.open(taskData);
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete';
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this task?')) {
                    await this.deleteTask(task.id);
                }
            });
            
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            taskEl.appendChild(actions);
        }
        
        // Click to toggle
        taskEl.addEventListener('click', async (e) => {
            if (!e.target.closest('.task-btn') && !e.target.closest('.task-checkbox')) {
                await this.toggleTask(task.id);
            }
        });
        
        return taskEl;
    },

    // Update dashboard statistics
    async updateDashboardStats() {
        if (typeof dayjs === 'undefined') return;
        const tasks = await DataStorage.getTasks();
        const stats = await DataStorage.getStats();
        const today = dayjs().format('YYYY-MM-DD');
        
        const todayTasks = tasks.filter(t => t.dueDate === today);
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        
        const todayTasksCountEl = document.getElementById('todayTasksCount');
        const completedTasksCountEl = document.getElementById('completedTasksCount');
        const streakCountEl = document.getElementById('streakCount');
        const xpPointsEl = document.getElementById('xpPoints');
        
        if (todayTasksCountEl) todayTasksCountEl.textContent = todayTasks.length;
        if (completedTasksCountEl) completedTasksCountEl.textContent = completedTasks;
        if (streakCountEl) streakCountEl.textContent = stats.streak || 0;
        if (xpPointsEl) xpPointsEl.textContent = stats.xp || 0;
    },

    // Update progress bars
    async updateProgress() {
        if (typeof dayjs === 'undefined') return;
        const tasks = await DataStorage.getTasks();
        const today = dayjs().format('YYYY-MM-DD');
        const todayTasks = tasks.filter(t => t.dueDate === today);
        const completedToday = todayTasks.filter(t => t.status === 'completed').length;
        const totalToday = todayTasks.length;
        
        // Overall progress
        const overallProgress = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;
        const overallProgressFill = document.getElementById('overallProgressFill');
        const overallProgressText = document.getElementById('overallProgressText');
        
        if (overallProgressFill) {
            overallProgressFill.style.width = `${overallProgress}%`;
        }
        if (overallProgressText) {
            overallProgressText.textContent = `${Math.round(overallProgress)}%`;
        }
        
        // Category progress
        const categoryProgressEl = document.getElementById('categoryProgress');
        if (categoryProgressEl) {
            const categories = ['Homework', 'Exams', 'Projects', 'Revision', 'Personal', 'Goals'];
            categoryProgressEl.innerHTML = '';
            
            categories.forEach(category => {
                const catTasks = todayTasks.filter(t => t.category === category);
                const catCompleted = catTasks.filter(t => t.status === 'completed').length;
                const catTotal = catTasks.length;
                const catProgress = catTotal > 0 ? (catCompleted / catTotal) * 100 : 0;
                
                const item = document.createElement('div');
                item.className = 'category-progress-item';
                
                const label = document.createElement('span');
                label.className = 'category-progress-label';
                label.textContent = category;
                
                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                
                const progressFill = document.createElement('div');
                progressFill.className = 'progress-fill';
                progressFill.style.width = `${catProgress}%`;
                
                progressBar.appendChild(progressFill);
                
                item.appendChild(label);
                item.appendChild(progressBar);
                categoryProgressEl.appendChild(item);
            });
        }
    },

    // Show notification
    showNotification(message) {
        // Simple notification - could be enhanced with a toast library
        console.log(message);
    }
};

// ============================================
// Initialize Tasks Page
// ============================================

if (document.getElementById('tasksList')) {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            await TaskManager.renderTasksList();
        });
    });
    
    // Filter selects
    const categoryFilter = document.getElementById('categoryFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const sortFilter = document.getElementById('sortFilter');
    const searchInput = document.getElementById('taskSearch');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', async () => await TaskManager.renderTasksList());
    }
    if (priorityFilter) {
        priorityFilter.addEventListener('change', async () => await TaskManager.renderTasksList());
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', async () => await TaskManager.renderTasksList());
    }
    if (searchInput) {
        searchInput.addEventListener('input', async () => await TaskManager.renderTasksList());
    }
    
    // Empty state add button
    const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
    if (emptyStateAddBtn) {
        emptyStateAddBtn.addEventListener('click', () => {
            const fab = document.getElementById('fabAddTask');
            if (fab) fab.click();
        });
    }
    
    // Initial render
    (async () => {
        await TaskManager.renderTasksList();
    })();
}

// ============================================
// Initialize Dashboard
// ============================================

if (document.getElementById('dueSoonTasks')) {
    (async () => {
        await TaskManager.renderDueSoonTasks();
        await TaskManager.updateDashboardStats();
        await TaskManager.updateProgress();
    })();
}

// ============================================
// FAB Button Handler
// ============================================

const fab = document.getElementById('fabAddTask');
if (fab) {
    fab.addEventListener('click', () => {
        Modal.open();
    });
}
