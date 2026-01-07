const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const connectionString = process.env.BOOKING_DB_URL;
const sql = neon(connectionString);

async function checkData() {
    const clinics = await sql`SELECT id, name, city FROM clinics LIMIT 10`;
    console.log("Clinics:", clinics);
}
checkData();
