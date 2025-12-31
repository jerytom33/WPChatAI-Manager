const { getDb } = require('./db');

/**
 * Find an existing user or create a new one
 * @param {string} waNumber - WhatsApp number (user)
 * @param {string} businessNumber - Business WhatsApp number
 * @param {string} profileName - User's display name
 * @returns {Object} User record
 */
async function findOrCreateUser(waNumber, businessNumber, profileName) {
  const sql = getDb();

  // Try to find existing user with composite key
  const existingUsers = await sql`
        SELECT * FROM users 
        WHERE waNumber = ${waNumber} AND businessNumber = ${businessNumber}
    `;

  if (existingUsers.length > 0) {
    // Update last interaction time and profile name
    await sql`
            UPDATE users 
            SET lastInteraction = NOW(), profileName = ${profileName}
            WHERE waNumber = ${waNumber} AND businessNumber = ${businessNumber}
        `;
    return existingUsers[0];
  }

  // Create new user
  const newUsers = await sql`
        INSERT INTO users (waNumber, businessNumber, profileName, waMSG)
        VALUES (${waNumber}, ${businessNumber}, ${profileName}, '[]'::jsonb)
        RETURNING *
    `;

  console.log(`✅ New user created: ${waNumber} -> ${businessNumber} (${profileName})`);
  return newUsers[0];
}

/**
 * Get conversation history for a user
 * @param {string} waNumber - WhatsApp number
 * @param {string} businessNumber - Business WhatsApp number
 * @returns {Object} Contains messages array
 */
async function getConversationHistory(waNumber, businessNumber) {
  const sql = getDb();

  const users = await sql`
        SELECT waMSG FROM users 
        WHERE waNumber = ${waNumber} AND businessNumber = ${businessNumber}
    `;

  if (users.length === 0) {
    return { messages: [] };
  }

  return {
    messages: users[0].wamsg || []
  };
}

/**
 * Update conversation history for a user
 * @param {string} waNumber - WhatsApp number
 * @param {string} businessNumber - Business WhatsApp number
 * @param {Array} messages - Updated messages array
 * @param {Array} messages - Updated messages array
 */
async function updateConversationHistory(waNumber, businessNumber, messages) {
  const sql = getDb();


  await sql`
            UPDATE users 
            SET waMSG = ${JSON.stringify(messages)}::jsonb,
                lastInteraction = NOW()
            WHERE waNumber = ${waNumber} AND businessNumber = ${businessNumber}
        `;
  await sql`
            UPDATE users 
            SET waMSG = ${JSON.stringify(messages)}::jsonb,
                lastInteraction = NOW()
            WHERE waNumber = ${waNumber} AND businessNumber = ${businessNumber}
        `;
}



module.exports = {
  findOrCreateUser,
  getConversationHistory,
  updateConversationHistory,

};
