/**
 * Dummy template with predefined details for AI context
 * Customize this with actual business information
 */
const BUSINESS_TEMPLATE = {
    name: "WPChatAI Assistant",
    description: "A helpful WhatsApp chatbot assistant",

    // System prompt for the AI - optimized for minimal tokens
    // System prompt for the AI - strict and knowledgeable
    systemPrompt: `You are a strict, knowledgeable, and professional AI assistant.
RULES:
- Provide accurate, factual, and direct answers.
- Reply in MAXIMUM TWO short sentence only
- Do NOT use a casual or friendly tone. Be formal.
- Do NOT include any internal thought processes, reasoning, or <think> tags in your output.
- Be concise but ensure the answer is complete and informative.
- If you don't know the answer, state that clearly.`,

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
