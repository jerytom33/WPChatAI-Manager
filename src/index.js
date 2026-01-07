require('dotenv').config();

const express = require('express');
const { createTables } = require('./db');
const { handleWebhook } = require('./webhookHandler');

const adminRoutes = require('./adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for development (allowing frontend on different port)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // For dev only
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// API Routes
app.use('/api', adminRoutes);

// Webhook endpoint for WhatsApp messages
app.post('/webhook/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;
        const result = await handleWebhook(req.body, businessId);

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

// Only start the server if running directly
if (require.main === module) {
    startServer();
}

module.exports = app;
