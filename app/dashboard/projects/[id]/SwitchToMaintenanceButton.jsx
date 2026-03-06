"use client";

import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";

export default function SwitchToMaintenanceButton({ projectId }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSwitch() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/switch-to-maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId }),
            });
            const data = await res.json();
            if (res.ok && data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || 'Greška pri kreiranju narudžbe.');
            }
        } catch {
            setError('Greška pri povezivanju.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                onClick={handleSwitch}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg text-sm transition-all disabled:opacity-50 cursor-pointer"
                style={{ background: '#059669', color: 'white' }}
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {loading ? 'Preusmjeravanje na plaćanje...' : 'Prebaci na godišnje održavanje — 250€/god'}
            </button>
            {error && (
                <p className="text-xs text-red-400 mt-2">{error}</p>
            )}
        </>
    );
}
