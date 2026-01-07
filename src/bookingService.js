// bookingService.js
const { neon } = require('@neondatabase/serverless');

// Use the provided connection string or fallback to env
const connectionString = process.env.BOOKING_DB_URL;

const sql = neon(connectionString);

/**
 * Get list of clinics, optionally filtered by city or name
 */
async function getClinics(query) {
    console.log(`Searching clinics with query: ${query || 'all'}`);
    try {
        let result;
        if (query) {
            result = await sql`
                SELECT id, name, city, location, phone 
                FROM clinics 
                WHERE name ILIKE ${'%' + query + '%'} OR city ILIKE ${'%' + query + '%'}
                LIMIT 5
            `;
        } else {
            result = await sql`SELECT id, name, city, location, phone FROM clinics LIMIT 5`;
        }
        return result;
    } catch (e) {
        console.error("Error fetching clinics:", e);
        return [];
    }
}

/**
 * Get list of doctors, optionally filter by clinic or specialization
 */
async function getDoctors(clinicId, specialization) {
    console.log(`Fetching doctors for Clinic: ${clinicId}, Spec: ${specialization}`);
    try {
        let doctors;

        // We need to join 'users' for the Name.
        // Assuming table 'doctors' has 'user_id' which maps to 'users.id'. 
        // We also join 'specializations' and 'clinics' for metadata.

        if (clinicId && specialization) {
            doctors = await sql`
                SELECT d.id, u.name, d.experience_years, s.name as specialization, c.name as clinic_name
                FROM doctors d
                JOIN users u ON d.user_id = u.id
                LEFT JOIN specializations s ON d.specialization_id = s.id
                LEFT JOIN clinics c ON d.clinic_id = c.id
                WHERE d.clinic_id = ${clinicId} AND s.name ILIKE ${'%' + specialization + '%'}
            `;
        } else if (clinicId) {
            doctors = await sql`
                SELECT d.id, u.name, d.experience_years, s.name as specialization, c.name as clinic_name
                FROM doctors d
                JOIN users u ON d.user_id = u.id
                LEFT JOIN specializations s ON d.specialization_id = s.id
                LEFT JOIN clinics c ON d.clinic_id = c.id
                WHERE d.clinic_id = ${clinicId}
            `;
        } else if (specialization) {
            doctors = await sql`
                SELECT d.id, u.name, d.experience_years, s.name as specialization, c.name as clinic_name
                FROM doctors d
                JOIN users u ON d.user_id = u.id
                LEFT JOIN specializations s ON d.specialization_id = s.id
                LEFT JOIN clinics c ON d.clinic_id = c.id
                WHERE s.name ILIKE ${'%' + specialization + '%'}
            `;
        } else {
            doctors = await sql`
                SELECT d.id, u.name, d.experience_years, s.name as specialization, c.name as clinic_name
                FROM doctors d
                JOIN users u ON d.user_id = u.id
                LEFT JOIN specializations s ON d.specialization_id = s.id
                LEFT JOIN clinics c ON d.clinic_id = c.id
                LIMIT 10
            `;
        }
        return doctors;
    } catch (e) {
        console.error("Error fetching doctors:", e);
        return [];
    }
}

/**
 * Check availability for a specific doctor on a date
 */
async function checkAvailability(doctorId, date) {
    console.log(`Checking availability for Dr ${doctorId} on ${date}`);

    try {
        // 1. Get Day of Week (0=Sun, 6=Sat)
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();

        // 2. Get Doctor's Schedule
        const schedule = await sql`
            SELECT start_time, end_time, slot_duration_minutes 
            FROM doctor_schedules 
            WHERE doctor_id = ${doctorId} AND day_of_week = ${dayOfWeek}
        `;

        if (schedule.length === 0) {
            return { message: "Doctor is not working on this day." };
        }

        const { start_time, end_time, slot_duration_minutes } = schedule[0];

        // 3. Generate All Possible Slots
        const slots = generateSlots(start_time, end_time, slot_duration_minutes || 30);

        // 4. Get Existing Appointments
        const [year, month, day] = date.split('-');
        const formattedDate = `${day}/${month}/${year}`;

        const appointments = await sql`
            SELECT time FROM appointments 
            WHERE doctor_id = ${doctorId}::text AND date = ${formattedDate}
        `;
        const bookedTimes = appointments.map(a => a.time);

        // 5. Filter Available Slots
        const available = slots.filter(s => !bookedTimes.includes(s));

        return {
            date: date,
            doctor_id: doctorId,
            available_slots: available.length > 0 ? available : 'None',
            message: available.length > 0 ? 'Slots available' : 'Fully booked'
        };

    } catch (error) {
        console.error('Error checking availability:', error);
        return { error: "Failed to check availability" };
    }
}

// Helper: Generate time slots
function generateSlots(startStr, endStr, duration) {
    const slots = [];
    if (!startStr || !endStr) return slots;

    let current = parseTime(startStr); // Returns minutes
    const end = parseTime(endStr);

    while (current + duration <= end) {
        slots.push(formatTime(current));
        current += duration;
    }
    return slots;
}

function parseTime(t) {
    const [timePart, modifier] = t.split(' ');
    let [h, m] = timePart.split(':').map(Number);

    if (modifier === 'PM' && h < 12) h += 12;
    if (modifier === 'AM' && h === 12) h = 0;

    return h * 60 + m;
}

function formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Create a new booking
 */
async function createBooking(bookingDetails) {
    console.log(`Creating booking:`, bookingDetails);

    const { name, phone, date, time, doctor_id, clinic_id, reason } = bookingDetails;

    try {
        const [year, month, day] = date.split('-');
        const formattedDate = `${day}/${month}/${year}`;

        const timestamp = Date.now();
        const id = `apt-${Math.random().toString(36).substr(2, 9)}`;

        // Insert booking into appointments table 
        await sql`
            INSERT INTO appointments (
                id, clinic_id, doctor_id, patient_name, patient_phone, 
                date, time, status, reason, created_at, source
            )
            VALUES (
                ${id}, ${clinic_id?.toString() || '1'}, ${doctor_id?.toString()}, 
                ${name}, ${phone}, ${formattedDate}, ${time}, 
                'PENDING', ${reason || 'WhatsApp Booking'}, ${timestamp}, 'WHATSAPP'
            )
        `;

        return {
            success: true,
            booking_id: id,
            status: 'confirmed',
            details: bookingDetails
        };
    } catch (error) {
        console.error('Error creating booking:', error);
        return { success: false, message: "Database error" };
    }
}

/**
 * Get high-level context for the AI (Cities, Clinics, Top Specs)
 * This allows the bot to "know" what's available without searching.
 */
async function getMedicalContext() {
    try {
        // 1. Get distinct cities (to know coverage)
        const cities = await sql`SELECT DISTINCT city FROM clinics LIMIT 5`;
        const cityList = cities.map(c => c.city).join(', ');

        // 2. Get Clinic Names (if few)
        const clinics = await sql`SELECT name FROM clinics LIMIT 5`;
        const clinicList = clinics.map(c => c.name).join(', ');

        // 3. Get Specializations
        const specs = await sql`SELECT name FROM specializations LIMIT 10`;
        const specList = specs.map(s => s.name).join(', ');

        return `
        [REAL-TIME KNOWLEDGE]
        - Available Cities: ${cityList || 'None'}
        - Key Clinics: ${clinicList || 'None'}
        - Specializations: ${specList || 'General'}
        `;
    } catch (e) {
        console.error("Error fetching medical context:", e);
        return "";
    }
}

module.exports = {
    getClinics,
    getDoctors,
    checkAvailability,
    createBooking,
    getMedicalContext
};
