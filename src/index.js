require('dotenv').config();

const express = require('express');
const { createTables } = require('./db');
const { handleWebhook } = require('./webhookHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'WPChatAI Backend',
        timestamp: new Date().toISOString()
    });
});

// Webhook endpoint for WhatsApp messages
app.post('/webhook', async (req, res) => {
    try {
        const result = await handleWebhook(req.body);

        if (result.success) {
            res.status(200).json({
                status: 'success',
                ...result
            });
        } else {
            res.status(500).json({
                status: 'error',
                ...result
            });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Verification endpoint for webhook setup (some services require GET)
app.get('/webhook', (req, res) => {
    // Handle webhook verification if needed
    const challenge = req.query['hub.challenge'];
    if (challenge) {
        res.send(challenge);
    } else {
        res.json({
            status: 'ok',
            message: 'Webhook endpoint is active'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database tables
        await createTables();

        // Start the server
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════╗
║         WPChatAI Backend Server                ║
╠════════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}                ║
║  📡 Webhook URL: http://localhost:${PORT}/webhook ║
║  💚 Health check: http://localhost:${PORT}/       ║
╚════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
