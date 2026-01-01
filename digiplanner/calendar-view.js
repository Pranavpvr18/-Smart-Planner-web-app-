/**
 * Smart Planner - Calendar View Logic
 * Calendar rendering and interactions
 */

// ============================================
// Calendar Renderer
// ============================================

const CalendarRenderer = {
    currentDate: dayjs(),
    currentView: 'month',

    init() {
        if (typeof dayjs === 'undefined') {
            console.error('Day.js is not loaded');
            return;
        }
        
        this.currentDate = dayjs();
        
        // View toggle buttons
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.render();
            });
        });

        // Navigation buttons
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.navigate(-1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.navigate(1);
            });
        }

        // Initialize
        this.render();
    },

    navigate(direction) {
        if (this.currentView === 'month') {
            this.currentDate = this.currentDate.add(direction, 'month');
        } else if (this.currentView === 'week') {
            this.currentDate = this.currentDate.add(direction, 'week');
        } else if (this.currentView === 'day') {
            this.currentDate = this.currentDate.add(direction, 'day');
        }
        this.render();
    },

    render() {
        this.updateHeader();
        
        if (this.currentView === 'month') {
            this.renderMonthView();
        } else if (this.currentView === 'week') {
            this.renderWeekView();
        } else if (this.currentView === 'day') {
            this.renderDayView();
        }
    },

    updateHeader() {
        const monthYearEl = document.getElementById('calendarMonthYear');
        if (monthYearEl) {
            monthYearEl.textContent = this.currentDate.format('MMMM YYYY');
        }
    },

    renderMonthView() {
        const monthView = document.getElementById('monthView');
        const weekView = document.getElementById('weekView');
        const dayView = document.getElementById('dayView');
        
        if (monthView) monthView.style.display = 'block';
        if (weekView) weekView.style.display = 'none';
        if (dayView) dayView.style.display = 'none';

        const daysContainer = document.getElementById('calendarDays');
        if (!daysContainer) return;

        daysContainer.innerHTML = '';

        // Get first day of month and start of calendar grid
        const firstDay = this.currentDate.startOf('month');
        const startDate = firstDay.startOf('week');
        const endDate = this.currentDate.endOf('month').endOf('week');

        let currentDate = startDate;

        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            
            if (!currentDate.isSame(this.currentDate, 'month')) {
                dayEl.classList.add('other-month');
            }
            
            if (currentDate.isSame(dayjs(), 'day')) {
                dayEl.classList.add('today');
            }

            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = currentDate.date();

            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'calendar-day-tasks';

            // Get tasks for this day (async)
            (async () => {
                const tasks = await TaskManager.getTasksForDate(currentDate.format('YYYY-MM-DD'));
                tasks.slice(0, 3).forEach(task => {
                const taskEl = document.createElement('div');
                taskEl.className = `calendar-task ${task.category}`;
                taskEl.textContent = task.title;
                taskEl.title = task.title;
                taskEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const tasks = DataStorage.getTasks();
                    const taskData = tasks.find(t => t.id === task.id);
                    if (taskData) Modal.open(taskData);
                });
                tasksContainer.appendChild(taskEl);
            });

            if (tasks.length > 3) {
                const moreEl = document.createElement('div');
                moreEl.className = 'calendar-task';
                moreEl.textContent = `+${tasks.length - 3} more`;
                moreEl.style.cssText = 'opacity: 0.7; font-size: 0.7rem;';
                tasksContainer.appendChild(moreEl);
            }

            // Add calendar note indicator
            const noteIndicator = document.createElement('div');
            noteIndicator.className = 'calendar-note-indicator';
            
            // Load note for this date
            (async () => {
                if (typeof CalendarNotes !== 'undefined') {
                    const note = await CalendarNotes.getNoteForDate(currentDate.format('YYYY-MM-DD'));
                    if (note.checked) {
                        noteIndicator.innerHTML = '✓';
                        noteIndicator.classList.add('checked');
                        dayEl.classList.add('has-note', 'note-checked');
                    } else if (note.notes || note.tasks.length > 0) {
                        noteIndicator.innerHTML = '📝';
                        dayEl.classList.add('has-note');
                    }
                }
            })();
            
            dayEl.appendChild(dayNumber);
            dayEl.appendChild(noteIndicator);
            dayEl.appendChild(tasksContainer);

            // Double click to open note modal, single click for day view
            let clickTimeout;
            dayEl.addEventListener('click', () => {
                clearTimeout(clickTimeout);
                clickTimeout = setTimeout(() => {
                    this.currentDate = currentDate;
                    this.currentView = 'day';
                    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                    const dayBtn = document.querySelector('[data-view="day"]');
                    if (dayBtn) dayBtn.classList.add('active');
                    this.render();
                }, 300);
            });
            
            dayEl.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                clearTimeout(clickTimeout);
                if (typeof CalendarNotes !== 'undefined') {
                    CalendarNotes.openNoteModal(currentDate.format('YYYY-MM-DD'));
                }
            });

            daysContainer.appendChild(dayEl);
            currentDate = currentDate.add(1, 'day');
        }
    },

    renderWeekView() {
        const monthView = document.getElementById('monthView');
        const weekView = document.getElementById('weekView');
        const dayView = document.getElementById('dayView');
        
        if (monthView) monthView.style.display = 'none';
        if (weekView) weekView.style.display = 'block';
        if (dayView) dayView.style.display = 'none';

        const weekDaysEl = document.getElementById('weekDays');
        const weekContentEl = document.getElementById('weekContent');
        const weekTimeSlotsEl = document.querySelector('.week-time-slots');
        
        if (!weekDaysEl || !weekContentEl) return;

        // Get start of week
        const weekStart = this.currentDate.startOf('week');
        
        // Render week headers
        weekDaysEl.innerHTML = '';
        for (let i = 0; i < 7; i++) {
            const date = weekStart.add(i, 'day');
            const headerEl = document.createElement('div');
            headerEl.className = `week-day-header ${date.isSame(dayjs(), 'day') ? 'today' : ''}`;
            
            const dayName = document.createElement('div');
            dayName.className = 'week-day-name';
            dayName.textContent = date.format('ddd');
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'week-day-number';
            dayNumber.textContent = date.date();
            
            headerEl.appendChild(dayName);
            headerEl.appendChild(dayNumber);
            weekDaysEl.appendChild(headerEl);
        }

        // Render time slots
        if (weekTimeSlotsEl) {
            weekTimeSlotsEl.innerHTML = '';
            for (let hour = 0; hour < 24; hour++) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.textContent = hour.toString().padStart(2, '0') + ':00';
                weekTimeSlotsEl.appendChild(timeSlot);
            }
        }

        // Render week content
        weekContentEl.innerHTML = '';
        for (let i = 0; i < 7; i++) {
            const date = weekStart.add(i, 'day');
            const columnEl = document.createElement('div');
            columnEl.className = 'week-day-column';
            
            const tasks = TaskManager.getTasksForDate(date.format('YYYY-MM-DD'));
            tasks.forEach(task => {
                const taskEl = document.createElement('div');
                taskEl.className = `week-task ${task.category}`;
                taskEl.textContent = task.title;
                taskEl.title = `${task.title} - ${Utils.formatDate(task.dueDate)}`;
                
                // Position task based on priority (simplified)
                const hourOffset = task.priority === 'High' ? 9 : task.priority === 'Medium' ? 12 : 14;
                taskEl.style.top = `${hourOffset * 60}px`;
                taskEl.style.height = '60px';
                
                taskEl.addEventListener('click', () => {
                    const tasks = DataStorage.getTasks();
                    const taskData = tasks.find(t => t.id === task.id);
                    if (taskData) Modal.open(taskData);
                });
                
                    columnEl.appendChild(taskEl);
                });
            })();
            
            weekContentEl.appendChild(columnEl);
        }
    },

    renderDayView() {
        const monthView = document.getElementById('monthView');
        const weekView = document.getElementById('weekView');
        const dayView = document.getElementById('dayView');
        
        if (monthView) monthView.style.display = 'none';
        if (weekView) weekView.style.display = 'none';
        if (dayView) dayView.style.display = 'block';

        const dayHeaderEl = document.getElementById('dayHeader');
        const dayTimelineEl = document.getElementById('dayTimeline');
        
        if (!dayHeaderEl || !dayTimelineEl) return;

        // Render day header
        dayHeaderEl.innerHTML = `
            <h2>${this.currentDate.format('dddd, MMMM D, YYYY')}</h2>
            <p>${this.currentDate.format('dddd')}</p>
        `;

        // Render timeline
        dayTimelineEl.innerHTML = '';
        const tasks = TaskManager.getTasksForDate(this.currentDate.format('YYYY-MM-DD'));
        
        // Group tasks by approximate hour (simplified)
        for (let hour = 0; hour < 24; hour++) {
            const hourEl = document.createElement('div');
            hourEl.className = 'timeline-hour';
            
            const timeEl = document.createElement('div');
            timeEl.className = 'timeline-time';
            timeEl.textContent = hour.toString().padStart(2, '0') + ':00';
            
            const contentEl = document.createElement('div');
            contentEl.className = 'timeline-content';
            
            // Filter tasks for this hour (simplified - assign based on priority)
            const hourTasks = tasks.filter((task, index) => {
                if (tasks.length <= 24) {
                    return index % 24 === hour;
                }
                return index % Math.ceil(tasks.length / 24) === Math.floor(hour / 24);
            });
            
            hourTasks.forEach(task => {
                const taskEl = document.createElement('div');
                taskEl.className = `day-task ${task.category}`;
                
                const title = document.createElement('div');
                title.className = 'day-task-title';
                title.textContent = task.title;
                
                const meta = document.createElement('div');
                meta.className = 'day-task-meta';
                meta.innerHTML = `
                    <span>${task.category}</span>
                    <span>${task.priority}</span>
                    <span>${Utils.formatDate(task.dueDate)}</span>
                `;
                
                taskEl.appendChild(title);
                taskEl.appendChild(meta);
                
                taskEl.addEventListener('click', () => {
                    const tasks = DataStorage.getTasks();
                    const taskData = tasks.find(t => t.id === task.id);
                    if (taskData) Modal.open(taskData);
                });
                
                contentEl.appendChild(taskEl);
            });
            
                hourEl.appendChild(timeEl);
                hourEl.appendChild(contentEl);
                dayTimelineEl.appendChild(hourEl);
            }
        })();
    }
};

// Initialize calendar if on calendar page
if (document.getElementById('calendarDays')) {
    if (typeof dayjs !== 'undefined') {
        // Wait for CalendarNotes to be available
        if (typeof CalendarNotes !== 'undefined') {
            CalendarNotes.init();
        }
        CalendarRenderer.init();
        
        // Setup calendar note modal
        document.addEventListener('DOMContentLoaded', () => {
            const modal = document.getElementById('calendarNoteModal');
            const closeBtn = document.getElementById('calendarNoteModalClose');
            const cancelBtn = document.getElementById('calendarNoteCancel');
            const form = document.getElementById('calendarNoteForm');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    if (typeof CalendarNotes !== 'undefined') {
                        CalendarNotes.closeNoteModal();
                    }
                });
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    if (typeof CalendarNotes !== 'undefined') {
                        CalendarNotes.closeNoteModal();
                    }
                });
            }
            
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    if (typeof CalendarNotes !== 'undefined') {
                        await CalendarNotes.saveNoteFromModal();
                    }
                });
            }
            
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        if (typeof CalendarNotes !== 'undefined') {
                            CalendarNotes.closeNoteModal();
                        }
                    }
                });
            }
        });
    }
}
