require('dotenv').config();
const { generateResponse } = require('./src/aiService');

async function testMedicalFlow() {
    console.log("--- Testing Medical Agent Flow ---");

    // Step 1: User asks for a clinic
    let messages = [];
    const q1 = "I am looking for a clinic in Los Angeles";
    console.log(`\nUser: ${q1}`);
    const r1 = await generateResponse(messages, q1);
    console.log(`Bot: ${r1}`);
    messages.push({ role: 'user', content: q1 });
    messages.push({ role: 'bot', content: r1 });

    // Step 2: User asks for doctors
    const q2 = "Which doctors are available there?";
    console.log(`\nUser: ${q2}`);
    const r2 = await generateResponse(messages, q2);
    console.log(`Bot: ${r2}`);
    messages.push({ role: 'user', content: q2 });
    messages.push({ role: 'bot', content: r2 });

    // Step 3: User checks availability for a specific doctor
    // (Assuming the bot mentioned a doctor, we'll ask generally to see if it picks one or asks for clarification)
    const q3 = "Is the first doctor available tomorrow?";
    console.log(`\nUser: ${q3}`);
    const r3 = await generateResponse(messages, q3);
    console.log(`Bot: ${r3}`);
}

testMedicalFlow();
