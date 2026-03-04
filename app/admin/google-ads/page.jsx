'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Clock, CheckCircle, Eye, Copy, Check, ChevronDown, ChevronUp, Loader2, ArrowLeft } from 'lucide-react';

function CopyButton({ text, label }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
            style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: copied ? '#10b981' : 'var(--lp-text-secondary)' }}
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Kopirano!' : (label || 'Kopiraj')}
        </button>
    );
}

function AssetSection({ title, items, maxChars, color }) {
    const copyAll = () => {
        navigator.clipboard.writeText(items.join('\n'));
    };

    return (
        <div className="rounded-xl p-5" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--lp-heading)' }}>
                    {title} <span className="font-normal text-xs" style={{ color: 'var(--lp-text-muted)' }}>({items.length} items, max {maxChars} chars)</span>
                </h4>
                <CopyButton text={items.join('\n')} label="Kopiraj sve" />
            </div>

            <div className="space-y-1.5">
                {items.map((item, i) => {
                    const overLimit = item.length > maxChars;
                    return (
                        <div key={i} className="flex items-center gap-2 group">
                            <span className="text-[10px] font-mono w-5 text-right flex-shrink-0" style={{ color: 'var(--lp-text-muted)' }}>{i + 1}</span>
                            <div
                                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium"
                                style={{
                                    background: overLimit ? 'rgba(239,68,68,0.08)' : 'var(--lp-bg)',
                                    border: overLimit ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--lp-border)',
                                    color: overLimit ? '#f87171' : 'var(--lp-heading)',
                                }}
                            >
                                {item}
                            </div>
                            <span className={`text-[10px] font-mono w-8 text-right flex-shrink-0 ${overLimit ? 'text-red-400 font-bold' : ''}`} style={{ color: overLimit ? undefined : 'var(--lp-text-muted)' }}>
                                {item.length}
                            </span>
                            <button
                                onClick={() => navigator.clipboard.writeText(item)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                                style={{ color: 'var(--lp-text-muted)' }}
                                title="Kopiraj"
                            >
                                <Copy size={12} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function KeywordsSection({ keywords }) {
    const copyAll = () => {
        navigator.clipboard.writeText(keywords.join('\n'));
    };

    return (
        <div className="rounded-xl p-5" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--lp-heading)' }}>
                    Ključne riječi <span className="font-normal text-xs" style={{ color: 'var(--lp-text-muted)' }}>({keywords.length} keywords)</span>
                </h4>
                <CopyButton text={keywords.join('\n')} label="Kopiraj sve" />
            </div>

            <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw, i) => (
                    <button
                        key={i}
                        onClick={() => navigator.clipboard.writeText(kw)}
                        className="px-2.5 py-1 rounded-lg text-xs transition-all hover:scale-105 cursor-pointer"
                        style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-secondary)' }}
                        title="Klikni za kopiranje"
                    >
                        {kw}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function AdminGoogleAdsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [activating, setActivating] = useState(null);
    const [statusFilter, setStatusFilter] = useState('AWAITING_ADMIN');

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/google-ads?status=${statusFilter}`);
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data.campaigns || []);
            }
        } catch (err) {
            console.error('Failed to fetch campaigns:', err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchCampaigns(); }, [statusFilter]);

    const activateCampaign = async (campaignId) => {
        setActivating(campaignId);
        try {
            const res = await fetch(`/api/admin/google-ads/${campaignId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ACTIVE' }),
            });
            if (res.ok) {
                setCampaigns(prev => prev.filter(c => c.id !== campaignId));
            }
        } catch (err) {
            console.error('Failed to activate campaign:', err);
        }
        setActivating(null);
    };

    const statusColors = {
        PENDING: 'bg-yellow-500/15 text-yellow-400',
        AWAITING_ADMIN: 'bg-blue-500/15 text-blue-400',
        ACTIVE: 'bg-emerald-500/15 text-emerald-400',
    };

    return (
        <div className="p-6 md:p-8 db-fade-in">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--lp-heading)' }}>
                        <Megaphone size={20} className="text-violet-400" />
                        Google Ads Kampanje
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>
                        Upravljanje kampanjama korisnika
                    </p>
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                    {['AWAITING_ADMIN', 'ACTIVE', 'PENDING'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s
                                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                : 'border border-transparent'
                                }`}
                            style={{ color: statusFilter !== s ? 'var(--lp-text-muted)' : undefined }}
                        >
                            {s === 'AWAITING_ADMIN' ? 'Čeka aktivaciju' : s === 'ACTIVE' ? 'Aktivne' : 'Na čekanju'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Campaigns List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--lp-surface)' }} />
                    ))}
                </div>
            ) : campaigns.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                    <Megaphone size={40} className="mx-auto mb-4" style={{ color: 'var(--lp-text-muted)' }} />
                    <p className="font-medium" style={{ color: 'var(--lp-text-secondary)' }}>
                        Nema kampanja sa statusom "{statusFilter === 'AWAITING_ADMIN' ? 'Čeka aktivaciju' : statusFilter === 'ACTIVE' ? 'Aktivne' : 'Na čekanju'}"
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {campaigns.map(c => {
                        const isExpanded = expandedId === c.id;
                        const contentData = c.project?.contentData || {};

                        return (
                            <div key={c.id} className="rounded-xl overflow-hidden transition-all" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                                {/* Row Header */}
                                <div
                                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-semibold text-sm" style={{ color: 'var(--lp-heading)' }}>
                                                {c.project?.name || 'N/A'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[c.status] || ''}`}>
                                                {c.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--lp-text-muted)' }}>
                                            <span>{c.project?.user?.email}</span>
                                            <span>•</span>
                                            <span>{contentData.industry || '—'}</span>
                                            <span>•</span>
                                            <span>{new Date(c.createdAt).toLocaleDateString('hr-HR')}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {c.status === 'AWAITING_ADMIN' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); activateCampaign(c.id); }}
                                                disabled={activating === c.id}
                                                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50"
                                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}
                                            >
                                                {activating === c.id ? (
                                                    <Loader2 size={13} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <CheckCircle size={13} className="inline mr-1" />
                                                        Aktiviraj
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--lp-text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--lp-text-muted)' }} />}
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                {isExpanded && (
                                    <div className="px-4 pb-5 pt-1 space-y-4" style={{ borderTop: '1px solid var(--lp-border)' }}>
                                        {/* Business Info */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                                            {[
                                                { label: 'Biznis', value: contentData.businessName || c.project?.name },
                                                { label: 'Industrija', value: contentData.industry },
                                                { label: 'Grad', value: contentData.city || contentData.address },
                                                { label: 'Telefon', value: contentData.phone },
                                            ].map((item, i) => (
                                                <div key={i} className="rounded-lg p-3" style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)' }}>
                                                    <span className="text-[10px] font-medium uppercase" style={{ color: 'var(--lp-text-muted)' }}>{item.label}</span>
                                                    <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--lp-heading)' }}>{item.value || '—'}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Headlines */}
                                        {c.generatedHeadlines && (
                                            <AssetSection
                                                title="Short Headlines"
                                                items={c.generatedHeadlines}
                                                maxChars={30}
                                                color="violet"
                                            />
                                        )}

                                        {/* Long Headlines */}
                                        {c.generatedLongHeadlines && (
                                            <AssetSection
                                                title="Long Headlines"
                                                items={c.generatedLongHeadlines}
                                                maxChars={90}
                                                color="blue"
                                            />
                                        )}

                                        {/* Descriptions */}
                                        {c.generatedDescriptions && (
                                            <AssetSection
                                                title="Descriptions"
                                                items={c.generatedDescriptions}
                                                maxChars={90}
                                                color="emerald"
                                            />
                                        )}

                                        {/* Keywords */}
                                        {c.generatedKeywords && (
                                            <KeywordsSection keywords={c.generatedKeywords} />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
