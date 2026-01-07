const { getDb } = require('./db');

/**
 * Get tenant configuration by business number
 * @param {string} businessNumber - The business phone number
 * @returns {Object|null} Tenant config or null if not found
 */
async function getTenantConfig(businessNumber) {
    const sql = getDb();

    const tenants = await sql`
        SELECT * FROM tenants WHERE business_number = ${businessNumber}
    `;

    if (tenants.length === 0) {
        return null;
    }

    return tenants[0];
}

/**
 * Create or update a tenant
 * @param {Object} data - Tenant data
 * @returns {Object} Created tenant
 */
async function createTenant({ business_number, api_key, webhook_url, company_context }) {
    const sql = getDb();

    const result = await sql`
        INSERT INTO tenants (business_number, api_key, webhook_url, company_context)
        VALUES (${business_number}, ${api_key}, ${webhook_url}, ${company_context})
        ON CONFLICT (business_number) 
        DO UPDATE SET 
            api_key = EXCLUDED.api_key,
            webhook_url = EXCLUDED.webhook_url,
            company_context = EXCLUDED.company_context
        RETURNING *
    `;

    return result[0];
}

/**
 * Get all tenants
 * @returns {Array} List of all tenants
 */
async function getAllTenants() {
    const sql = getDb();
    const tenants = await sql`
        SELECT * FROM tenants ORDER BY business_number ASC
    `;
    return tenants;
}

/**
 * Delete a tenant
 * @param {string} businessNumber - The business phone number
 * @returns {boolean} True if deleted
 */
async function deleteTenant(businessNumber) {
    const sql = getDb();
    await sql`
        DELETE FROM tenants WHERE business_number = ${businessNumber}
    `;
    return true;
}

module.exports = {
    getTenantConfig,
    createTenant,
    getAllTenants,
    deleteTenant
};
