'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Mail, Phone, Clock, CheckCircle, Circle, Inbox } from 'lucide-react';

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Upravo';
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} d`;
    return new Date(dateStr).toLocaleDateString('hr-HR');
}

export default function InquiriesPage() {
    const { id: projectId } = useParams();
    const [submissions, setSubmissions] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'
    const [expanded, setExpanded] = useState(null);

    async function fetchSubmissions() {
        const res = await fetch(`/api/site/${projectId}/contact?unread=${filter === 'unread'}`);
        if (res.ok) {
            const data = await res.json();
            setSubmissions(data.submissions);
            setUnreadCount(data.unreadCount);
        }
        setLoading(false);
    }

    useEffect(() => { fetchSubmissions(); }, [filter]);

    async function markRead(submissionId, read) {
        await fetch(`/api/site/${projectId}/contact/${submissionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read }),
        });
        setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, read } : s));
        setUnreadCount(prev => read ? Math.max(0, prev - 1) : prev + 1);
    }

    function toggleExpand(id, submission) {
        setExpanded(expanded === id ? null : id);
        if (!submission.read) markRead(id, true);
    }

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Inbox size={20} className="text-violet-400" />
                        Upiti s kontakt forme
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        {unreadCount > 0 ? (
                            <span className="text-violet-400 font-medium">{unreadCount} nepročitanih</span>
                        ) : (
                            'Sve pročitano'
                        )}
                    </p>
                </div>
                {/* Filter pills */}
                <div className="flex gap-2">
                    {['all', 'unread'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f
                                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                                }`}
                        >
                            {f === 'all' ? 'Svi' : 'Nepročitani'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-zinc-900 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : submissions.length === 0 ? (
                <div className="text-center py-16">
                    <Inbox size={40} className="text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-400 font-medium">
                        {filter === 'unread' ? 'Nema nepročitanih upita' : 'Još nema upita'}
                    </p>
                    <p className="text-zinc-600 text-sm mt-1">
                        Upiti s kontakt forme na vašoj web stranici prikazuju se ovdje.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {submissions.map(s => (
                        <div
                            key={s.id}
                            className={`rounded-xl border transition-all cursor-pointer ${s.read
                                ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                                : 'bg-zinc-900 border-zinc-700 shadow-lg shadow-violet-500/5'
                                }`}
                        >
                            {/* Row */}
                            <div
                                className="flex items-center gap-4 p-4"
                                onClick={() => toggleExpand(s.id, s)}
                            >
                                {/* Read indicator */}
                                <button
                                    onClick={e => { e.stopPropagation(); markRead(s.id, !s.read); }}
                                    className="flex-shrink-0"
                                    title={s.read ? 'Označi kao nepročitano' : 'Označi kao pročitano'}
                                >
                                    {s.read
                                        ? <CheckCircle size={18} className="text-zinc-600 hover:text-zinc-400 transition-colors" />
                                        : <Circle size={18} className="text-violet-400 fill-violet-400/20" />
                                    }
                                </button>

                                {/* Avatar */}
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${s.read ? 'bg-zinc-800 text-zinc-500' : 'bg-violet-500/20 text-violet-400'}`}>
                                    {s.name.charAt(0).toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-semibold text-sm ${s.read ? 'text-zinc-400' : 'text-white'}`}>
                                            {s.name}
                                        </span>
                                        {!s.read && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-zinc-500 text-xs mt-0.5 truncate">{s.message}</p>
                                </div>

                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-xs text-zinc-600 flex items-center gap-1">
                                        <Clock size={11} />
                                        {timeAgo(s.createdAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Expanded */}
                            {expanded === s.id && (
                                <div className="px-4 pb-4 pt-0 border-t border-zinc-800 mt-0 space-y-3">
                                    <div className="flex flex-wrap gap-3 pt-3">
                                        <a
                                            href={`mailto:${s.email}`}
                                            className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                                        >
                                            <Mail size={13} />
                                            {s.email}
                                        </a>
                                        {s.phone && (
                                            <a
                                                href={`tel:${s.phone}`}
                                                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
                                            >
                                                <Phone size={13} />
                                                {s.phone}
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap bg-zinc-800/50 rounded-lg p-3">
                                        {s.message}
                                    </p>
                                    <div className="flex gap-2 pt-1">
                                        <a
                                            href={`mailto:${s.email}?subject=Odgovor na vaš upit`}
                                            className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium text-white transition-colors"
                                        >
                                            Odgovori emailom
                                        </a>
                                        <span className="text-xs text-zinc-600 flex items-center">
                                            {new Date(s.createdAt).toLocaleString('hr-HR')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
