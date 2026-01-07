const express = require('express');
const router = express.Router();
const { getAllTenants, createTenant, deleteTenant } = require('./tenantService');

// GET /api/tenants - List all tenants
router.get('/tenants', async (req, res) => {
    try {
        const tenants = await getAllTenants();
        res.json(tenants);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({ error: 'Failed to fetch tenants' });
    }
});

// POST /api/tenants - Create or update a tenant
router.post('/tenants', async (req, res) => {
    try {
        const { business_number, api_key, webhook_url, company_context } = req.body;

        if (!business_number || !api_key) {
            return res.status(400).json({ error: 'Business number and API key are required' });
        }

        const tenant = await createTenant({
            business_number,
            api_key,
            webhook_url,
            company_context
        });

        res.status(201).json(tenant);
    } catch (error) {
        console.error('Error creating tenant:', error);
        res.status(500).json({ error: 'Failed to create tenant' });
    }
});

// DELETE /api/tenants/:id - Delete a tenant
router.delete('/tenants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteTenant(id);
        res.status(200).json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        console.error('Error deleting tenant:', error);
        res.status(500).json({ error: 'Failed to delete tenant' });
    }
});

module.exports = router;
