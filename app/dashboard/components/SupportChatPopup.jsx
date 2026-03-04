'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { createSupportTicket } from '@/app/actions/support-tickets';

const WELCOME_MESSAGE = {
    role: 'AI',
    content: 'Pozdrav! 👋 Ja sam Webica AI Asistent. Kako vam mogu pomoći?\n\nMožete me pitati:\n• Kako koristiti platformu\n• Pitanja o pretplatama i tokenima\n• Prijaviti tehnički problem\n\n💡 Za izmjene na web stranici koristite **AI Editor** u svom projektu.',
};

export default function SupportChatPopup() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticketCreated, setTicketCreated] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [open]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'USER', content: userMessage }]);
        setLoading(true);

        try {
            // Build conversation history (exclude welcome message)
            const conversationHistory = messages
                .filter((m) => m !== WELCOME_MESSAGE)
                .map((m) => ({ role: m.role, content: m.content }));

            const res = await fetch('/api/support/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory,
                }),
            });

            const data = await res.json();

            if (data.error) {
                setMessages((prev) => [...prev, { role: 'AI', content: data.error }]);
            } else {
                setMessages((prev) => [...prev, { role: 'AI', content: data.reply }]);

                // Handle escalation
                if (data.escalate) {
                    const allMessages = [
                        ...messages.filter((m) => m !== WELCOME_MESSAGE),
                        { role: 'USER', content: userMessage },
                        { role: 'AI', content: data.reply },
                    ];

                    const result = await createSupportTicket({
                        subject: data.escalate.subject || 'Tehnički problem',
                        type: data.escalate.type || 'TECHNICAL',
                        chatHistory: allMessages.map((m) => ({ role: m.role, content: m.content })),
                    });

                    if (result.success) {
                        setTicketCreated(true);
                        setMessages((prev) => [
                            ...prev,
                            {
                                role: 'AI',
                                content: `🎫 **Ticket kreiran!** Naš tim je obaviješten i javit će vam se u najkraćem roku.\n\nVaš ticket možete pratiti u tabu **"Ticketi"** na dashboardu.`,
                            },
                        ]);
                    }
                }
            }
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { role: 'AI', content: 'Došlo je do greške. Pokušajte ponovo.' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
                    style={{
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)',
                    }}
                    title="AI Podrška"
                >
                    <MessageCircle size={24} />
                </button>
            )}

            {/* Chat Panel */}
            {open && (
                <div
                    className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    style={{
                        background: 'var(--lp-bg-alt, #0a0a0a)',
                        border: '1px solid var(--lp-border, #222)',
                        height: 'min(560px, calc(100dvh - 6rem))',
                        animation: 'supportChatIn 0.2s ease-out',
                    }}
                >
                    {/* Header */}
                    <div
                        className="px-5 py-4 flex items-center justify-between flex-shrink-0"
                        style={{
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                <Sparkles size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">Webica Podrška</h3>
                                <p className="text-[11px] text-white/70">AI Asistent • Uvijek dostupan</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                        >
                            <X size={16} className="text-white" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg, i) => {
                            const isUser = msg.role === 'USER';
                            return (
                                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className="max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed"
                                        style={{
                                            background: isUser ? '#22c55e' : 'rgba(255,255,255,0.06)',
                                            color: isUser ? 'white' : 'var(--lp-text-secondary, #ccc)',
                                            borderBottomRightRadius: isUser ? '4px' : undefined,
                                            borderBottomLeftRadius: !isUser ? '4px' : undefined,
                                        }}
                                    >
                                        <div className="whitespace-pre-wrap">
                                            {msg.content.split(/(\*\*.*?\*\*)/g).map((part, j) => {
                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                                                }
                                                return part;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {loading && (
                            <div className="flex justify-start">
                                <div
                                    className="rounded-2xl px-4 py-3 flex items-center gap-2"
                                    style={{ background: 'rgba(255,255,255,0.06)' }}
                                >
                                    <Loader2 size={14} className="animate-spin" style={{ color: 'var(--lp-text-muted)' }} />
                                    <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Razmišljam...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={sendMessage}
                        className="p-3 flex gap-2 flex-shrink-0"
                        style={{ borderTop: '1px solid var(--lp-border, #222)' }}
                    >
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Postavite pitanje..."
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--lp-border, #222)',
                                color: 'var(--lp-heading, white)',
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-90"
                            style={{ background: '#22c55e', color: 'white' }}
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}

            {/* Inline animation */}
            <style jsx global>{`
                @keyframes supportChatIn {
                    from { opacity: 0; transform: translateY(16px) scale(0.95); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
}
