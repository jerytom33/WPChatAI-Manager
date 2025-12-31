const fs = require('fs');
const path = require('path');

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



    // Response constraints
    maxResponseLength: 1000,


};

/**
 * Get the system prompt for AI conversations
 * @returns {string} System prompt
 */
function getSystemPrompt() {
    try {
        const aboutPath = path.join(__dirname, 'about.txt');
        if (fs.existsSync(aboutPath)) {
            const aboutContent = fs.readFileSync(aboutPath, 'utf-8');
            return `${BUSINESS_TEMPLATE.systemPrompt}\n\nCompany Context:\n${aboutContent}`;
        }
    } catch (error) {
        console.error('Error reading about.txt:', error);
    }
    return BUSINESS_TEMPLATE.systemPrompt;
}





module.exports = {
    BUSINESS_TEMPLATE,
    getSystemPrompt,

};
