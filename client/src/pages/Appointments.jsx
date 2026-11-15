// /appointments — book a slot and see/manage appointments (client and lawyer).
import { useEffect, useState } from 'react';
import api, { queryString } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useApi from '../hooks/useApi';
import { PageHeader, PageStatus, StatusBadge } from '../components/ui';
import { clockTime, shortDate, todayISO } from '../utils/format';

const EMPTY_FORM = { case_id: '', appointment_date: '', session_slot: '', notes: '' };

/** Loads free/booked slots for a date. `params` is { case_id } or { appointment_id }. */
function useSlots(params, date) {
    const [slots, setSlots] = useState({ state: 'idle', list: [], message: '' });
    const key = JSON.stringify(params);

    useEffect(() => {
        const query = JSON.parse(key);
        const ready = Object.values(query).every(Boolean) && date;
        if (!ready) {
            setSlots({ state: 'idle', list: [], message: '' });
            return undefined;
        }
        let cancelled = false;
        setSlots({ state: 'loading', list: [], message: '' });
        api.get(`/appointments/slots${queryString({ ...query, date })}`)
            .then((data) => !cancelled && setSlots({ state: 'ready', list: data.slots, message: '' }))
            .catch((err) => !cancelled && setSlots({ state: 'error', list: [], message: err.message }));
        return () => {
            cancelled = true;
        };
    }, [key, date]);

    return slots;
}

function SlotSelect({ id, slots, value, onChange, firstLabel }) {
    let placeholder = firstLabel;
    if (slots.state === 'loading') placeholder = 'Loading slots...';
    if (slots.state === 'error') placeholder = `Error: ${slots.message}`;
    if (slots.state === 'ready') placeholder = slots.list.length ? '— Choose a Slot —' : 'No slots available this day';

    return (
        <select id={id} name="session_slot" value={value} onChange={onChange}
            disabled={slots.state !== 'ready' || slots.list.length === 0} required>
            <option value="">{placeholder}</option>
            {slots.list.map((slot) => (
                <option key={slot.id} value={slot.id} disabled={slot.is_booked}>
                    {slot.is_booked ? `🔒 Booked (${slot.label})` : slot.label}
                </option>
            ))}
        </select>
    );
}

function BookingForm({ cases, role, onBooked }) {
    const toast = useToast();
    const [form, setForm] = useState(EMPTY_FORM);
    const [busy, setBusy] = useState(false);
    const slots = useSlots({ case_id: form.case_id }, form.appointment_date);

    const change = (e) => {
        const { name, value } = e.target;
        // Changing the case or date clears the chosen slot.
        setForm((f) => ({ ...f, [name]: value, ...(name === 'case_id' || name === 'appointment_date' ? { session_slot: '' } : {}) }));
    };

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const result = await api.post('/appointments', form);
            toast.success(result.message);
            setForm(EMPTY_FORM);
            onBooked();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="dashboard_section">
            <h2>Book New Appointment</h2>
            <div className="table_container panel_padded">
                <form className="login_form" onSubmit={submit}>
                    <div className="form_group">
                        <label htmlFor="case_id">Select Case</label>
                        <select id="case_id" name="case_id" value={form.case_id} onChange={change} required>
                            <option value="">— Choose a case —</option>
                            {cases.map((c) => (
                                <option key={c.case_id} value={c.case_id}>
                                    {c.title} ({role === 'client' ? 'Lawyer' : 'Client'}: {c.other_name})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex_wrap">
                        <div className="form_group">
                            <label htmlFor="appointment_date">Date</label>
                            <input id="appointment_date" name="appointment_date" type="date" min={todayISO()}
                                value={form.appointment_date} onChange={change} required />
                        </div>
                        <div className="form_group">
                            <label htmlFor="session_slot">Available Slots</label>
                            <SlotSelect id="session_slot" slots={slots} value={form.session_slot} onChange={change}
                                firstLabel="— Select Case and Date First —" />
                        </div>
                    </div>
                    <div className="form_group">
                        <label htmlFor="notes">Notes (optional)</label>
                        <textarea id="notes" name="notes" placeholder="Any details about the appointment..."
                            value={form.notes} onChange={change} />
                    </div>
                    <input type="submit" value={busy ? 'Booking…' : 'Book Appointment'} disabled={busy} />
                </form>
            </div>
        </div>
    );
}

/** Lawyer: inline form under an appointment row to move it to a new date and slot. */
function RescheduleRow({ appointment, onDone, onClose }) {
    const toast = useToast();
    const [date, setDate] = useState('');
    const [slot, setSlot] = useState('');
    const [busy, setBusy] = useState(false);
    const slots = useSlots({ appointment_id: appointment.appointment_id }, date);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const result = await api.patch(`/appointments/${appointment.appointment_id}/reschedule`, {
                appointment_date: date,
                session_slot: slot,
            });
            toast.success(result.message);
            onDone();
        } catch (err) {
            toast.error(err.message);
            setBusy(false);
        }
    };

    return (
        <tr>
            <td colSpan="6">
                <form className="reschedule_form" onSubmit={submit}>
                    <div className="form_group">
                        <label htmlFor={`rs_date_${appointment.appointment_id}`}>New Date</label>
                        <input id={`rs_date_${appointment.appointment_id}`} type="date" min={todayISO()} value={date}
                            onChange={(e) => { setDate(e.target.value); setSlot(''); }} required />
                    </div>
                    <div className="form_group">
                        <label htmlFor={`rs_slot_${appointment.appointment_id}`}>New Slot</label>
                        <SlotSelect id={`rs_slot_${appointment.appointment_id}`} slots={slots} value={slot}
                            onChange={(e) => setSlot(e.target.value)} firstLabel="— Select a Date First —" />
                    </div>
                    <div className="reschedule_actions">
                        <button type="submit" className="btn_approve" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
                        <button type="button" className="btn_reject" onClick={onClose}>Close</button>
                    </div>
                </form>
            </td>
        </tr>
    );
}

export default function Appointments() {
    const { user } = useAuth();
    const toast = useToast();
    const { data, error, loading, reload } = useApi('/appointments');
    const [rescheduling, setRescheduling] = useState(null);
    const isLawyer = user.role === 'lawyer';

    const update = async (appointment, action, question) => {
        if (!window.confirm(question)) return;
        try {
            const result = await api.patch(`/appointments/${appointment.appointment_id}`, { action });
            action === 'reject' ? toast.error(result.message) : toast.success(result.message);
            reload();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const toggleReschedule = (id) => setRescheduling((current) => (current === id ? null : id));

    return (
        <main>
            <section className="dashboard">
                <PageHeader title="📅 Appointments" />
                <PageStatus error={error} loading={loading && !data} />

                {data && data.bookableCases.length > 0 && (
                    <BookingForm cases={data.bookableCases} role={user.role} onBooked={reload} />
                )}

                {data && (
                    <div className="dashboard_section">
                        <h2>{isLawyer ? 'Appointment Requests & Schedule' : 'My Appointments'}</h2>
                        <div className="table_container">
                            <table className="data_table">
                                <thead>
                                    <tr>
                                        <th>Case</th>
                                        <th>{isLawyer ? 'Client' : 'Lawyer'}</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Status</th>
                                        {isLawyer && <th>Action</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.appointments.length === 0 ? (
                                        <tr><td colSpan={isLawyer ? 6 : 5} className="text-center">No appointments yet.</td></tr>
                                    ) : (
                                        data.appointments.map((a) => {
                                            const open = ['Pending', 'Confirmed'].includes(a.status);
                                            return [
                                                <tr key={a.appointment_id}>
                                                    <td>{a.case_title}</td>
                                                    <td>{a.other_name}</td>
                                                    <td>{shortDate(a.appointment_date)}</td>
                                                    <td>{clockTime(a.appointment_time)}</td>
                                                    <td><StatusBadge status={a.status} /></td>
                                                    {isLawyer && (
                                                        <td className="action_cell">
                                                            {a.status === 'Pending' && (
                                                                <>
                                                                    <button type="button" className="btn_approve"
                                                                        onClick={() => update(a, 'accept', 'Accept this appointment?')}>Accept</button>
                                                                    <button type="button" className="btn_reject"
                                                                        onClick={() => update(a, 'reject', 'Reject this appointment?')}>Reject</button>
                                                                </>
                                                            )}
                                                            {a.status === 'Confirmed' && (
                                                                <button type="button" className="btn_approve"
                                                                    onClick={() => update(a, 'complete', 'Mark as completed?')}>Complete</button>
                                                            )}
                                                            {open && (
                                                                <button type="button" className="btn_approve btn_receipt"
                                                                    onClick={() => toggleReschedule(a.appointment_id)}>Reschedule</button>
                                                            )}
                                                            {!open && <span className="dim">—</span>}
                                                        </td>
                                                    )}
                                                </tr>,
                                                isLawyer && rescheduling === a.appointment_id && (
                                                    <RescheduleRow key={`rs_${a.appointment_id}`} appointment={a}
                                                        onClose={() => setRescheduling(null)}
                                                        onDone={() => { setRescheduling(null); reload(); }} />
                                                ),
                                            ];
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
