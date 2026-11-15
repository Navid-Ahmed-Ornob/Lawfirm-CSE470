// Small reusable view pieces.
import { statusClass } from '../utils/format';

export function StatusBadge({ status }) {
    return <span className={statusClass(status)}>{status}</span>;
}

export function EmptyState({ icon, title, children, className = '' }) {
    return (
        <div className={`empty_state ${className}`}>
            <div className="empty_state_icon">{icon}</div>
            <h3>{title}</h3>
            {children && <p>{children}</p>}
        </div>
    );
}

/** Shows a loading line or an error box while a page's data is not ready. */
export function PageStatus({ loading, error }) {
    if (error) return <div className="alert alert-error">{error}</div>;
    if (loading) return <p className="loading">Loading…</p>;
    return null;
}

/** Section title + optional subtitle at the top of a dashboard page. */
export function PageHeader({ title, children }) {
    return (
        <div className="dashboard_welcome">
            <h1>{title}</h1>
            {children}
        </div>
    );
}
