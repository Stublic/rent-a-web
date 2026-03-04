'use client';

import { useState, useEffect } from 'react';
import {
    MessageSquare, Clock, CheckCircle, AlertTriangle, ChevronRight,
    Filter, RefreshCw, Send, ArrowLeft, User as UserIcon,
} from 'lucide-react';

const STATUS_CONFIG = {
    OPEN: { label: 'Otvoren', color: '#3b82f6', icon: Clock, bg: 'rgba(59,130,246,0.1)' },
    ESCALATED: { label: 'Eskaliran', color: '#f59e0b', icon: AlertTriangle, bg: 'rgba(245,158,11,0.1)' },
    RESOLVED: { label: 'Riješen', color: '#22c55e', icon: CheckCircle, bg: 'rgba(34,197,94,0.1)' },
};

const TYPE_CONFIG = {
    TECHNICAL: { label: 'Tehnički', color: '#8b5cf6' },
    BILLING: { label: 'Billing', color: '#f59e0b' },
};

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedTicketData, setSelectedTicketData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
            const res = await fetch(`/api/admin/tickets${params}`);
            const data = await res.json();
            if (data.tickets) setTickets(data.tickets);
        } catch (err) {
            console.error('Failed to load tickets:', err);
        }
        setLoading(false);
    };

    const loadTicketDetail = async (id) => {
        setDetailLoading(true);
        setSelectedTicket(id);
        try {
            const res = await fetch(`/api/admin/tickets/${id}`);
            const data = await res.json();
            if (data.ticket) setSelectedTicketData(data.ticket);
        } catch (err) {
            console.error('Failed to load ticket:', err);
        }
        setDetailLoading(false);
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!reply.trim() || sending || !selectedTicket) return;
        setSending(true);
        try {
            await fetch(`/api/admin/tickets/${selectedTicket}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reply: reply.trim() }),
            });
            setReply('');
            await loadTicketDetail(selectedTicket);
        } catch (err) {
            console.error('Failed to send reply:', err);
        }
        setSending(false);
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedTicket) return;
        try {
            await fetch(`/api/admin/tickets/${selectedTicket}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            await loadTicketDetail(selectedTicket);
            loadTickets();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    useEffect(() => { loadTickets(); }, [statusFilter]);

    // ─── Ticket Detail View ────────────────────────────────────────────
    if (selectedTicket) {
        if (detailLoading || !selectedTicketData) {
            return (
                <div className="p-6 md:p-8">
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--lp-text-muted)' }} />
                    </div>
                </div>
            );
        }

        const ticket = selectedTicketData;
        const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
        const typeInfo = TYPE_CONFIG[ticket.type] || TYPE_CONFIG.TECHNICAL;

        return (
            <div className="p-6 md:p-8 max-w-4xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => { setSelectedTicket(null); setSelectedTicketData(null); loadTickets(); }}
                    className="flex items-center gap-2 mb-6 text-sm transition-colors hover:opacity-80"
                    style={{ color: 'var(--lp-text-muted)' }}
                >
                    <ArrowLeft size={16} /> Natrag na listu
                </button>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--lp-heading)' }}>{ticket.subject}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--lp-text-muted)' }}>
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: status.bg, color: status.color }}>
                                <status.icon size={12} /> {status.label}
                            </span>
                            <span className="px-2 py-1 rounded-lg" style={{ background: `${typeInfo.color}15`, color: typeInfo.color }}>
                                {typeInfo.label}
                            </span>
                            <span>
                                {ticket.user?.name || ticket.user?.email} ({ticket.user?.planName || 'Bez plana'})
                            </span>
                            <span>
                                {new Date(ticket.createdAt).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>

                    {/* Status actions */}
                    <div className="flex gap-2 flex-shrink-0">
                        {ticket.status !== 'RESOLVED' && (
                            <button
                                onClick={() => handleStatusChange('RESOLVED')}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
                            >
                                ✅ Označi riješenim
                            </button>
                        )}
                        {ticket.status === 'RESOLVED' && (
                            <button
                                onClick={() => handleStatusChange('OPEN')}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                                style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
                            >
                                🔄 Ponovno otvori
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                    <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto">
                        {ticket.messages.map((msg) => {
                            const isUser = msg.role === 'USER';
                            const isAdmin = msg.role === 'ADMIN';
                            const isAI = msg.role === 'AI';
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
                                        <div className="flex items-center gap-2 mb-1 text-xs font-bold" style={{ opacity: 0.7 }}>
                                            {isUser && '👤 Korisnik'}
                                            {isAI && '🤖 AI Asistent'}
                                            {isAdmin && '👑 Admin'}
                                            <span className="font-normal">
                                                {new Date(msg.createdAt).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Admin reply form */}
                    <form onSubmit={handleReply} className="p-3 flex gap-2" style={{ borderTop: '1px solid var(--lp-border)' }}>
                        <input
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Odgovorite korisniku kao admin..."
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
                            className="px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-30"
                            style={{ background: '#7c3aed', color: 'white' }}
                        >
                            <Send size={14} />
                            {sending ? '...' : 'Odgovori'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ─── Ticket List View ──────────────────────────────────────────────
    const statusCounts = {
        ALL: tickets.length,
        ESCALATED: tickets.filter(t => t.status === 'ESCALATED').length,
        OPEN: tickets.filter(t => t.status === 'OPEN').length,
        RESOLVED: tickets.filter(t => t.status === 'RESOLVED').length,
    };

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--lp-heading)' }}>Support Ticketi</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--lp-text-muted)' }}>
                        Upravljajte eskaliranim problemima korisnika
                    </p>
                </div>
                <button onClick={loadTickets} className="p-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: 'var(--lp-text-muted)' }}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Status filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {Object.entries({ ALL: 'Sve', ESCALATED: '⚠️ Eskalirani', OPEN: 'Otvoreni', RESOLVED: '✅ Riješeni' }).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                            background: statusFilter === key ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: statusFilter === key ? 'var(--lp-heading)' : 'var(--lp-text-muted)',
                            border: `1px solid ${statusFilter === key ? 'var(--lp-border)' : 'transparent'}`,
                        }}
                    >
                        {label} ({statusCounts[key] || 0})
                    </button>
                ))}
            </div>

            {/* Ticket list */}
            {loading && tickets.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--lp-text-muted)' }} />
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-20" style={{ color: 'var(--lp-text-muted)' }}>
                    <MessageSquare size={40} strokeWidth={1.5} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Nema ticketa za prikazati</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {tickets.map((ticket) => {
                        const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
                        const typeInfo = TYPE_CONFIG[ticket.type] || TYPE_CONFIG.TECHNICAL;
                        const StatusIcon = status.icon;
                        const latestMsg = ticket.messages?.[0];

                        return (
                            <button
                                key={ticket.id}
                                onClick={() => loadTicketDetail(ticket.id)}
                                className="w-full text-left p-4 rounded-xl transition-all hover:scale-[1.005] group"
                                style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--lp-heading)' }}>
                                                {ticket.subject}
                                            </h3>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--lp-text-muted)' }}>
                                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: status.bg, color: status.color }}>
                                                <StatusIcon size={11} /> {status.label}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded" style={{ background: `${typeInfo.color}15`, color: typeInfo.color }}>
                                                {typeInfo.label}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <UserIcon size={11} />
                                                {ticket.user?.name || ticket.user?.email}
                                            </span>
                                            <span>{ticket._count?.messages || 0} poruka</span>
                                            <span>
                                                {new Date(ticket.createdAt).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {latestMsg && (
                                            <p className="text-xs mt-2 truncate" style={{ color: 'var(--lp-text-muted)', opacity: 0.7 }}>
                                                {latestMsg.role === 'USER' ? '👤 ' : latestMsg.role === 'ADMIN' ? '👑 ' : '🤖 '}
                                                {latestMsg.content.substring(0, 100)}...
                                            </p>
                                        )}
                                    </div>
                                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: 'var(--lp-text-muted)' }} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
