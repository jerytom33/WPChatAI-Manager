const axios = require('axios');

/**
 * Send a reply message via the WhatsApp Flowbuilder API
 * @param {string} from - Sender's phone number (original recipient)
 * @param {string} to - Recipient's phone number (original sender)
 * @param {string} message - Message text to send
 * @param {string} apiKey - API Key for the specific tenant
 * @returns {Object} API response
 */
async function sendReply(from, to, message, apiKey) {
    const apiUrl = process.env.WHATSAPP_API_URL || 'https://api.aoc-portal.com/v1/whatsapp';

    if (!apiKey) {
        console.error('❌ API Key missing for reply');
        throw new Error('WhatsApp API key not provided');
    }

    if (!message || !message.trim()) {
        console.warn('⚠️ Empty message content, skipping send.');
        return { status: 'skipped', reason: 'empty_message' };
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

        const maxRetries = 3;
        let attempt = 0;
        let sent = false;
        let responseData;

        while (attempt < maxRetries && !sent) {
            try {
                attempt++;
                const response = await axios.post(apiUrl, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': apiKey
                    },
                    timeout: 10000 // 10s timeout
                });

                console.log(`✅ Reply sent successfully to ${to}`);
                responseData = response.data;
                sent = true;
            } catch (error) {
                console.error(`❌ Attempt ${attempt} failed:`, error.message);

                // Don't retry on 4xx errors (client errors) except 429 (rate limit)
                if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
                    throw error;
                }

                if (attempt === maxRetries) throw error;

                // Wait before retrying (1s, 2s, 4s)
                const delay = 1000 * Math.pow(2, attempt - 1);
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        return responseData;

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
