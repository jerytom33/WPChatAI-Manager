const Groq = require('groq-sdk');
const { getSystemPrompt, BUSINESS_TEMPLATE } = require('./template');
const { checkAvailability, createBooking } = require('./bookingService');

// Initialize Groq client (uses GROQ_API_KEY from environment)
const apiKey = process.env.GROQ_API_KEY || 'dummy_key_for_startup';
const groq = new Groq({ apiKey });

// Model to use
const MODEL = 'qwen/qwen3-32b';

// Tool Definitions
const TOOLS = [
    {
        type: "function",
        function: {
            name: "check_availability",
            description: "Check available appointment slots for a specific date or time range",
            parameters: {
                type: "object",
                properties: {
                    date: {
                        type: "string",
                        description: "The date to check availability for (e.g., '2023-10-27' or 'tomorrow')"
                    }
                },
                required: ["date"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "book_appointment",
            description: "Book a new appointment for the user",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Customer name" },
                    phone: { type: "string", description: "Customer phone number" },
                    date: { type: "string", description: "Date of appointment (YYYY-MM-DD)" },
                    time: { type: "string", description: "Time of appointment (HH:MM AM/PM)" },
                    reason: { type: "string", description: "Reason for visit (optional)" }
                },
                required: ["name", "phone", "date", "time"]
            }
        }
    }
];

/**
 * Generate a response using Groq's chat completion API with Tool Calling support
 */
async function generateResponse(messages, newMessage, systemPromptOverride) {
    try {
        let conversationContext = buildContext(messages, newMessage, systemPromptOverride);

        // First API Call: Check if AI wants to use a tool
        const response = await groq.chat.completions.create({
            model: MODEL,
            messages: conversationContext,
            tools: TOOLS,
            tool_choice: "auto",
            max_tokens: BUSINESS_TEMPLATE.maxResponseLength || 1000,
            temperature: 0.3,
        });

        const responseMessage = response.choices[0]?.message;

        // If no tool call, return text directly
        if (!responseMessage?.tool_calls || responseMessage.tool_calls.length === 0) {
            return cleanResponse(responseMessage?.content);
        }

        // Handle Tool Calls
        conversationContext.push(responseMessage); // Add assistant's tool-call message to history

        for (const toolCall of responseMessage.tool_calls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            let functionResult;

            console.log(`🛠️ Tool Call: ${functionName}`, functionArgs);

            if (functionName === 'check_availability') {
                functionResult = await checkAvailability(functionArgs.date);
            } else if (functionName === 'book_appointment') {
                functionResult = await createBooking(functionArgs);
            } else {
                functionResult = { error: "Unknown tool" };
            }

            // Append tool result to context
            conversationContext.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: JSON.stringify(functionResult),
            });
        }

        // Second API Call: Generate final response based on tool result
        const finalResponse = await groq.chat.completions.create({
            model: MODEL,
            messages: conversationContext,
            max_tokens: 1000,
            temperature: 0.3,
        });

        return cleanResponse(finalResponse.choices[0]?.message?.content);

    } catch (error) {
        console.error('AI Service Error:', error.message);
        return "I encountered a technical issue while processing your request.";
    }
}

function cleanResponse(text) {
    if (!text) return "I apologize, coudl you please rephrase that?";
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    text = text.replace(/^[\s\S]*?<\/think>/gi, '').trim();
    return text;
}

/**
 * Build the conversation context for the AI
 */
function buildContext(messages, newMessage, systemPromptOverride) {
    const context = [];
    context.push({
        role: 'system',
        content: systemPromptOverride || getSystemPrompt()
    });
    // Add recent messages
    const recentMessages = messages.slice(-10);
    for (const msg of recentMessages) {
        context.push({
            role: msg.role === 'bot' ? 'assistant' : 'user',
            content: msg.content
        });
    }
    context.push({ role: 'user', content: newMessage });
    return context;
}

module.exports = {
    generateResponse,
};
