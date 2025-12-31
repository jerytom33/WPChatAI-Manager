const { findOrCreateUser, getConversationHistory, updateConversationHistory, clearHistoryWithSummary } = require('./userService');
const { generateResponse, summarizeConversation } = require('./aiService');
const { sendReply } = require('./whatsappService');
const { getMessageThreshold } = require('./template');

/**
 * Handle incoming webhook from WhatsApp Flowbuilder
 * @param {Object} webhookData - Incoming webhook payload
 * @returns {Object} Processing result
 */
async function handleWebhook(webhookData) {
    console.log('📨 Received webhook:', JSON.stringify(webhookData, null, 2));

    // Validate webhook data
    if (!webhookData || webhookData.event !== 'message_received') {
        console.log('⏭️ Skipping non-message event');
        return { success: true, skipped: true, reason: 'Not a message event' };
    }

    // Extract data from webhook structure
    const { from, contacts, messages } = webhookData;

    if (!from || !messages || messages.type !== 'text') {
        console.log('⏭️ Skipping non-text message');
        return { success: true, skipped: true, reason: 'Not a text message' };
    }

    const waNumber = from;
    const profileName = contacts?.profileName || 'Unknown';
    const businessNumber = contacts?.recipient || '';
    const messageBody = messages.text?.body || '';
    const timestamp = messages.timestamp || Date.now();

    console.log(`📱 Message from: ${waNumber} (${profileName})`);
    console.log(`💬 Message: ${messageBody}`);

    try {
        // Step 1: Find or create user (crosscheck with database using composite key)
        const user = await findOrCreateUser(waNumber, businessNumber, profileName);
        console.log(`👤 User found/created: ${user.wanumber} -> ${user.businessnumber}`);

        // Step 2: Get conversation history (using composite key)
        const { messages: previousMessages, summary } = await getConversationHistory(waNumber, businessNumber);
        console.log(`📚 Previous messages: ${previousMessages.length}, Has summary: ${!!summary}`);

        // Step 3: Check if summarization is needed
        const threshold = getMessageThreshold();
        let currentSummary = summary;
        let currentMessages = previousMessages;

        if (previousMessages.length >= threshold) {
            console.log(`🔄 Message threshold (${threshold}) reached, triggering summarization...`);

            // Summarize the conversation
            const newSummary = await summarizeConversation(previousMessages, summary);

            // Clear history and update summary
            await clearHistoryWithSummary(waNumber, businessNumber, newSummary);

            currentSummary = newSummary;
            currentMessages = [];

            console.log('✅ Summarization complete');
        }

        // Step 4: Generate AI response
        console.log('🤖 Generating AI response...');
        const aiResponse = await generateResponse(currentMessages, currentSummary, messageBody);
        console.log(`🤖 AI Response: ${aiResponse.substring(0, 100)}...`);

        // Step 5: Update conversation history with new messages
        const updatedMessages = [
            ...currentMessages,
            {
                role: 'user',
                content: messageBody,
                timestamp: new Date(timestamp).toISOString()
            },
            {
                role: 'bot',
                content: aiResponse,
                timestamp: new Date().toISOString()
            }
        ];

        await updateConversationHistory(waNumber, businessNumber, updatedMessages);
        console.log('💾 Conversation history updated');

        // Step 6: Send reply via WhatsApp API
        // Based on reply_curl.txt: from=user, to=business (API context/threading)
        const replyFrom = waNumber.startsWith('+') ? waNumber : `+${waNumber}`;
        const replyTo = businessNumber.startsWith('+') ? businessNumber : `+${businessNumber}`;

        console.log(`📞 Reply from: ${replyFrom}, to: ${replyTo}`);

        await sendReply(replyFrom, replyTo, aiResponse);

        return {
            success: true,
            waNumber,
            profileName,
            userMessage: messageBody,
            aiResponse,
            messageCount: updatedMessages.length,
            summarized: previousMessages.length >= threshold
        };

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        return {
            success: false,
            error: error.message,
            waNumber,
            profileName
        };
    }
}

module.exports = {
    handleWebhook
};
