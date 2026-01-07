const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const connectionString = process.env.BOOKING_DB_URL;
const sql = neon(connectionString);

async function inspectColumns() {
    const tables = ['doctors', 'doctor_schedules', 'specializations', 'appointments'];

    for (const table of tables) {
        try {
            const columns = await sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = ${table}
            `;
            console.log(`\n--- ${table} ---`);
            console.log(columns.map(c => `${c.column_name} (${c.data_type})`).join(', '));

            // Also peek at one row to see data shape
            // const row = await sql`SELECT * FROM ${sql(table)} LIMIT 1`; // sql helper might not work this way in simple mode
            const row = await sql(`SELECT * FROM ${table} LIMIT 1`);
            console.log('Sample Row:', row);
        } catch (e) {
            console.error(`Error inspecting ${table}:`, e.message);
        }
    }
}

inspectColumns();
