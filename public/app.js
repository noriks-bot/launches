// State
let appData = null;
let currentCountry = 'HR';
let currentNotesTaskId = null;
const assignees = ['Ajda', 'Dejan', 'Grega', 'Petra', 'Teja'];

// Country flags
const countryFlags = {
    'HR': '🇭🇷',
    'CZ': '🇨🇿',
    'PL': '🇵🇱',
    'GR': '🇬🇷',
    'IT': '🇮🇹',
    'HU': '🇭🇺',
    'SK': '🇸🇰',
    'RO': '🇷🇴',
    'BG': '🇧🇬',
    'RS': '🇷🇸',
    'SI': '🇸🇮',
    'AT': '🇦🇹',
    'DE': '🇩🇪',
    'FR': '🇫🇷',
    'ES': '🇪🇸',
    'PT': '🇵🇹',
    'NL': '🇳🇱',
    'BE': '🇧🇪',
    'SE': '🇸🇪',
    'DK': '🇩🇰',
    'NO': '🇳🇴',
    'FI': '🇫🇮'
};

function getFlag(code) {
    return countryFlags[code] || '🏳️';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

// Load data from server
async function loadData() {
    try {
        const response = await fetch('/api/data');
        appData = await response.json();
        renderCountryNav();
        loadCountry(currentCountry);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Render country navigation
function renderCountryNav() {
    const nav = document.getElementById('countryNav');
    nav.innerHTML = appData.countries.map(code => `
        <li class="nav-item ${code === currentCountry ? 'active' : ''}" data-country="${code}">
            <a class="nav-link" onclick="loadCountry('${code}')">
                <span class="country-flag-nav">${getFlag(code)}</span>
                <span>${code}</span>
            </a>
        </li>
    `).join('');
}

// Load country data
async function loadCountry(code) {
    currentCountry = code;
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.country === code);
    });
    
    // Update header
    document.getElementById('countryFlag').textContent = getFlag(code);
    document.getElementById('countryName').textContent = code;
    
    // Close sidebar on mobile
    closeSidebar();
    
    try {
        const response = await fetch(`/api/country/${code}`);
        const data = await response.json();
        renderTasks(data.tasks, data.customTasks);
    } catch (error) {
        console.error('Error loading country:', error);
    }
}

// Render tasks
function renderTasks(tasks, customTasks) {
    const container = document.getElementById('tasksList');
    const allTasks = [...tasks, ...customTasks];
    
    container.innerHTML = allTasks.map(task => `
        <div class="task-item ${task.done ? 'done' : ''}" data-task-id="${task.id}">
            <div class="task-checkbox ${task.done ? 'checked' : ''}" onclick="toggleTask('${task.id}')">
                ${task.done ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <span class="task-name">${task.name}</span>
            <div class="task-assignee">
                <select onchange="updateAssignee('${task.id}', this.value)">
                    <option value="">--</option>
                    ${assignees.map(a => `
                        <option value="${a}" ${task.assignee === a ? 'selected' : ''}>${a}</option>
                    `).join('')}
                </select>
            </div>
            <button class="task-notes-btn ${task.notes ? 'has-notes' : ''}" onclick="openNotesModal('${task.id}', '${escapeHtml(task.name)}', '${escapeHtml(task.notes || '')}')">
                <i class="fas fa-sticky-note"></i>
            </button>
            ${task.isCustom ? `
                <button class="task-delete-btn" onclick="deleteTask('${task.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            ` : ''}
        </div>
    `).join('');
    
    updateProgress(allTasks);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Update progress
function updateProgress(tasks) {
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    
    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('tasksDone').textContent = done;
    document.getElementById('tasksTotal').textContent = total;
}

// Toggle task done
async function toggleTask(taskId) {
    const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
    const checkbox = taskEl.querySelector('.task-checkbox');
    const isDone = !checkbox.classList.contains('checked');
    
    try {
        await fetch(`/api/country/${currentCountry}/task/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ done: isDone })
        });
        
        checkbox.classList.toggle('checked', isDone);
        checkbox.innerHTML = isDone ? '<i class="fas fa-check"></i>' : '';
        taskEl.classList.toggle('done', isDone);
        
        // Reload to update progress
        loadCountry(currentCountry);
    } catch (error) {
        console.error('Error toggling task:', error);
    }
}

// Update assignee
async function updateAssignee(taskId, assignee) {
    try {
        await fetch(`/api/country/${currentCountry}/task/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignee })
        });
    } catch (error) {
        console.error('Error updating assignee:', error);
    }
}

// Notes modal
function openNotesModal(taskId, taskName, notes) {
    currentNotesTaskId = taskId;
    document.getElementById('modalTaskName').textContent = taskName;
    document.getElementById('notesTextarea').value = notes.replace(/\\n/g, '\n');
    document.getElementById('notesModal').classList.add('active');
}

function closeNotesModal() {
    document.getElementById('notesModal').classList.remove('active');
    currentNotesTaskId = null;
}

async function saveNotes() {
    const notes = document.getElementById('notesTextarea').value;
    
    try {
        await fetch(`/api/country/${currentCountry}/task/${currentNotesTaskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes })
        });
        
        closeNotesModal();
        loadCountry(currentCountry);
    } catch (error) {
        console.error('Error saving notes:', error);
    }
}

// Add task modal
function showAddTaskModal() {
    document.getElementById('newTaskName').value = '';
    document.getElementById('addTaskModal').classList.add('active');
    document.getElementById('newTaskName').focus();
}

function closeAddTaskModal() {
    document.getElementById('addTaskModal').classList.remove('active');
}

async function addNewTask() {
    const name = document.getElementById('newTaskName').value.trim();
    if (!name) return;
    
    try {
        await fetch(`/api/country/${currentCountry}/task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        
        closeAddTaskModal();
        loadCountry(currentCountry);
    } catch (error) {
        console.error('Error adding task:', error);
    }
}

// Delete custom task
async function deleteTask(taskId) {
    if (!confirm('Ali res želiš izbrisati ta task?')) return;
    
    try {
        await fetch(`/api/country/${currentCountry}/task/${taskId}`, {
            method: 'DELETE'
        });
        
        loadCountry(currentCountry);
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// Add country modal
function showAddCountryModal() {
    document.getElementById('newCountryCode').value = '';
    document.getElementById('addCountryModal').classList.add('active');
    document.getElementById('newCountryCode').focus();
}

function closeAddCountryModal() {
    document.getElementById('addCountryModal').classList.remove('active');
}

async function addNewCountry() {
    const code = document.getElementById('newCountryCode').value.trim().toUpperCase();
    if (!code || code.length < 2 || code.length > 3) {
        alert('Vnesi veljavno kodo države (2-3 znaki)');
        return;
    }
    
    try {
        const response = await fetch('/api/country', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        if (!response.ok) {
            const data = await response.json();
            alert(data.error || 'Napaka pri dodajanju države');
            return;
        }
        
        closeAddCountryModal();
        await loadData();
        loadCountry(code);
    } catch (error) {
        console.error('Error adding country:', error);
    }
}

// Sidebar toggle
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeNotesModal();
        closeAddTaskModal();
        closeAddCountryModal();
    }
});
