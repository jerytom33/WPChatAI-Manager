const axios = require('axios');

/**
 * Send a reply message via the WhatsApp Flowbuilder API
 * @param {string} from - Sender's phone number (original recipient)
 * @param {string} to - Recipient's phone number (original sender)
 * @param {string} message - Message text to send
 * @returns {Object} API response
 */
async function sendReply(from, to, message) {
    const apiUrl = process.env.WHATSAPP_API_URL || 'https://api.aoc-portal.com/v1/whatsapp';
    const apiKey = process.env.WHATSAPP_API_KEY;

    if (!apiKey) {
        console.error('❌ WHATSAPP_API_KEY is not configured');
        throw new Error('WhatsApp API key not configured');
    }

    try {
        const payload = {
            recipient_type: 'individual',
            from: from,
            to: to,
            type: 'text',
            text: {
                body: message
            }
        };

        console.log(`📤 Sending reply to ${to}...`);

        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
            }
        });

        console.log(`✅ Reply sent successfully to ${to}`);
        return response.data;

    } catch (error) {
        console.error('❌ WhatsApp Reply Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

module.exports = {
    sendReply
};
