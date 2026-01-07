const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.BOOKING_DB_URL);

async function checkDoctors() {
    console.log("--- Doctors ---");
    const docs = await sql`SELECT * FROM doctors LIMIT 5`;
    console.log(docs);

    console.log("\n--- Users (First 5) ---");
    const users = await sql`SELECT id, name FROM users LIMIT 5`;
    console.log(users);
}
checkDoctors();
