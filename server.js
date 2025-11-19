const express = require('express');
const cors = require('cors');
require('dotenv').config();

const urlRoutes = require('./routes/urls');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', urlRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'URL Shortener API is running!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});