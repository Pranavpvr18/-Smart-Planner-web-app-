/**
 * Smart Planner - API Client
 * Handles all backend API communication
 */

const API_BASE_URL = 'http://localhost:5000/api';

const API = {
    // Tasks endpoints
    async getTasks() {
        const response = await fetch(`${API_BASE_URL}/tasks`);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return await response.json();
    },

    async createTask(taskData) {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to create task');
        return await response.json();
    },

    async updateTask(taskId, taskData) {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to update task');
        return await response.json();
    },

    async deleteTask(taskId) {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete task');
        return await response.json();
    },

    async toggleTask(taskId) {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/toggle`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to toggle task');
        return await response.json();
    },

    // Calendar notes endpoints
    async getCalendarNote(date) {
        try {
            const response = await fetch(`${API_BASE_URL}/calendar/notes/${date}`);
            if (!response.ok) return { date, checked: false, notes: '', tasks: [] };
            return await response.json();
        } catch (error) {
            console.error('Error fetching calendar note:', error);
            return { date, checked: false, notes: '', tasks: [] };
        }
    },

    async getAllCalendarNotes() {
        try {
            const response = await fetch(`${API_BASE_URL}/calendar/notes`);
            if (!response.ok) return {};
            return await response.json();
        } catch (error) {
            console.error('Error fetching calendar notes:', error);
            return {};
        }
    },

    async saveCalendarNote(date, noteData) {
        const response = await fetch(`${API_BASE_URL}/calendar/notes/${date}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(noteData)
        });
        if (!response.ok) throw new Error('Failed to save calendar note');
        return await response.json();
    },

    async deleteCalendarNote(date) {
        const response = await fetch(`${API_BASE_URL}/calendar/notes/${date}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete calendar note');
        return await response.json();
    },

    // Stats endpoints
    async getStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/stats`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            return { streak: 0, xp: 0, level: 1, totalTasks: 0, completedTasks: 0, completionRate: 0 };
        }
    },

    async getCompletionTrends() {
        try {
            const response = await fetch(`${API_BASE_URL}/stats/completion-trends`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('Error fetching completion trends:', error);
            return [];
        }
    },

    async getCategoryBreakdown() {
        try {
            const response = await fetch(`${API_BASE_URL}/stats/category-breakdown`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('Error fetching category breakdown:', error);
            return [];
        }
    },

    async getPriorityBreakdown() {
        try {
            const response = await fetch(`${API_BASE_URL}/stats/priority-breakdown`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('Error fetching priority breakdown:', error);
            return [];
        }
    },

    // Check if backend is available
    async checkHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
};

// Fallback to localStorage if backend is not available
const DataStorageWithFallback = {
    async getTasks() {
        try {
            const isOnline = await API.checkHealth();
            if (isOnline) {
                return await API.getTasks();
            }
        } catch (error) {
            console.warn('Backend unavailable, using localStorage fallback');
        }
        // Fallback to localStorage
        const tasks = localStorage.getItem('smartPlannerTasks');
        return tasks ? JSON.parse(tasks) : [];
    },

    async saveTasks(tasks) {
        try {
            const isOnline = await API.checkHealth();
            if (isOnline) {
                // If online, sync tasks (for now, just use localStorage as backup)
                localStorage.setItem('smartPlannerTasks', JSON.stringify(tasks));
                return;
            }
        } catch (error) {
            console.warn('Backend unavailable, using localStorage fallback');
        }
        localStorage.setItem('smartPlannerTasks', JSON.stringify(tasks));
    }
};
