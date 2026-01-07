const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.BOOKING_DB_URL);

async function checkDocs() {
    const cols = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'doctors'
    `;
    console.log("Doctors Columns:", cols.map(c => c.column_name));
}
checkDocs();
