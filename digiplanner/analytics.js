/**
 * Smart Planner - Analytics & Charts
 * Data visualization and statistics
 */

// Chart.js color scheme
const chartColors = {
    Homework: 'rgba(244, 67, 54, 0.8)',
    Exams: 'rgba(33, 150, 243, 0.8)',
    Projects: 'rgba(76, 175, 80, 0.8)',
    Revision: 'rgba(255, 152, 0, 0.8)',
    Personal: 'rgba(156, 39, 176, 0.8)',
    Goals: 'rgba(0, 188, 212, 0.8)',
    High: 'rgba(244, 67, 54, 0.8)',
    Medium: 'rgba(255, 152, 0, 0.8)',
    Low: 'rgba(76, 175, 80, 0.8)'
};

const Analytics = {
    charts: {},

    async init() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            return;
        }

        await this.updateSummary();
        await this.renderCategoryChart();
        await this.renderTrendsChart();
        await this.renderPriorityChart();
        await this.renderTimeChart();
        await this.renderCompletionChart();
        await this.renderWeeklyCompletionChart();
        await this.renderDetailedStats();
    },

    // Update summary cards
    async updateSummary() {
        let stats;
        try {
            if (typeof API !== 'undefined') {
                stats = await API.getStats();
            } else {
                stats = await DataStorage.getStats();
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            stats = { streak: 0, xp: 0, level: 1, totalTasks: 0, completedTasks: 0, completionRate: 0 };
        }
        
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Calculate average completion time
        const completedWithDates = tasks.filter(t => t.status === 'completed' && t.completedAt && t.createdAt);
        let avgCompletionTime = 0;
        
        if (completedWithDates.length > 0) {
            const totalDays = completedWithDates.reduce((sum, task) => {
                const created = dayjs(task.createdAt);
                const completed = dayjs(task.completedAt);
                return sum + completed.diff(created, 'day');
            }, 0);
            avgCompletionTime = Math.round(totalDays / completedWithDates.length);
        }
        
        const totalCompletedEl = document.getElementById('totalCompleted');
        const totalTasksEl = document.getElementById('totalTasks');
        const completionRateEl = document.getElementById('completionRate');
        const avgCompletionTimeEl = document.getElementById('avgCompletionTime');
        
        if (totalCompletedEl) totalCompletedEl.textContent = stats.completedTasks || completedTasks;
        if (totalTasksEl) totalTasksEl.textContent = stats.totalTasks || totalTasks;
        if (completionRateEl) completionRateEl.textContent = `${stats.completionRate || completionRate}%`;
        if (avgCompletionTimeEl) avgCompletionTimeEl.textContent = `${avgCompletionTime} days`;
    },

    // Render category completion chart
    async renderCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        
        let breakdown;
        try {
            if (typeof API !== 'undefined') {
                breakdown = await API.getCategoryBreakdown();
            } else {
                breakdown = this.calculateCategoryBreakdown(await DataStorage.getTasks());
            }
        } catch (error) {
            console.error('Error fetching category breakdown:', error);
            breakdown = [];
        }
        
        if (breakdown.length === 0) {
            const tasks = await DataStorage.getTasks();
            breakdown = this.calculateCategoryBreakdown(tasks);
        }
        
        const categories = breakdown.map(d => d.category);
        const completionRates = breakdown.map(d => d.completionRate);
        
        if (this.charts.category) {
            this.charts.category.destroy();
        }
        
        this.charts.category = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: completionRates,
                    backgroundColor: categories.map(c => chartColors[c]),
                    borderColor: categories.map(c => chartColors[c].replace('0.8', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    },
    
    calculateCategoryBreakdown(tasks) {
        const categories = ['Homework', 'Exams', 'Projects', 'Revision', 'Personal', 'Goals'];
        const breakdown = [];
        
        for (const category of categories) {
            const catTasks = tasks.filter(t => t.category === category);
            const completed = catTasks.filter(t => t.status === 'completed').length;
            const total = catTasks.length;
            breakdown.push({
                category,
                total,
                completed,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
            });
        }
        
        return breakdown;
    },
        const categories = ['Homework', 'Exams', 'Projects', 'Revision', 'Personal', 'Goals'];
        
        const data = categories.map(category => {
            const catTasks = tasks.filter(t => t.category === category);
            const completed = catTasks.filter(t => t.status === 'completed').length;
            const total = catTasks.length;
            return {
                category,
                completed,
                total,
                rate: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        });
        
        if (this.charts.category) {
            this.charts.category.destroy();
        }
        
        this.charts.category = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.category),
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: data.map(d => d.rate),
                    backgroundColor: data.map(d => chartColors[d.category]),
                    borderColor: data.map(d => chartColors[d.category].replace('0.8', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    },

    // Render productivity trends chart (last 30 days)
    async renderTrendsChart() {
        const ctx = document.getElementById('trendsChart');
        if (!ctx) return;
        
        let trends;
        try {
            if (typeof API !== 'undefined') {
                trends = await API.getCompletionTrends();
            } else {
                trends = this.calculateTrends(await DataStorage.getTasks());
            }
        } catch (error) {
            console.error('Error fetching trends:', error);
            trends = [];
        }
        
        if (trends.length === 0) {
            const tasks = await DataStorage.getTasks();
            trends = this.calculateTrends(tasks);
        }
        
        // Get last 30 days
        const days = trends.map(t => dayjs(t.date).format('MMM D'));
        const completedCount = trends.map(t => t.completed || 0);
        
        if (this.charts.trends) {
            this.charts.trends.destroy();
        }
        
        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Tasks Completed',
                    data: completedCount,
                    borderColor: 'rgba(244, 67, 54, 1)',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    },
    
    calculateTrends(tasks) {
        const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt);
        const trends = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = dayjs().subtract(i, 'days');
            const dateStr = date.format('YYYY-MM-DD');
            const dayTasks = completedTasks.filter(t => 
                dayjs(t.completedAt).format('YYYY-MM-DD') === dateStr
            );
            
            trends.push({
                date: dateStr,
                completed: dayTasks.length,
                created: 0,
                total: 0
            });
        }
        
        return trends;
    },

    // Render priority distribution chart
    async renderPriorityChart() {
        const ctx = document.getElementById('priorityChart');
        if (!ctx) return;
        
        let breakdown;
        try {
            if (typeof API !== 'undefined') {
                breakdown = await API.getPriorityBreakdown();
            } else {
                breakdown = this.calculatePriorityBreakdown(await DataStorage.getTasks());
            }
        } catch (error) {
            console.error('Error fetching priority breakdown:', error);
            breakdown = [];
        }
        
        if (breakdown.length === 0) {
            const tasks = await DataStorage.getTasks();
            breakdown = this.calculatePriorityBreakdown(tasks);
        }
        
        const priorities = breakdown.map(d => d.priority);
        const data = breakdown.map(d => d.total);
        
        if (this.charts.priority) {
            this.charts.priority.destroy();
        }
        
        this.charts.priority = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: priorities,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        chartColors.High,
                        chartColors.Medium,
                        chartColors.Low
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },
    
    calculatePriorityBreakdown(tasks) {
        const priorities = ['High', 'Medium', 'Low'];
        const breakdown = [];
        
        for (const priority of priorities) {
            const priTasks = tasks.filter(t => t.priority === priority);
            breakdown.push({
                priority,
                total: priTasks.length,
                completed: priTasks.filter(t => t.status === 'completed').length,
                pending: priTasks.filter(t => t.status === 'pending').length
            });
        }
        
        return breakdown;
    },
        const priorities = ['High', 'Medium', 'Low'];
        
        const data = priorities.map(priority => {
            return tasks.filter(t => t.priority === priority).length;
        });
        
        if (this.charts.priority) {
            this.charts.priority.destroy();
        }
        
        this.charts.priority = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: priorities,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        chartColors.High,
                        chartColors.Medium,
                        chartColors.Low
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    // Render time spent by category (estimated based on completion)
    async renderTimeChart() {
        const ctx = document.getElementById('timeChart');
        if (!ctx) return;
        
        const tasks = await DataStorage.getTasks();
        const completedTasks = tasks.filter(t => t.status === 'completed');
        const categories = ['Homework', 'Exams', 'Projects', 'Revision', 'Personal', 'Goals'];
        
        // Estimate time based on priority and category
        const timeMultipliers = {
            Homework: 1,
            Exams: 2,
            Projects: 3,
            Revision: 1.5,
            Personal: 0.5,
            Goals: 1
        };
        
        const priorityMultipliers = {
            High: 2,
            Medium: 1.5,
            Low: 1
        };
        
        const data = categories.map(category => {
            const catTasks = completedTasks.filter(t => t.category === category);
            const totalHours = catTasks.reduce((sum, task) => {
                const baseTime = timeMultipliers[category] || 1;
                const priorityMult = priorityMultipliers[task.priority] || 1;
                return sum + (baseTime * priorityMult);
            }, 0);
            return Math.round(totalHours);
        });
        
        if (this.charts.time) {
            this.charts.time.destroy();
        }
        
        this.charts.time = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Estimated Hours',
                    data: data,
                    backgroundColor: categories.map(c => chartColors[c]),
                    borderColor: categories.map(c => chartColors[c].replace('0.8', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + 'h';
                            }
                        }
                    }
                }
            }
        });
    },

    // Render completion overview chart
    async renderCompletionChart() {
        const ctx = document.getElementById('completionChart');
        if (!ctx) return;
        
        const tasks = await DataStorage.getTasks();
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        
        if (this.charts.completion) {
            this.charts.completion.destroy();
        }
        
        this.charts.completion = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Completed', 'Pending'],
                datasets: [{
                    data: [completed, pending],
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(255, 152, 0, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    // Render weekly completion rate chart
    async renderWeeklyCompletionChart() {
        const ctx = document.getElementById('weeklyCompletionChart');
        if (!ctx) return;
        
        const tasks = await DataStorage.getTasks();
        const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt);
        
        // Get last 7 weeks
        const weeks = [];
        const completionRates = [];
        
        for (let i = 6; i >= 0; i--) {
            const weekStart = dayjs().subtract(i, 'weeks').startOf('week');
            const weekEnd = weekStart.endOf('week');
            const weekTasks = completedTasks.filter(t => {
                const completedDate = dayjs(t.completedAt);
                return completedDate.isAfter(weekStart.subtract(1, 'day')) && completedDate.isBefore(weekEnd.add(1, 'day'));
            });
            
            const totalWeekTasks = tasks.filter(t => {
                const dueDate = dayjs(t.dueDate);
                return dueDate.isAfter(weekStart.subtract(1, 'day')) && dueDate.isBefore(weekEnd.add(1, 'day'));
            });
            
            const rate = totalWeekTasks.length > 0 ? (weekTasks.length / totalWeekTasks.length * 100) : 0;
            
            weeks.push(`Week ${7 - i}`);
            completionRates.push(Math.round(rate));
        }
        
        if (this.charts.weeklyCompletion) {
            this.charts.weeklyCompletion.destroy();
        }
        
        this.charts.weeklyCompletion = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeks,
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: completionRates,
                    borderColor: 'rgba(244, 67, 54, 1)',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    },

    // Render detailed statistics
    async renderDetailedStats() {
        const tasks = await DataStorage.getTasks();
        
        let categoryBreakdown;
        let priorityBreakdown;
        
        try {
            if (typeof API !== 'undefined') {
                categoryBreakdown = await API.getCategoryBreakdown();
                priorityBreakdown = await API.getPriorityBreakdown();
            } else {
                categoryBreakdown = this.calculateCategoryBreakdown(tasks);
                priorityBreakdown = this.calculatePriorityBreakdown(tasks);
            }
        } catch (error) {
            categoryBreakdown = this.calculateCategoryBreakdown(tasks);
            priorityBreakdown = this.calculatePriorityBreakdown(tasks);
        }
        
        // Category breakdown
        const categoryBreakdownEl = document.getElementById('categoryBreakdown');
        if (categoryBreakdownEl) {
            categoryBreakdownEl.innerHTML = '';
            
            categoryBreakdown.forEach(item => {
                const category = item.category;
                const completed = item.completed;
                const total = item.total;
                const rate = item.completionRate;
                
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);';
                
                const left = document.createElement('div');
                left.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';
                
                const color = document.createElement('span');
                color.style.cssText = `width: 12px; height: 12px; border-radius: 50%; background: ${chartColors[category]};`;
                
                const label = document.createElement('span');
                label.textContent = category;
                
                left.appendChild(color);
                left.appendChild(label);
                
                const right = document.createElement('div');
                right.textContent = `${completed}/${total} (${rate}%)`;
                right.style.cssText = 'font-weight: 600;';
                
                item.appendChild(left);
                item.appendChild(right);
                categoryBreakdownEl.appendChild(item);
            });
        }
        
        // Priority breakdown
        const priorityBreakdownEl = document.getElementById('priorityBreakdown');
        if (priorityBreakdownEl) {
            priorityBreakdownEl.innerHTML = '';
            
            priorityBreakdown.forEach(item => {
                const priority = item.priority;
                const completed = item.completed;
                const total = item.total;
                
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);';
                
                const left = document.createElement('div');
                left.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';
                
                const color = document.createElement('span');
                color.style.cssText = `width: 12px; height: 12px; border-radius: 50%; background: ${chartColors[priority]};`;
                
                const label = document.createElement('span');
                label.textContent = priority;
                
                left.appendChild(color);
                left.appendChild(label);
                
                const right = document.createElement('div');
                right.textContent = `${completed}/${total}`;
                right.style.cssText = 'font-weight: 600;';
                
                item.appendChild(left);
                item.appendChild(right);
                priorityBreakdownEl.appendChild(item);
            });
        }
        
        // Recent activity
        const recentActivityEl = document.getElementById('recentActivity');
        if (recentActivityEl) {
            const completedTasks = tasks
                .filter(t => t.status === 'completed' && t.completedAt)
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                .slice(0, 5);
            
            recentActivityEl.innerHTML = '';
            
            if (completedTasks.length === 0) {
                recentActivityEl.innerHTML = '<p style="color: var(--text-secondary);">No recent activity</p>';
            } else {
                completedTasks.forEach(task => {
                    const item = document.createElement('div');
                    item.style.cssText = 'padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);';
                    
                    const title = document.createElement('div');
                    title.textContent = task.title;
                    title.style.cssText = 'font-weight: 500; margin-bottom: 0.25rem;';
                    
                    const date = document.createElement('div');
                    date.textContent = Utils.formatDate(task.completedAt);
                    date.style.cssText = 'font-size: 0.85rem; color: var(--text-secondary);';
                    
                    item.appendChild(title);
                    item.appendChild(date);
                    recentActivityEl.appendChild(item);
                });
            }
        }
    }
};

// Initialize analytics when page loads
if (document.getElementById('categoryChart')) {
    // Wait for Chart.js to load
    if (typeof Chart !== 'undefined') {
        (async () => {
            await Analytics.init();
        })();
    } else {
        window.addEventListener('load', async () => {
            if (typeof Chart !== 'undefined') {
                await Analytics.init();
            }
        });
    }
}
