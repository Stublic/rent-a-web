"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";

export default function RenewButton({ projectId, className }) {
    const [loading, setLoading] = useState(false);

    const handleRenew = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/renew-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Greška pri obnovi.');
            }
        } catch (err) {
            console.error('Renew error:', err);
            alert('Došlo je do greške.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleRenew}
            disabled={loading}
            className={className || "bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"}
        >
            {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Obnavljam...</>
            ) : (
                <><RefreshCw size={18} /> Obnovi pretplatu</>
            )}
        </button>
    );
}
