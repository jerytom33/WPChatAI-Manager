const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const connectionString = process.env.BOOKING_DB_URL;

async function inspectDb() {
    if (!connectionString) {
        console.error("Missing BOOKING_DB_URL");
        return;
    }

    console.log("Connecting to DB...");
    const sql = neon(connectionString);

    try {
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;

        console.log("Found tables:", tables.map(t => t.table_name));

        // If doctors/clinics exist, let's peek at their columns
        for (const t of tables) {
            if (['doctors', 'clinics', 'users', 'staff'].includes(t.table_name)) {
                const columns = await sql`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = ${t.table_name}
                `;
                console.log(`Schema for ${t.table_name}:`, columns.map(c => `${c.column_name}(${c.data_type})`));
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

inspectDb();
