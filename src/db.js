const { neon } = require('@neondatabase/serverless');

let sql;

/**
 * Initialize the database connection
 */
function initDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  sql = neon(process.env.DATABASE_URL);
  return sql;
}

/**
 * Get the SQL client
 */
function getDb() {
  if (!sql) {
    return initDb();
  }
  return sql;
}

/**
 * Create the users table if it doesn't exist
 */
async function createTables() {
  const db = getDb();
  
  await db`
    CREATE TABLE IF NOT EXISTS users (
      waNumber VARCHAR(20) PRIMARY KEY,
      profileName VARCHAR(255),
      lastInteraction TIMESTAMP DEFAULT NOW(),
      summary TEXT DEFAULT '',
      waMSG JSONB DEFAULT '[]'::jsonb
    )
  `;
  
  console.log('✅ Database tables initialized');
}

module.exports = {
  initDb,
  getDb,
  createTables
};
