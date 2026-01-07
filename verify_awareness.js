require('dotenv').config();
const { generateResponse } = require('./src/aiService');

async function testAwareness() {
    console.log("--- Testing Proactive Awareness ---");

    // User asks vague question
    const q1 = "Where are you located?";
    console.log(`\nUser: ${q1}`);

    // Bot should use injected knowledge to answer directly
    const r1 = await generateResponse([], q1);
    console.log(`Bot (Should mention Los Angeles/Main Clinic): ${r1}`);
}

testAwareness();
