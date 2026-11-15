// Controller: a lawyer's weekly availability (used when clients book appointments).
const Availability = require('../models/Availability');
const HttpError = require('../utils/HttpError');
const { currentLawyer } = require('../utils/profiles');
const { SLOTS, WORKING_DAYS } = require('../utils/constants');

// GET /api/schedule
async function getSchedule(req, res) {
    const lawyer = await currentLawyer(req);
    const rows = await Availability.findByLawyer(lawyer.lawyer_id);

    const schedule = {};
    for (const row of rows) {
        schedule[row.day_of_week] = SLOTS.filter((slot) => Number(row[slot.key]) === 1).map((slot) => slot.id);
    }
    res.json({ schedule, days: WORKING_DAYS, slots: SLOTS.map(({ id, label }) => ({ id, label })) });
}

// PUT /api/schedule   body: { schedule: { Saturday: [1, 2], Monday: [3] } }
async function saveSchedule(req, res) {
    const lawyer = await currentLawyer(req);
    const input = req.body.schedule || {};

    if (Array.isArray(input.Friday) && input.Friday.length > 0) {
        throw new HttpError(400, 'Fridays are holidays and cannot be scheduled.');
    }

    // Keep only valid days and valid slot numbers.
    const validSlotIds = SLOTS.map((slot) => slot.id);
    const schedule = {};
    for (const day of WORKING_DAYS) {
        const slotIds = Array.isArray(input[day]) ? input[day].map(Number).filter((id) => validSlotIds.includes(id)) : [];
        if (slotIds.length > 0) schedule[day] = [...new Set(slotIds)];
    }

    const dayCount = Object.keys(schedule).length;
    if (dayCount < 3) throw new HttpError(400, 'You must be available for at least 3 days a week.');
    if (dayCount > 6) throw new HttpError(400, 'You can be available for a maximum of 6 days a week.');

    await Availability.replaceSchedule(lawyer.lawyer_id, schedule);
    res.json({ message: 'Schedule updated successfully!' });
}

module.exports = { getSchedule, saveSchedule };
