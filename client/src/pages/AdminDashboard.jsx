// Admin panel: platform charts, lawyer verification and verification history.
import api from '../api/client';
import useApi from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import { DonutChart } from '../components/Charts';
import { PageHeader, PageStatus, StatusBadge } from '../components/ui';
import { dateTime } from '../utils/format';

const VERIFICATION_COLORS = { Verified: '#22c55e', Pending: '#d4a843', Rejected: '#ef4444' };

export default function AdminDashboard() {
    const { data, error, loading, reload } = useApi('/dashboard/admin');
    const toast = useToast();

    const verify = async (lawyer, action) => {
        const verb = action === 'approve' ? 'Approve' : 'Reject';
        if (!window.confirm(`${verb} ${lawyer.full_name}?`)) return;
        try {
            const result = await api.patch(`/admin/lawyers/${lawyer.lawyer_id}/verification`, { action });
            action === 'approve' ? toast.success(result.message) : toast.error(result.message);
            reload();
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <main>
            <section className="dashboard">
                <PageHeader title="Admin Panel">
                    <p className="role_badge admin_badge">Administrator</p>
                </PageHeader>
                <PageStatus error={error} loading={loading && !data} />

                {data && (
                    <>
                        <div className="chart_row">
                            <div className="chart_card_box">
                                <h3>Platform Cases</h3>
                                <DonutChart chart={data.caseChart} empty="No cases yet." />
                            </div>
                            <div className="chart_card_box">
                                <h3>Lawyer Verification</h3>
                                <DonutChart chart={data.verificationChart} empty="No lawyers yet." colors={VERIFICATION_COLORS} />
                            </div>
                        </div>

                        <div className="admin_section">
                            <h2>Pending Lawyer Verifications</h2>
                            <div className="table_container">
                                <table className="data_table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Specialization</th>
                                            <th>Location</th>
                                            <th>Experience</th>
                                            <th>Document</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.pendingLawyers.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center">No pending verifications. All caught up!</td></tr>
                                        ) : (
                                            data.pendingLawyers.map((l) => (
                                                <tr key={l.lawyer_id}>
                                                    <td>{l.full_name}</td>
                                                    <td>{l.specialization}</td>
                                                    <td>{l.location}</td>
                                                    <td>{l.experience_years} yrs</td>
                                                    <td>
                                                        {l.has_document ? (
                                                            <a href={`/api/admin/lawyers/${l.lawyer_id}/document`} target="_blank" rel="noreferrer"
                                                                style={{ color: '#fbbf24', textDecoration: 'underline' }}>View Doc</a>
                                                        ) : (
                                                            <span className="muted">None</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn_approve btn_small" style={{ marginRight: 5 }}
                                                            onClick={() => verify(l, 'approve')}>Approve</button>
                                                        <button type="button" className="btn_reject btn_small"
                                                            onClick={() => verify(l, 'reject')}>Reject</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="admin_section mt_40">
                            <h2>Verification History</h2>
                            <div className="table_container">
                                <table className="data_table">
                                    <thead>
                                        <tr>
                                            <th>Lawyer</th>
                                            <th>Specialization</th>
                                            <th>Decision</th>
                                            <th>Approved / Rejected By</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.verificationHistory.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center">No verification decisions yet.</td></tr>
                                        ) : (
                                            data.verificationHistory.map((l) => (
                                                <tr key={l.lawyer_id}>
                                                    <td>{l.full_name}</td>
                                                    <td>{l.specialization}</td>
                                                    <td><StatusBadge status={l.verification_status} /></td>
                                                    <td>{l.verified_by_name || '—'}</td>
                                                    <td>{l.verified_at ? dateTime(l.verified_at) : '—'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}
