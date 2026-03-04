'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronRight, Clock, CheckCircle, AlertTriangle, RefreshCw, Send } from 'lucide-react';
import { getMyTickets, getTicketMessages, addTicketReply } from '@/app/actions/support-tickets';

const STATUS_CONFIG = {
    OPEN: { label: 'Otvoren', color: '#3b82f6', icon: Clock },
    ESCALATED: { label: 'Eskaliran', color: '#f59e0b', icon: AlertTriangle },
    RESOLVED: { label: 'Riješen', color: '#22c55e', icon: CheckCircle },
};

const TYPE_CONFIG = {
    TECHNICAL: { label: 'Tehnički', color: '#8b5cf6' },
    BILLING: { label: 'Billing', color: '#f59e0b' },
};

function TicketDetail({ ticketId, onClose }) {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);

    const loadMessages = async () => {
        setLoading(true);
        const result = await getTicketMessages(ticketId);
        if (result.ticket) setTicket(result.ticket);
        setLoading(false);
    };

    useEffect(() => { loadMessages(); }, [ticketId]);

    const handleReply = async (e) => {
        e.preventDefault();
        if (!reply.trim() || sending) return;
        setSending(true);
        const result = await addTicketReply(ticketId, reply.trim());
        if (result.success) {
            setReply('');
            await loadMessages();
        }
        setSending(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--lp-text-muted)' }} />
            </div>
        );
    }

    if (!ticket) return null;

    const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;

    return (
        <div className="rounded-2xl p-5" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--lp-heading)' }}>{ticket.subject}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>
                        {new Date(ticket.createdAt).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--lp-text-muted)' }}>
                    ← Natrag
                </button>
            </div>

            {/* Messages */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 mb-4">
                {ticket.messages.map((msg) => {
                    const isUser = msg.role === 'USER';
                    const isAdmin = msg.role === 'ADMIN';
                    return (
                        <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className="max-w-[80%] rounded-2xl px-4 py-3 text-sm"
                                style={{
                                    background: isUser ? 'var(--lp-accent, #22c55e)' : isAdmin ? '#7c3aed' : 'rgba(255,255,255,0.05)',
                                    color: isUser || isAdmin ? 'white' : 'var(--lp-text-secondary)',
                                    borderBottomRightRadius: isUser ? '4px' : undefined,
                                    borderBottomLeftRadius: !isUser ? '4px' : undefined,
                                }}
                            >
                                {isAdmin && <div className="text-xs font-bold mb-1 opacity-80">👑 Admin</div>}
                                {msg.role === 'AI' && <div className="text-xs font-bold mb-1 opacity-60">🤖 AI Asistent</div>}
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Reply form (only for non-resolved tickets) */}
            {ticket.status !== 'RESOLVED' && (
                <form onSubmit={handleReply} className="flex gap-2">
                    <input
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Dodaj odgovor..."
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--lp-border)',
                            color: 'var(--lp-heading)',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={sending || !reply.trim()}
                        className="px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-40"
                        style={{ background: 'var(--lp-accent, #22c55e)', color: 'white' }}
                    >
                        <Send size={14} />
                    </button>
                </form>
            )}

            {ticket.status === 'RESOLVED' && (
                <div className="text-center py-3 rounded-xl text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                    ✅ Ovaj ticket je riješen
                </div>
            )}
        </div>
    );
}

export default function SupportTab() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    const loadTickets = async () => {
        setLoading(true);
        const result = await getMyTickets();
        if (result.tickets) setTickets(result.tickets);
        setLoading(false);
    };

    useEffect(() => { loadTickets(); }, []);

    if (selectedTicketId) {
        return <TicketDetail ticketId={selectedTicketId} onClose={() => { setSelectedTicketId(null); loadTickets(); }} />;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--lp-heading)' }}>Podrška & Ticketi</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--lp-text-muted)' }}>
                        Vaši prethodni razgovori s podrškom i eskalirani problemi.
                    </p>
                </div>
                <button onClick={loadTickets} className="p-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: 'var(--lp-text-muted)' }}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading && tickets.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--lp-text-muted)' }} />
                </div>
            ) : tickets.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center max-w-sm">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}
                        >
                            <MessageSquare size={28} strokeWidth={1.5} style={{ color: 'var(--lp-text-muted)' }} />
                        </div>
                        <h3 className="font-bold mb-2" style={{ color: 'var(--lp-heading)' }}>Nema ticketa</h3>
                        <p className="text-sm" style={{ color: 'var(--lp-text-muted)' }}>
                            Koristite AI chat (ikona 💬 dolje desno) za pitanja i pomoć. Ako AI ne može riješiti vaš problem, automatski će kreirati ticket.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {tickets.map((ticket) => {
                        const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
                        const typeInfo = TYPE_CONFIG[ticket.type] || TYPE_CONFIG.TECHNICAL;
                        const StatusIcon = status.icon;

                        return (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedTicketId(ticket.id)}
                                className="w-full text-left p-4 rounded-xl transition-all hover:scale-[1.01] group"
                                style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--lp-heading)' }}>
                                                {ticket.subject}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--lp-text-muted)' }}>
                                            <span className="flex items-center gap-1">
                                                <StatusIcon size={12} style={{ color: status.color }} />
                                                <span style={{ color: status.color }}>{status.label}</span>
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded" style={{ background: `${typeInfo.color}15`, color: typeInfo.color }}>
                                                {typeInfo.label}
                                            </span>
                                            <span>
                                                {new Date(ticket.createdAt).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' })}
                                            </span>
                                            <span>{ticket._count?.messages || 0} poruka</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--lp-text-muted)' }} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
