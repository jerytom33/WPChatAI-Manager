// bookingService.js
const { neon } = require('@neondatabase/serverless');

// Use the provided connection string or fallback to env
const connectionString = process.env.BOOKING_DB_URL;

const sql = neon(connectionString);

/**
 * Initialize the booking table if it doesn't exist
 */
async function initBookingDb() {
    try {
        console.log('Initializing Booking DB...');
        await sql`
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                date DATE NOT NULL,
                time TEXT NOT NULL,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ Booking table ready');
    } catch (error) {
        console.error('❌ Failed to init booking DB:', error);
    }
}

// Auto-init on load
initBookingDb();

/**
 * Check availability for a specific date
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Object>} Available slots
 */
async function checkAvailability(date) {
    console.log(`Checking availability for: ${date}`);

    // Define standard slots
    const allSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

    try {
        // Find booked slots for the date
        // Note: casting date to standard format might be needed if input is loose
        const bookedRecords = await sql`
            SELECT time FROM bookings WHERE date = ${date}::date
        `;

        const bookedTimes = bookedRecords.map(r => r.time);

        // Filter out booked slots
        const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

        return {
            date: date,
            available_slots: availableSlots.length > 0 ? availableSlots : 'None',
            message: availableSlots.length > 0 ? 'Slots available' : 'Fully booked'
        };
    } catch (error) {
        console.error('Error checking availability:', error);
        return { error: "Failed to check availability" };
    }
}

/**
 * Create a new booking
 * @param {Object} bookingDetails
 */
async function createBooking(bookingDetails) {
    console.log(`Creating booking:`, bookingDetails);
    const { name, phone, date, time, reason } = bookingDetails;

    try {
        // Check if slot is taken (double check)
        const existing = await sql`
            SELECT id FROM bookings WHERE date = ${date}::date AND time = ${time}
        `;

        if (existing.length > 0) {
            return { success: false, message: 'Slot already booked' };
        }

        // Insert booking
        const result = await sql`
            INSERT INTO bookings (name, phone, date, time, reason)
            VALUES (${name}, ${phone}, ${date}::date, ${time}, ${reason || ''})
            RETURNING id
        `;

        return {
            success: true,
            booking_id: result[0].id,
            status: 'confirmed',
            details: bookingDetails
        };
    } catch (error) {
        console.error('Error creating booking:', error);
        return { success: false, message: "Database error" };
    }
}

module.exports = {
    checkAvailability,
    createBooking
};
