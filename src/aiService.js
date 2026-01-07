const Groq = require('groq-sdk');
const { getSystemPrompt, BUSINESS_TEMPLATE } = require('./template');
const { getClinics, getDoctors, checkAvailability, createBooking, getMedicalContext } = require('./bookingService');

// Initialize Groq client
const apiKey = process.env.GROQ_API_KEY || 'dummy_key_for_startup';
const groq = new Groq({ apiKey });

// Model to use
const MODEL = 'qwen/qwen3-32b';

// Tool Definitions
const TOOLS = [
    {
        type: "function",
        function: {
            name: "get_clinics",
            description: "Search for clinics by city or name. Use this when user asks for a hospital or clinic nearby.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "City name (e.g. 'Kochi') or Clinic Name (e.g. 'Apollo')"
                    }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_doctors",
            description: "Find doctors, optionally filtering by clinic or specialization.",
            parameters: {
                type: "object",
                properties: {
                    clinic_id: {
                        type: "integer",
                        description: "The ID of the clinic to find doctors for"
                    },
                    specialization: {
                        type: "string",
                        description: "Specialization (e.g., 'Cardiologist', 'Dentist')"
                    }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "check_availability",
            description: "Check available appointment slots for a specific DOCTOR on a date.",
            parameters: {
                type: "object",
                properties: {
                    doctor_id: {
                        type: "integer",
                        description: "The ID of the doctor"
                    },
                    date: {
                        type: "string",
                        description: "The date to check (YYYY-MM-DD)"
                    }
                },
                required: ["doctor_id", "date"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "book_appointment",
            description: "Book an appointment for a specific doctor.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Customer name" },
                    phone: { type: "string", description: "Customer phone number" },
                    date: { type: "string", description: "Date (YYYY-MM-DD)" },
                    time: { type: "string", description: "Time (HH:MM AM/PM)" },
                    doctor_id: { type: "integer", description: "Doctor ID" },
                    clinic_id: { type: "integer", description: "Clinic ID" },
                    reason: { type: "string", description: "Reason for visit (optional)" }
                },
                required: ["name", "phone", "date", "time", "doctor_id"]
            }
        }
    }
];

/**
 * Generate a response using Groq's chat completion API with Tool Calling support
 */
async function generateResponse(messages, newMessage, systemPromptOverride) {
    try {
        // Fetch real-time knowledge from DB
        const medicalKnowledge = await getMedicalContext();
        const baseSystemPrompt = systemPromptOverride || getSystemPrompt();

        // Enrich system prompt
        const enrichedSystemPrompt = `${baseSystemPrompt}\n\n${medicalKnowledge}\n
        INSTRUCTION: You are fully aware of the clinics and doctors listed above. 
        - If the user asks for a clinic, immediately suggest the ones from 'Available Cities' or 'Key Clinics'. 
        - DO NOT ask the user "which city?" if you see we only have clinics in one city (e.g. Los Angeles). Just assume it.
        - If the user needs a doctor, check your knowledge or use 'get_doctors' to find one matching their needs.
        `;

        let conversationContext = buildContext(messages, newMessage, enrichedSystemPrompt);

        // First API Call
        const response = await groq.chat.completions.create({
            model: MODEL,
            messages: conversationContext,
            tools: TOOLS,
            tool_choice: "auto",
            max_tokens: BUSINESS_TEMPLATE.maxResponseLength || 1000,
            temperature: 0.3,
        });

        const responseMessage = response.choices[0]?.message;

        // If no tool call, return text
        if (!responseMessage?.tool_calls || responseMessage.tool_calls.length === 0) {
            return cleanResponse(responseMessage?.content);
        }

        // Handle Tool Calls
        conversationContext.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            let functionResult;

            console.log(`🛠️ Tool Call: ${functionName}`, functionArgs);

            if (functionName === 'get_clinics') {
                functionResult = await getClinics(functionArgs.query);
            } else if (functionName === 'get_doctors') {
                functionResult = await getDoctors(functionArgs.clinic_id, functionArgs.specialization);
            } else if (functionName === 'check_availability') {
                functionResult = await checkAvailability(functionArgs.doctor_id, functionArgs.date);
            } else if (functionName === 'book_appointment') {
                functionResult = await createBooking(functionArgs);
            } else {
                functionResult = { error: "Unknown tool" };
            }

            conversationContext.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: JSON.stringify(functionResult),
            });
        }

        // Second API Call
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
    if (!text) return "I apologize, could you please rephrase that?";
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    text = text.replace(/^[\s\S]*?<\/think>/gi, '').trim();
    return text;
}

function buildContext(messages, newMessage, systemPromptOverride) {
    const context = [];
    context.push({
        role: 'system',
        content: systemPromptOverride || getSystemPrompt()
    });
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
