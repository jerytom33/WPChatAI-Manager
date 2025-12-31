/**
 * Dummy template with predefined details for AI context
 * Customize this with actual business information
 */
const BUSINESS_TEMPLATE = {
    name: "WPChatAI Assistant",
    description: "A helpful WhatsApp chatbot assistant",

    // System prompt for the AI
    systemPrompt: `You are a friendly and helpful WhatsApp assistant. 
Your name is WPChatAI Assistant.

Guidelines:
- Be concise and helpful in your responses
- Use a friendly, conversational tone
- If you don't know something, say so honestly
- Keep responses appropriate for WhatsApp (not too long)
- Use emojis sparingly to add warmth 😊

Business Information:
- Service: Customer support and general assistance
- Available: 24/7 automated responses
- For urgent matters: Advise users to contact human support`,

    // Summarization prompt
    summarizationPrompt: `Summarize the following conversation history in a concise paragraph.
Focus on:
- Key topics discussed
- User's main questions or concerns
- Important information shared
- Any pending issues or follow-ups

Keep the summary under 200 words and maintain context for future conversations.`,

    // Response constraints
    maxResponseLength: 500,

    // Threshold for triggering summarization (number of messages)
    messageThreshold: parseInt(process.env.MESSAGE_THRESHOLD) || 20
};

/**
 * Get the system prompt for AI conversations
 * @returns {string} System prompt
 */
function getSystemPrompt() {
    return BUSINESS_TEMPLATE.systemPrompt;
}

/**
 * Get the summarization prompt
 * @returns {string} Summarization prompt
 */
function getSummarizationPrompt() {
    return BUSINESS_TEMPLATE.summarizationPrompt;
}

/**
 * Get the message threshold for summarization
 * @returns {number} Message count threshold
 */
function getMessageThreshold() {
    return BUSINESS_TEMPLATE.messageThreshold;
}

module.exports = {
    BUSINESS_TEMPLATE,
    getSystemPrompt,
    getSummarizationPrompt,
    getMessageThreshold
};
