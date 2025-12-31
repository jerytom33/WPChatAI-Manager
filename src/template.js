/**
 * Dummy template with predefined details for AI context
 * Customize this with actual business information
 */
const BUSINESS_TEMPLATE = {
    name: "WPChatAI Assistant",
    description: "A helpful WhatsApp chatbot assistant",

    // System prompt for the AI - optimized for minimal tokens
    systemPrompt: `You are a friendly WhatsApp assistant.
RULES:
- Reply in ONE short sentence only (max 15 words)
- Be helpful and direct
- Use casual, friendly tone
- Never include thinking, reasoning, or <think> tags
- Just give the answer, no explanations`,

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
