// Load data from the API when a page opens: const { data, error, loading, reload } = useApi('/cases');
import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

export default function useApi(url) {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        if (!url) return;
        setLoading(true);
        try {
            setData(await api.get(url));
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        reload();
    }, [reload]);

    return { data, error, loading, reload, setData };
}
