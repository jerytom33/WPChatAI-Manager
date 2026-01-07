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

  // Drop and recreate with new schema (composite key)
  await db`
    CREATE TABLE IF NOT EXISTS users (
      waNumber VARCHAR(20),
      businessNumber VARCHAR(20),
      profileName VARCHAR(255),
      lastInteraction TIMESTAMP DEFAULT NOW(),
      waMSG JSONB DEFAULT '[]'::jsonb,
      PRIMARY KEY (waNumber, businessNumber)
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS tenants (
      business_number VARCHAR(20) PRIMARY KEY,
      api_key VARCHAR(255) NOT NULL,
      webhook_url VARCHAR(255),
      company_context TEXT
    )
  `;

  console.log('✅ Database tables initialized');
}

module.exports = {
  initDb,
  getDb,
  createTables
};
