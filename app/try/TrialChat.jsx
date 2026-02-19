'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Sparkles, Lock } from 'lucide-react';

const MAX_FREE_EDITS = 2;

export default function TrialChat({ html, onHtmlUpdate, editsUsed, onEditUsed, onLimitReached, isEditing, setIsEditing }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const isLocked = editsUsed >= MAX_FREE_EDITS;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isEditing || isLocked || !html) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsEditing(true);

        try {
            const res = await fetch('/api/try/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html, editRequest: input }),
            });

            const data = await res.json();

            if (res.ok && data.html) {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: data.message || 'Izmjena primijenjena!',
                        success: true,
                    },
                ]);
                onHtmlUpdate(data.html);
                const newCount = editsUsed + 1;
                onEditUsed(newCount);

                // Check if limit reached after this edit
                if (newCount >= MAX_FREE_EDITS) {
                    setTimeout(() => {
                        onLimitReached();
                    }, 1500);
                }
            } else {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: data.error || 'Nisam mogao primijeniti izmjenu.',
                        isError: true,
                    },
                ]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Došlo je do greške. Pokušajte ponovno.',
                    isError: true,
                },
            ]);
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="font-bold flex items-center gap-2 text-white">
                            <Sparkles size={18} className="text-zinc-400" />
                            AI Editor
                        </h2>
                        <p className="text-xs text-zinc-500">Isprobaj uređivanje pomoću AI-a</p>
                    </div>
                </div>

                {/* Edit Counter */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                    <span className="text-xs text-zinc-500">Besplatna uređivanja:</span>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            {[...Array(MAX_FREE_EDITS)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full transition-colors ${
                                        i < editsUsed
                                            ? 'bg-white'
                                            : 'bg-zinc-700 border border-zinc-600'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className={`text-sm font-mono font-bold ${
                            isLocked ? 'text-zinc-500' : 'text-white'
                        }`}>
                            {editsUsed}/{MAX_FREE_EDITS}
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !isLocked && (
                    <div className="text-center text-zinc-600 text-sm mt-8 space-y-6">
                        <div>
                            <p className="mb-4 text-zinc-400 font-medium">💡 Primjeri zahtjeva:</p>
                            <ul className="space-y-3 text-left max-w-sm mx-auto">
                                <li className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-zinc-400">
                                    &quot;Promijeni boju gumba u crvenu&quot;
                                </li>
                                <li className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-zinc-400">
                                    &quot;Dodaj sekciju s cijenama&quot;
                                </li>
                                <li className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-zinc-400">
                                    &quot;Promijeni tekst u hero sekciji&quot;
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                msg.role === 'user'
                                    ? 'bg-white text-black'
                                    : msg.isError
                                    ? 'bg-red-900/30 text-red-400 border border-red-800'
                                    : msg.success
                                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                                    : 'bg-zinc-800 text-zinc-200'
                            }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isEditing && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-2 border border-zinc-700">
                            <Loader2 className="animate-spin text-zinc-400" size={16} />
                            <span className="text-sm text-zinc-400">AI uređuje stranicu...</span>
                        </div>
                    </div>
                )}

                {isLocked && messages.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-800/50 rounded-2xl px-4 py-3 text-sm text-zinc-500 border border-zinc-700/50 flex items-center gap-2">
                            <Lock size={14} />
                            Besplatna uređivanja su potrošena. Odaberi paket za nastavak.
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            isLocked
                                ? 'Odaberi paket za nastavak...'
                                : !html
                                ? 'Prvo generiraj stranicu...'
                                : "Npr. 'promijeni boju pozadine u plavu'"
                        }
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-500 disabled:opacity-50"
                        disabled={isEditing || isLocked || !html}
                    />
                    <button
                        type="submit"
                        disabled={isEditing || !input.trim() || isLocked || !html}
                        className="bg-white hover:bg-zinc-200 text-black px-6 rounded-xl font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Pošalji
                    </button>
                </div>
            </form>
        </div>
    );
}
