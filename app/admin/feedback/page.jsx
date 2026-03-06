'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Star, ChevronDown, Trash2 } from 'lucide-react';

const QUESTION_LABELS = {
    first_impression: 'Prvi dojam',
    overall: 'Ukupna ocjena',
    ease_of_use: 'Jednostavnost',
    design_quality: 'Kvaliteta dizajna',
    editor: 'Webica AI Editor',
    best_feature: 'Omiljena značajka',
    missing_feature: 'Nedostaje',
    recommendation: 'NPS',
    free_text: 'Komentar',
};

function StarDisplay({ value }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={14} fill={value >= s ? '#fbbf24' : 'transparent'} stroke={value >= s ? '#fbbf24' : 'var(--lp-border)'} strokeWidth={1.5} />
            ))}
            <span className="text-xs ml-1.5" style={{ color: 'var(--lp-text-muted)' }}>{value}/5</span>
        </div>
    );
}

function NPSDisplay({ value }) {
    const color = value <= 6 ? '#ef4444' : value <= 8 ? '#f59e0b' : '#22c55e';
    const label = value <= 6 ? 'Detractor' : value <= 8 ? 'Passive' : 'Promoter';
    return (
        <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color }}>{value}</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: `${color}20`, color }}>{label}</span>
        </div>
    );
}

function FeedbackCard({ feedback, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const answers = typeof feedback.answers === 'string' ? JSON.parse(feedback.answers) : feedback.answers;
    const date = new Date(feedback.createdAt).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Extract key metrics for summary
    const overall = answers.overall;
    const nps = answers.recommendation;
    const firstImpression = answers.first_impression;

    return (
        <div className="db-card overflow-hidden">
            {/* Summary row */}
            <div onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer" role="button" tabIndex={0}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0" style={{ background: 'var(--lp-surface)', color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }}>
                    {feedback.user?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm truncate" style={{ color: 'var(--lp-heading)' }}>{feedback.user?.name || 'Anonimno'}</span>
                        <span className="text-[10px]" style={{ color: 'var(--lp-text-muted)' }}>{date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {overall && <StarDisplay value={overall} />}
                        {nps !== undefined && nps !== -1 && <NPSDisplay value={nps} />}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(feedback.id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: 'var(--lp-text-muted)' }}>
                        <Trash2 size={14} />
                    </button>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} style={{ color: 'var(--lp-text-muted)' }} />
                </div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div className="px-4 pb-4 db-fade-in" style={{ borderTop: '1px solid var(--lp-border)' }}>
                    <div className="pt-3 space-y-2.5">
                        {/* First impression (testimonial) - highlighted */}
                        {firstImpression && (
                            <div className="rounded-xl p-3.5" style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)' }}>
                                <p className="text-[11px] font-semibold mb-1 text-purple-400 flex items-center gap-1"><MessageSquare size={11} /> Prvi dojam (testimonial)</p>
                                <p className="text-sm italic leading-relaxed" style={{ color: 'var(--lp-heading)' }}>"{firstImpression}"</p>
                            </div>
                        )}

                        {/* All answers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(answers).filter(([k]) => k !== 'first_impression').map(([key, val]) => (
                                <div key={key} className="rounded-lg p-3" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                                    <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--lp-text-muted)' }}>{QUESTION_LABELS[key] || key}</p>
                                    {typeof val === 'number' && key !== 'recommendation' ? (
                                        <StarDisplay value={val} />
                                    ) : key === 'recommendation' ? (
                                        val !== -1 ? <NPSDisplay value={val} /> : <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>—</span>
                                    ) : (
                                        <p className="text-xs" style={{ color: 'var(--lp-text-secondary)' }}>{val || '—'}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFeedbacks = () => {
        setLoading(true);
        fetch('/api/admin/feedback')
            .then(res => { if (!res.ok) throw new Error(`Status ${res.status}`); return res.json(); })
            .then(data => setFeedbacks(data.feedbacks || []))
            .catch(err => console.error('Admin feedback error:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchFeedbacks(); }, []);

    const handleDelete = async (id) => {
        if (!confirm('Obrisati ovaj feedback?')) return;
        try {
            const res = await fetch('/api/admin/feedback', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            if (res.ok) setFeedbacks(prev => prev.filter(f => f.id !== id));
        } catch (e) { console.error(e); }
    };

    // Compute average ratings
    const avgOverall = feedbacks.length > 0 ? (feedbacks.reduce((s, f) => { const a = typeof f.answers === 'string' ? JSON.parse(f.answers) : f.answers; return s + (a.overall || 0); }, 0) / feedbacks.filter(f => { const a = typeof f.answers === 'string' ? JSON.parse(f.answers) : f.answers; return a.overall; }).length || 0).toFixed(1) : '—';
    const avgNps = feedbacks.length > 0 ? (feedbacks.reduce((s, f) => { const a = typeof f.answers === 'string' ? JSON.parse(f.answers) : f.answers; return s + (a.recommendation >= 0 ? a.recommendation : 0); }, 0) / feedbacks.filter(f => { const a = typeof f.answers === 'string' ? JSON.parse(f.answers) : f.answers; return a.recommendation >= 0; }).length || 0).toFixed(1) : '—';

    return (
        <div className="p-6 md:p-8 db-fade-in">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--lp-heading)' }}>Feedback</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>{feedbacks.length} odgovora</p>
                </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="db-card p-4">
                    <p className="text-xs mb-1" style={{ color: 'var(--lp-text-muted)' }}>Ukupno odgovora</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--lp-heading)' }}>{feedbacks.length}</p>
                </div>
                <div className="db-card p-4">
                    <p className="text-xs mb-1" style={{ color: 'var(--lp-text-muted)' }}>Prosječna ocjena</p>
                    <div className="flex items-center gap-1.5">
                        <Star size={18} fill="#fbbf24" stroke="#fbbf24" />
                        <p className="text-2xl font-bold" style={{ color: 'var(--lp-heading)' }}>{avgOverall}</p>
                    </div>
                </div>
                <div className="db-card p-4">
                    <p className="text-xs mb-1" style={{ color: 'var(--lp-text-muted)' }}>Prosječni NPS</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--lp-heading)' }}>{avgNps}</p>
                </div>
            </div>

            {/* Feedback list */}
            {loading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--lp-surface)' }} />)}</div>
            ) : feedbacks.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ border: '1px dashed var(--lp-border)' }}>
                    <MessageSquare size={28} className="mx-auto mb-3" style={{ color: 'var(--lp-text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--lp-text-muted)' }}>Nema feedbacka za prikaz.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {feedbacks.map(fb => <FeedbackCard key={fb.id} feedback={fb} onDelete={handleDelete} />)}
                </div>
            )}
        </div>
    );
}
