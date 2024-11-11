// app.js

const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const app = express();
const port = 3300;
const prisma = new PrismaClient();

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API route to get the latest record
app.get('/latest-record', async (req, res) => {
    try {
        const latestRecord = await prisma.obd_check.findFirst({
            orderBy: { createdAt: 'desc' },
        });

        if (!latestRecord) {
            return res.status(404).json(null);
        }

        res.json(latestRecord);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
