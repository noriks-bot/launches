const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3006;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load data
function loadData() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return {
            countries: ["HR", "CZ", "PL", "GR", "IT", "HU", "SK"],
            defaultTasks: [],
            assignees: ["Ajda", "Dejan", "Grega", "Petra", "Teja"],
            countryData: {}
        };
    }
}

// Save data
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Initialize country data if missing
function initCountryData(data, country) {
    if (!data.countryData[country]) {
        data.countryData[country] = { tasks: [], customTasks: [] };
    }
    // Ensure all default tasks exist
    data.defaultTasks.forEach((taskName, index) => {
        const existing = data.countryData[country].tasks.find(t => t.name === taskName);
        if (!existing) {
            data.countryData[country].tasks.push({
                id: `default-${index}`,
                name: taskName,
                done: false,
                assignee: "",
                notes: ""
            });
        }
    });
    return data;
}

// GET all data
app.get('/api/data', (req, res) => {
    let data = loadData();
    // Initialize all countries
    data.countries.forEach(country => {
        data = initCountryData(data, country);
    });
    saveData(data);
    res.json(data);
});

// GET country data
app.get('/api/country/:code', (req, res) => {
    let data = loadData();
    const country = req.params.code.toUpperCase();
    data = initCountryData(data, country);
    saveData(data);
    res.json({
        country: country,
        tasks: data.countryData[country].tasks,
        customTasks: data.countryData[country].customTasks || []
    });
});

// UPDATE task
app.put('/api/country/:code/task/:taskId', (req, res) => {
    const data = loadData();
    const country = req.params.code.toUpperCase();
    const taskId = req.params.taskId;
    const { done, assignee, notes } = req.body;

    if (!data.countryData[country]) {
        return res.status(404).json({ error: 'Country not found' });
    }

    // Check in regular tasks
    let task = data.countryData[country].tasks.find(t => t.id === taskId);
    if (!task) {
        // Check in custom tasks
        task = (data.countryData[country].customTasks || []).find(t => t.id === taskId);
    }

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    if (done !== undefined) task.done = done;
    if (assignee !== undefined) task.assignee = assignee;
    if (notes !== undefined) task.notes = notes;

    saveData(data);
    res.json({ success: true, task });
});

// ADD custom task
app.post('/api/country/:code/task', (req, res) => {
    const data = loadData();
    const country = req.params.code.toUpperCase();
    const { name } = req.body;

    if (!data.countryData[country]) {
        data.countryData[country] = { tasks: [], customTasks: [] };
    }
    if (!data.countryData[country].customTasks) {
        data.countryData[country].customTasks = [];
    }

    const newTask = {
        id: `custom-${Date.now()}`,
        name: name,
        done: false,
        assignee: "",
        notes: "",
        isCustom: true
    };

    data.countryData[country].customTasks.push(newTask);
    saveData(data);
    res.json({ success: true, task: newTask });
});

// DELETE custom task
app.delete('/api/country/:code/task/:taskId', (req, res) => {
    const data = loadData();
    const country = req.params.code.toUpperCase();
    const taskId = req.params.taskId;

    if (!data.countryData[country]) {
        return res.status(404).json({ error: 'Country not found' });
    }

    const customTasks = data.countryData[country].customTasks || [];
    const index = customTasks.findIndex(t => t.id === taskId);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Custom task not found' });
    }

    customTasks.splice(index, 1);
    saveData(data);
    res.json({ success: true });
});

// ADD new country
app.post('/api/country', (req, res) => {
    const data = loadData();
    const { code } = req.body;
    const countryCode = code.toUpperCase();

    if (data.countries.includes(countryCode)) {
        return res.status(400).json({ error: 'Country already exists' });
    }

    data.countries.push(countryCode);
    data.countryData[countryCode] = { tasks: [], customTasks: [] };
    
    // Initialize with default tasks
    data.defaultTasks.forEach((taskName, index) => {
        data.countryData[countryCode].tasks.push({
            id: `default-${index}`,
            name: taskName,
            done: false,
            assignee: "",
            notes: ""
        });
    });

    saveData(data);
    res.json({ success: true, country: countryCode });
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Launches server running on port ${PORT}`);
});
