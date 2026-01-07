const Groq = require('groq-sdk');
const { getSystemPrompt, BUSINESS_TEMPLATE } = require('./template');

// Initialize Groq client (uses GROQ_API_KEY from environment)
// Pass a dummy key if not present to allow server startup (actual calls will use tenant key if refactored, 
// but currently aiService uses global instance. We probably want to instantiate per request or ensure global key exists)
const apiKey = process.env.GROQ_API_KEY || 'dummy_key_for_startup';
const groq = new Groq({ apiKey });

// Model to use
const MODEL = 'qwen/qwen3-32b';

/**
 * Generate a response using Groq's chat completion API
 * @param {Array} messages - Previous conversation messages
 * @param {string} newMessage - Current user message
 * @param {string} [systemPromptOverride] - Optional system prompt override
 * @returns {string} AI generated response
 */
async function generateResponse(messages, newMessage, systemPromptOverride) {
    try {
        // Build the conversation context
        const conversationContext = buildContext(messages, newMessage, systemPromptOverride);

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: conversationContext,
            max_tokens: BUSINESS_TEMPLATE.maxResponseLength || 1000,
            temperature: 0.3,
        });

        // Extract the AI response
        let response = completion.choices[0]?.message?.content;

        if (response) {
            // Remove any <think> tags and their content (handling multi-line and unclosed tags)
            response = response.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            response = response.replace(/^[\s\S]*?<\/think>/gi, '').trim(); // Handle unclosed start
            response = response.replace(/<think>[\s\S]*$/gi, '').trim(); // Handle unclosed end

            if (!response) {
                return "I apologize, could you please rephrase that?";
            }

            return response;
        }

        console.error('Unexpected AI response structure:', completion);
        return "Please try again.";

    } catch (error) {
        console.error('AI Service Error:', error.message);
        return "Technical issue, try again.";
    }
}

/**
 * Build the conversation context for the AI
 * @param {Array} messages - Previous messages
 * @param {string} newMessage - New user message
 * @param {string} [systemPromptOverride] - Optional system prompt override
 * @returns {Array} Formatted messages array for AI
 */
function buildContext(messages, newMessage, systemPromptOverride) {
    const context = [];

    // Add system prompt
    context.push({
        role: 'system',
        content: systemPromptOverride || getSystemPrompt()
    });

    // Add recent messages (limit to last 10 for context window)
    const recentMessages = messages.slice(-10);
    for (const msg of recentMessages) {
        context.push({
            role: msg.role === 'bot' ? 'assistant' : 'user',
            content: msg.content
        });
    }

    // Add the new message
    context.push({
        role: 'user',
        content: newMessage
    });

    return context;
}

module.exports = {
    generateResponse,
};
