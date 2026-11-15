// Controller: appointment booking, available slots, and accept / reject / reschedule / complete.
const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');
const Case = require('../models/Case');
const HttpError = require('../utils/HttpError');
const { currentClient, currentLawyer, toId } = require('../utils/profiles');
const { SLOTS, BOOKABLE_CASE_STATUSES } = require('../utils/constants');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "2026-11-14" -> "Saturday" (null if the date is invalid). */
function dayOfWeek(dateStr) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
    if (!match) return null;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    if (Number.isNaN(date.getTime())) return null;
    return DAY_NAMES[date.getUTCDay()];
}

/** Today's date as YYYY-MM-DD in Dhaka time. */
function today() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
}

/** The case, if the logged-in user is on it and it is open for booking. */
async function bookableCase(req, caseId) {
    const found = await Case.findForUser(caseId, req.session.user);
    if (!found || !BOOKABLE_CASE_STATUSES.includes(found.status)) {
        throw new HttpError(400, 'Appointments can only be booked for accepted or in-progress cases.');
    }
    // Only verified lawyers may offer services on the platform.
    if (!Number(found.lawyer_verified)) {
        throw new HttpError(400, 'This lawyer has not been verified by an admin yet.');
    }
    return found;
}

/**
 * Check that `slotId` on `date` is a slot the lawyer works and that nobody else has it.
 * `ignoreAppointmentId` lets an appointment being rescheduled ignore its own booking.
 */
async function checkSlotFree(lawyerId, date, slotId, ignoreAppointmentId = 0) {
    const day = dayOfWeek(date);
    const slot = SLOTS.find((s) => s.id === Number(slotId));
    if (!day || !slot) throw new HttpError(400, 'Choose a date and a time slot.');
    if (date < today()) throw new HttpError(400, 'You cannot book an appointment in the past.');

    const availability = await Availability.findDay(lawyerId, day);
    if (!availability || Number(availability[slot.key]) !== 1) {
        throw new HttpError(400, 'The lawyer is not available in that slot.');
    }
    const booked = await Appointment.bookedSlots(lawyerId, date, ignoreAppointmentId);
    if (booked.includes(slot.id)) {
        throw new HttpError(409, 'That slot is already booked. Please pick another one.');
    }
    return slot;
}

// GET /api/appointments
async function list(req, res) {
    const user = req.session.user;

    if (user.role === 'client') {
        const client = await currentClient(req);
        const [cases, appointments] = await Promise.all([
            Case.findByStatusForClient(client.client_id, BOOKABLE_CASE_STATUSES),
            Appointment.findForClient(client.client_id),
        ]);
        return res.json({
            bookableCases: cases.map((c) => ({ case_id: c.case_id, title: c.title, other_name: c.other_name })),
            appointments,
        });
    }

    const lawyer = await currentLawyer(req);
    const [cases, appointments] = await Promise.all([
        Case.findByStatusForLawyer(lawyer.lawyer_id, BOOKABLE_CASE_STATUSES),
        Appointment.findForLawyer(lawyer.lawyer_id),
    ]);
    res.json({
        bookableCases: cases.map((c) => ({ case_id: c.case_id, title: c.title, other_name: c.other_name })),
        appointments,
    });
}

// GET /api/appointments/slots?case_id=&date=   or   ?appointment_id=&date= (when rescheduling)
async function slots(req, res) {
    const date = req.query.date;
    const day = dayOfWeek(date);
    if (!day) throw new HttpError(400, 'Choose a valid date.');

    let lawyerId;
    let ignoreId = 0;
    if (req.query.appointment_id) {
        // Lawyer rescheduling one of their own appointments
        const lawyer = await currentLawyer(req);
        const appointment = await Appointment.findById(toId(req.query.appointment_id));
        if (!appointment || appointment.lawyer_id !== lawyer.lawyer_id) throw new HttpError(404, 'Appointment not found.');
        lawyerId = lawyer.lawyer_id;
        ignoreId = appointment.appointment_id;
    } else {
        const caseId = toId(req.query.case_id);
        if (!caseId) throw new HttpError(400, 'Choose a case.');
        lawyerId = (await bookableCase(req, caseId)).lawyer_id;
    }

    const availability = await Availability.findDay(lawyerId, day);
    if (!availability) return res.json({ day, slots: [] });

    const booked = await Appointment.bookedSlots(lawyerId, date, ignoreId);
    res.json({
        day,
        slots: SLOTS.filter((slot) => Number(availability[slot.key]) === 1).map((slot) => ({
            id: slot.id,
            time: slot.time,
            label: slot.label,
            is_booked: booked.includes(slot.id),
        })),
    });
}

// POST /api/appointments   body: { case_id, appointment_date, session_slot, notes }
async function create(req, res) {
    const user = req.session.user;
    const caseId = toId(req.body.case_id);
    if (!caseId) throw new HttpError(400, 'Choose a case, a date and a time slot.');

    const found = await bookableCase(req, caseId);
    const date = req.body.appointment_date;
    const slot = await checkSlotFree(found.lawyer_id, date, req.body.session_slot);

    await Appointment.create({
        case_id: caseId,
        client_id: found.client_id,
        lawyer_id: found.lawyer_id,
        appointment_date: date,
        appointment_time: slot.time,
        session_slot: slot.id,
        notes: (req.body.notes || '').trim(),
        // An appointment the lawyer creates is confirmed straight away.
        status: user.role === 'lawyer' ? 'Confirmed' : 'Pending',
    });

    res.status(201).json({ message: 'Appointment booked successfully!' });
}

// PATCH /api/appointments/:appointmentId   body: { action: "accept" | "reject" | "complete" }
async function updateStatus(req, res) {
    // Which status each action leads to, and which statuses it is allowed from.
    const actions = {
        accept: { to: 'Confirmed', from: ['Pending'], message: 'Appointment accepted.' },
        reject: { to: 'Rejected', from: ['Pending'], message: 'Appointment rejected.' },
        complete: { to: 'Completed', from: ['Confirmed'], message: 'Appointment marked as completed.' },
    };
    const appointmentId = toId(req.params.appointmentId);
    const action = actions[req.body.action];
    if (!appointmentId || !action) throw new HttpError(400, 'Invalid action.');

    const lawyer = await currentLawyer(req);
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.lawyer_id !== lawyer.lawyer_id) throw new HttpError(404, 'Appointment not found.');
    if (!action.from.includes(appointment.status)) {
        throw new HttpError(400, `A ${appointment.status.toLowerCase()} appointment cannot be changed this way.`);
    }

    await Appointment.updateStatusForLawyer(appointmentId, lawyer.lawyer_id, action.to);
    res.json({ message: action.message });
}

// PATCH /api/appointments/:appointmentId/reschedule   body: { appointment_date, session_slot }
async function reschedule(req, res) {
    const appointmentId = toId(req.params.appointmentId);
    const lawyer = await currentLawyer(req);
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.lawyer_id !== lawyer.lawyer_id) throw new HttpError(404, 'Appointment not found.');
    if (!['Pending', 'Confirmed'].includes(appointment.status)) {
        throw new HttpError(400, 'Only pending or confirmed appointments can be rescheduled.');
    }

    const date = req.body.appointment_date;
    const slot = await checkSlotFree(lawyer.lawyer_id, date, req.body.session_slot, appointmentId);

    await Appointment.reschedule(appointmentId, lawyer.lawyer_id, {
        appointment_date: date,
        appointment_time: slot.time,
        session_slot: slot.id,
    });
    res.json({ message: 'Appointment rescheduled.' });
}

module.exports = { list, slots, create, updateStatus, reschedule };
