// Values shared by several controllers.

// The 7 appointment sessions of a working day.
const SLOTS = [
    { id: 1, key: 'slot_1', time: '08:00:00', label: '8:00 AM - 9:20 AM' },
    { id: 2, key: 'slot_2', time: '09:30:00', label: '9:30 AM - 10:50 AM' },
    { id: 3, key: 'slot_3', time: '11:00:00', label: '11:00 AM - 12:20 PM' },
    { id: 4, key: 'slot_4', time: '12:30:00', label: '12:30 PM - 1:50 PM' },
    { id: 5, key: 'slot_5', time: '14:00:00', label: '2:00 PM - 3:20 PM' },
    { id: 6, key: 'slot_6', time: '15:30:00', label: '3:30 PM - 4:50 PM' },
    { id: 7, key: 'slot_7', time: '17:00:00', label: '5:00 PM - 6:20 PM' },
];

// Days a lawyer can work. Friday is a holiday.
const WORKING_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

// Statuses in which appointments can be booked.
const BOOKABLE_CASE_STATUSES = ['Accepted', 'In Progress'];

// Statuses in which a case has a lawyer working on it, so documents can be shared.
const DOCUMENT_CASE_STATUSES = [
    'Accepted', 'In Progress', 'Waiting for Documents', 'Scheduled for Hearing', 'Closed', 'Won', 'Lost',
];

// Kinds of case documents.
const DOCUMENT_TYPES = ['Contract', 'Evidence', 'Court Notice', 'Legal Form', 'Other'];

module.exports = {
    DOCUMENT_TYPES,
    SLOTS,
    WORKING_DAYS,
    BOOKABLE_CASE_STATUSES,
    DOCUMENT_CASE_STATUSES,
};
