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
        INSERT INTO users (waNumber, businessNumber, profileName, summary, waMSG)
        VALUES (${waNumber}, ${businessNumber}, ${profileName}, '', '[]'::jsonb)
        RETURNING *
    `;

  console.log(`✅ New user created: ${waNumber} -> ${businessNumber} (${profileName})`);
  return newUsers[0];
}

/**
 * Get conversation history for a user
 * @param {string} waNumber - WhatsApp number
 * @param {string} businessNumber - Business WhatsApp number
 * @returns {Object} Contains messages array and summary
 */
async function getConversationHistory(waNumber, businessNumber) {
  const sql = getDb();

  const users = await sql`
        SELECT waMSG, summary FROM users 
        WHERE waNumber = ${waNumber} AND businessNumber = ${businessNumber}
    `;

  if (users.length === 0) {
    return { messages: [], summary: '' };
  }

  return {
    messages: users[0].wamsg || [],
    summary: users[0].summary || ''
  };
}

/**
 * Update conversation history for a user
 * @param {string} waNumber - WhatsApp number
 * @param {string} businessNumber - Business WhatsApp number
 * @param {Array} messages - Updated messages array
 * @param {string} summary - Updated summary (optional)
 */
async function updateConversationHistory(waNumber, businessNumber, messages, summary = null) {
  const sql = getDb();

  if (summary !== null) {
    await sql`
            UPDATE users 
            SET waMSG = ${JSON.stringify(messages)}::jsonb, 
                summary = ${summary},
                lastInteraction = NOW()
            WHERE waNumber = ${waNumber} AND businessNumber = ${businessNumber}
        `;
  } else {
    await sql`
            UPDATE users 
            SET waMSG = ${JSON.stringify(messages)}::jsonb,
                lastInteraction = NOW()
            WHERE waNumber = ${waNumber} AND businessNumber = ${businessNumber}
        `;
  }
}

/**
 * Clear messages and update summary after summarization
 * @param {string} waNumber - WhatsApp number
 * @param {string} businessNumber - Business WhatsApp number
 * @param {string} newSummary - New summarized content
 */
async function clearHistoryWithSummary(waNumber, businessNumber, newSummary) {
  const sql = getDb();

  await sql`
        UPDATE users 
        SET waMSG = '[]'::jsonb, 
            summary = ${newSummary},
            lastInteraction = NOW()
        WHERE waNumber = ${waNumber} AND businessNumber = ${businessNumber}
    `;

  console.log(`✅ History cleared and summarized for: ${waNumber} -> ${businessNumber}`);
}

module.exports = {
  findOrCreateUser,
  getConversationHistory,
  updateConversationHistory,
  clearHistoryWithSummary
};
