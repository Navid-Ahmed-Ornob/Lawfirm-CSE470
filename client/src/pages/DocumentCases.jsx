// /documents — pick a case to open its documents.
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { EmptyState, PageHeader, PageStatus, StatusBadge } from '../components/ui';

export default function DocumentCases() {
    const { user } = useAuth();
    const { data, error, loading } = useApi('/documents/cases');

    return (
        <main>
            <section className="dashboard">
                <PageHeader title="📂 Documents">
                    <p className="subtitle">Choose a case to view or upload its documents.</p>
                </PageHeader>
                <PageStatus error={error} loading={loading && !data} />

                {data && (
                    <div className="dashboard_section">
                        {data.cases.length === 0 ? (
                            <EmptyState icon="📁" title="No cases yet">
                                Documents can be shared once a lawyer has accepted a case.
                            </EmptyState>
                        ) : (
                            <div className="table_container">
                                <table className="data_table">
                                    <thead>
                                        <tr>
                                            <th>Case Title</th>
                                            <th>Category</th>
                                            <th>{user.role === 'client' ? 'Lawyer' : 'Client'}</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.cases.map((c) => (
                                            <tr key={c.case_id}>
                                                <td style={{ fontWeight: 500 }}>{c.title}</td>
                                                <td>{c.case_type}</td>
                                                <td>{c.other_name}</td>
                                                <td><StatusBadge status={c.status} /></td>
                                                <td>
                                                    <Link to={`/cases/${c.case_id}/documents`} className="btn_approve btn_save">📂 Open</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}
