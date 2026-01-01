/**
 * Smart Planner - Calendar Notes Feature
 * Handles date-specific notes and task tracking on calendar dates
 */

const CalendarNotes = {
    notes: {},
    currentNoteDate: null,

    init() {
        this.loadAllNotes();
        this.setupEventListeners();
    },

    async loadAllNotes() {
        try {
            if (typeof API !== 'undefined') {
                this.notes = await API.getAllCalendarNotes();
            } else {
                const stored = localStorage.getItem('calendarNotes');
                this.notes = stored ? JSON.parse(stored) : {};
            }
        } catch (error) {
            console.error('Error loading calendar notes:', error);
            this.notes = {};
        }
    },

    async getNoteForDate(date) {
        const dateStr = typeof date === 'string' ? date : dayjs(date).format('YYYY-MM-DD');
        
        if (this.notes[dateStr]) {
            return this.notes[dateStr];
        }
        
        try {
            if (typeof API !== 'undefined') {
                const note = await API.getCalendarNote(dateStr);
                this.notes[dateStr] = note;
                return note;
            }
        } catch (error) {
            console.error('Error fetching note:', error);
        }
        
        return { date: dateStr, checked: false, notes: '', tasks: [] };
    },

    async saveNote(date, noteData) {
        const dateStr = typeof date === 'string' ? date : dayjs(date).format('YYYY-MM-DD');
        
        const note = {
            date: dateStr,
            checked: noteData.checked !== undefined ? noteData.checked : false,
            notes: noteData.notes || '',
            tasks: noteData.tasks || []
        };
        
        this.notes[dateStr] = note;
        
        try {
            if (typeof API !== 'undefined') {
                await API.saveCalendarNote(dateStr, note);
            } else {
                localStorage.setItem('calendarNotes', JSON.stringify(this.notes));
            }
        } catch (error) {
            console.error('Error saving note:', error);
            localStorage.setItem('calendarNotes', JSON.stringify(this.notes));
        }
        
        return note;
    },

    async toggleDateChecked(date) {
        const dateStr = typeof date === 'string' ? date : dayjs(date).format('YYYY-MM-DD');
        const note = await this.getNoteForDate(dateStr);
        note.checked = !note.checked;
        await this.saveNote(dateStr, note);
        return note;
    },

    setupEventListeners() {
        // Note modal will be handled in calendar-view.js
    },

    openNoteModal(date) {
        this.currentNoteDate = typeof date === 'string' ? date : dayjs(date).format('YYYY-MM-DD');
        const modal = document.getElementById('calendarNoteModal');
        if (modal) {
            this.loadNoteIntoModal();
            modal.classList.add('active');
        }
    },

    async loadNoteIntoModal() {
        if (!this.currentNoteDate) return;
        
        const note = await this.getNoteForDate(this.currentNoteDate);
        const checkedInput = document.getElementById('calendarNoteChecked');
        const notesTextarea = document.getElementById('calendarNoteText');
        const dateDisplay = document.getElementById('calendarNoteDate');
        
        if (checkedInput) checkedInput.checked = note.checked || false;
        if (notesTextarea) notesTextarea.value = note.notes || '';
        if (dateDisplay) {
            const formattedDate = dayjs(this.currentNoteDate).format('dddd, MMMM D, YYYY');
            dateDisplay.textContent = formattedDate;
        }
    },

    async saveNoteFromModal() {
        if (!this.currentNoteDate) return;
        
        const checkedInput = document.getElementById('calendarNoteChecked');
        const notesTextarea = document.getElementById('calendarNoteText');
        
        await this.saveNote(this.currentNoteDate, {
            checked: checkedInput ? checkedInput.checked : false,
            notes: notesTextarea ? notesTextarea.value : '',
            tasks: []
        });
        
        this.closeNoteModal();
        
        // Refresh calendar if on calendar page
        if (typeof CalendarRenderer !== 'undefined') {
            CalendarRenderer.render();
        }
    },

    closeNoteModal() {
        const modal = document.getElementById('calendarNoteModal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.currentNoteDate = null;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('calendarDays') || document.getElementById('calendarNoteModal')) {
            CalendarNotes.init();
        }
    });
} else {
    if (document.getElementById('calendarDays') || document.getElementById('calendarNoteModal')) {
        CalendarNotes.init();
    }
}
