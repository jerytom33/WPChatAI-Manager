const Groq = require('groq-sdk');
const { getSystemPrompt, getSummarizationPrompt } = require('./template');

// Initialize Groq client (uses GROQ_API_KEY from environment)
const groq = new Groq();

// Model to use
const MODEL = 'qwen/qwen3-32b';

/**
 * Generate a response using Groq's chat completion API
 * @param {Array} messages - Previous conversation messages
 * @param {string} summary - Summarized previous context
 * @param {string} newMessage - Current user message
 * @returns {string} AI generated response
 */
async function generateResponse(messages, summary, newMessage) {
    try {
        // Build the conversation context
        const conversationContext = buildContext(messages, summary, newMessage);

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: conversationContext,
            max_tokens: 120,
            temperature: 0.3,
        });

        // Extract the AI response
        let response = completion.choices[0]?.message?.content;

        if (response) {
            // Remove any <think> tags and their content (handling multi-line and unclosed tags)
            response = response.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            response = response.replace(/^[\s\S]*?<\/think>/gi, '').trim(); // Handle unclosed start
            response = response.replace(/<think>[\s\S]*$/gi, '').trim(); // Handle unclosed end

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
 * @param {string} summary - Summarized context
 * @param {string} newMessage - New user message
 * @returns {Array} Formatted messages array for AI
 */
function buildContext(messages, summary, newMessage) {
    const context = [];

    // Add system prompt
    context.push({
        role: 'system',
        content: getSystemPrompt()
    });

    // Add summary if exists
    if (summary && summary.trim()) {
        context.push({
            role: 'system',
            content: `Previous conversation summary: ${summary}`
        });
    }

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

/**
 * Summarize a conversation using Groq AI
 * @param {Array} messages - Messages to summarize
 * @param {string} existingSummary - Existing summary to include
 * @returns {string} Summarized conversation
 */
async function summarizeConversation(messages, existingSummary = '') {
    try {
        // Format messages for summarization
        let conversationText = '';

        if (existingSummary) {
            conversationText += `Previous context: ${existingSummary}\n\n`;
        }

        conversationText += 'Recent conversation:\n';
        for (const msg of messages) {
            const role = msg.role === 'bot' ? 'Assistant' : 'User';
            conversationText += `${role}: ${msg.content}\n`;
        }

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: getSummarizationPrompt()
                },
                {
                    role: 'user',
                    content: conversationText
                }
            ]
        });

        const response = completion.choices[0]?.message?.content;

        if (response) {
            return response;
        }

        console.error('Unexpected summarization response:', completion);
        return existingSummary || 'Previous conversation context unavailable.';

    } catch (error) {
        console.error('Summarization Error:', error.message);
        return existingSummary || 'Previous conversation context unavailable.';
    }
}

module.exports = {
    generateResponse,
    summarizeConversation
};
