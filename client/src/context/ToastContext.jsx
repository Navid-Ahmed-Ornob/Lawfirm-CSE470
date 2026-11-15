// Global toast popups (bottom-right), e.g. toast.success('Appointment booked!').
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const timers = useRef([]);

    const show = useCallback((type, text) => {
        timers.current.forEach(clearTimeout);
        setToast({ type, text, leaving: false, id: Date.now() });
        timers.current = [
            setTimeout(() => setToast((t) => (t ? { ...t, leaving: true } : t)), 3500),
            setTimeout(() => setToast(null), 3900),
        ];
    }, []);

    const api = useMemo(
        () => ({
            success: (text) => show('success', text),
            error: (text) => show('error', text),
        }),
        [show]
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            {toast && (
                <div key={toast.id} className={`toast_notification toast_${toast.type} ${toast.leaving ? 'fade_out' : ''}`}>
                    <div className="toast_icon">{toast.type === 'error' ? '❌' : '✅'}</div>
                    <div className="toast_content">{toast.text}</div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
