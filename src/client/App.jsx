import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        business_number: '',
        api_key: '',
        webhook_url: '',
        company_context: ''
    });

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const response = await axios.get('/api/tenants');
            setTenants(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tenants:', error);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/tenants', formData);
            alert('Tenant saved successfully');
            setFormData({
                business_number: '',
                api_key: '',
                webhook_url: '',
                company_context: ''
            });
            fetchTenants();
        } catch (error) {
            console.error('Error saving tenant:', error);
            alert('Failed to save tenant');
        }
    };

    const handleDelete = async (businessNumber) => {
        if (window.confirm('Are you sure you want to delete this tenant?')) {
            try {
                await axios.delete(`/api/tenants/${businessNumber}`);
                fetchTenants();
            } catch (error) {
                console.error('Error deleting tenant:', error);
                alert('Failed to delete tenant');
            }
        }
    };

    return (
        <div className="container">
            <h1>WPChatAI Manager</h1>

            <div className="card">
                <h2>Add New Tenant</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Business Number (ID)</label>
                        <input
                            type="text"
                            name="business_number"
                            placeholder="e.g. 15551234567"
                            value={formData.business_number}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div>
                        <label>WhatsApp API Key</label>
                        <input
                            type="text"
                            name="api_key"
                            placeholder="Your API Key from AOC Portal"
                            value={formData.api_key}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div>
                        <label>Webhook URL (Optional)</label>
                        <input
                            type="text"
                            name="webhook_url"
                            placeholder="Override webhook URL"
                            value={formData.webhook_url}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label>System Prompt / Company Context</label>
                        <textarea
                            name="company_context"
                            rows="5"
                            placeholder="You are a helpful assistant for [Company Name]..."
                            value={formData.company_context}
                            onChange={handleInputChange}
                        />
                    </div>
                    <button type="submit">Save Tenant</button>
                </form>
            </div>

            <div className="card">
                <h2>Active Tenants</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Business Number</th>
                                <th>API Key</th>
                                <th>Webhook URL</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map((tenant) => (
                                <tr key={tenant.business_number}>
                                    <td>{tenant.business_number}</td>
                                    <td>{tenant.api_key.substring(0, 10)}...</td>
                                    <td>
                                        {tenant.webhook_url ||
                                            `${window.location.protocol}//${window.location.host}/webhook/${tenant.business_number}`}
                                    </td>
                                    <td>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(tenant.business_number)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {tenants.length === 0 && (
                                <tr>
                                    <td colSpan="4">No tenants found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default App;
