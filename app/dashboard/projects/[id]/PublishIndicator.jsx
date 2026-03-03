"use client";

import { useState, useEffect, useCallback } from "react";
import { Rocket, RefreshCw, Loader2, Check, AlertCircle } from "lucide-react";

/**
 * PublishIndicator - a client component that shows publish status in the project nav.
 *
 * - If site is NOT published: shows "Objavi" button
 * - If site IS published with no changes: shows green "Live" pill
 * - If site IS published with unpushed changes: shows orange notification badge + "Ažuriraj" button
 */
export default function PublishIndicator({ projectId }) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [success, setSuccess] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/domains?projectId=${projectId}`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch {}
        finally { setLoading(false); }
    }, [projectId]);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    // Listen for custom event from editor saves (so it refreshes after saving)
    useEffect(() => {
        const handler = () => fetchStatus();
        window.addEventListener('project-html-saved', handler);
        return () => window.removeEventListener('project-html-saved', handler);
    }, [fetchStatus]);

    const handlePublish = async () => {
        setPublishing(true);
        try {
            const res = await fetch('/api/domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, action: 'publish' }),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
                await fetchStatus();
            }
        } catch {}
        finally { setPublishing(false); }
    };

    const handleRepublish = async () => {
        setPublishing(true);
        try {
            const res = await fetch('/api/domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, action: 'republish' }),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
                await fetchStatus();
            }
        } catch {}
        finally { setPublishing(false); }
    };

    if (loading) return null;
    if (!status) return null;

    // Published with unpushed changes — orange notification
    if (status.published && status.hasUnpushedChanges) {
        return (
            <button
                onClick={handleRepublish}
                disabled={publishing}
                className="relative flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 transition-all hover:scale-105 disabled:opacity-60"
                style={{
                    background: success ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                    color: success ? '#22c55e' : '#f59e0b',
                    border: success ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(245,158,11,0.25)',
                }}
                title="Imate nepushanih promjena — kliknite za ažuriranje"
            >
                {/* Orange notification dot */}
                {!success && !publishing && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                    </span>
                )}
                {publishing ? <Loader2 size={13} className="animate-spin" />
                    : success ? <Check size={13} />
                    : <RefreshCw size={13} />}
                <span className="hidden sm:inline">
                    {publishing ? 'Ažuriram...' : success ? 'Ažurirano!' : 'Ažuriraj'}
                </span>
            </button>
        );
    }

    // Published, no changes — green "Live" pill
    if (status.published) {
        return (
            <span
                className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5"
                style={{
                    background: 'rgba(34,197,94,0.08)',
                    color: '#22c55e',
                    border: '1px solid rgba(34,197,94,0.2)',
                }}
            >
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="hidden sm:inline">Live</span>
            </span>
        );
    }

    // Not published — "Objavi" button
    return (
        <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 transition-all hover:scale-105 disabled:opacity-60"
            style={{
                background: success ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.1)',
                color: success ? '#22c55e' : '#22c55e',
                border: '1px solid rgba(34,197,94,0.25)',
            }}
            title="Objavi stranicu na internet"
        >
            {publishing ? <Loader2 size={13} className="animate-spin" />
                : success ? <Check size={13} />
                : <Rocket size={13} />}
            <span className="hidden sm:inline">
                {publishing ? 'Objavljivanje...' : success ? 'Objavljeno!' : 'Objavi'}
            </span>
        </button>
    );
}
