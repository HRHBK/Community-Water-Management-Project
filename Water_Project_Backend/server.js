const express = require('express');
const cors = require('cors');
require('dotenv').config();

require('./config/db');

const authRoutes = require('./routes/auth');
const infrastructureRoutes = require('./routes/infrastructure');
const peopleRoutes = require('./routes/people');
const financeRoutes = require('./routes/finance');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/infrastructure', infrastructureRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/finance', financeRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'AquaCam connect API is running'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});