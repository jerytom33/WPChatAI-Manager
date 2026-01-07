require('dotenv').config();
const { generateResponse } = require('./src/aiService');

async function testBookingFlow() {
    console.log("--- Testing Booking Flow ---");

    // 1. User asks for availability
    const messages = [];
    const userMsg = "Can I book an appointment for tomorrow?";
    console.log(`User: ${userMsg}`);

    const response = await generateResponse(messages, userMsg);
    console.log(`Bot: ${response}`);

    if (response.includes("Slots available") || response.toLowerCase().includes("available")) {
        console.log("✅ AI correctly checked availability.");
    } else {
        console.log("⚠️ AI might not have called the tool or found no slots.");
    }
}

testBookingFlow();
