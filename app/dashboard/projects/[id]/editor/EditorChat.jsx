"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Undo2, ExternalLink, Sparkles, Coins } from "lucide-react";
import { editWebsiteAction, undoLastEditAction } from "@/app/actions/edit-website";
import { useRouter } from "next/navigation";

export default function EditorChat({ project }) {
    const projectId = project.id; // For use in links
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [undoing, setUndoing] = useState(false);
    const [tokens, setTokens] = useState(project.editorTokens || 0);
    const messagesEndRef = useRef(null);
    const router = useRouter();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const result = await editWebsiteAction(project.id, input);

            if (result.success) {
                // Update token count
                if (result.tokensRemaining !== undefined) {
                    setTokens(result.tokensRemaining);
                }
                
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: `${result.message} (Potrošeno: ${result.tokensConsumed || 0} tokena)`,
                        success: true,
                    },
                ]);

                // Refresh to update preview
                router.refresh();
            } else if (result.insufficientTokens) {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: result.error,
                        isError: true,
                        showBuyTokens: true
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: result.error || "Nisam mogao primijeniti izmjenu.",
                        isError: true,
                    },
                ]);
            }
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Došlo je do greške. Pokušajte ponovno.",
                    isError: true,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleUndo = async () => {
        setUndoing(true);
        try {
            const result = await undoLastEditAction(project.id);

            if (result.success) {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: result.message || "Izmjena poništena.",
                        success: true,
                    },
                ]);
                router.refresh();
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: result.error,
                        isError: true,
                    },
                ]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUndoing(false);
        }
    };

    const hasEdits = Array.isArray(project.editHistory) && project.editHistory.length > 0;

    return (
        <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="font-bold flex items-center gap-2">
                            <Sparkles size={18} className="text-green-500" />
                            AI Editor
                        </h2>
                        <p className="text-xs text-zinc-500">Opišite što želite promijeniti</p>
                    </div>
                    <button
                        onClick={handleUndo}
                        disabled={!hasEdits || undoing}
                        className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        title="Poništi zadnju izmjenu"
                    >
                        <Undo2 size={16} />
                        <span className="hidden sm:inline">Undo</span>
                    </button>
                </div>
                
                {/* Token Display */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                    <span className="text-xs text-zinc-500">Preostali tokeni:</span>
                    <div className="flex items-center gap-2">
                        <Coins size={14} className={tokens > 100 ? "text-green-500" : tokens > 50 ? "text-yellow-500" : "text-red-500"} />
                        <span className={`text-sm font-mono font-bold ${
                            tokens > 100 ? "text-green-500" : tokens > 50 ? "text-yellow-500" : "text-red-500"
                        }`}>
                            {tokens}
                        </span>
                        {tokens === 0 && (
                            <a
                                href={`/dashboard/projects/${projectId}/tokens`}
                                className="ml-2 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                            >
                                <Coins size={12} />
                                Kupi
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-zinc-600 text-sm mt-8 space-y-6">
                        <div>
                            <p className="mb-4 text-zinc-400 font-medium">💡 Primjeri zahtjeva:</p>
                            <ul className="space-y-3 text-left max-w-sm mx-auto">
                                <li className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                                    "Promijeni boju gumba u crvenu"
                                </li>
                                <li className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                                    "Dodaj više prostora ispod naslova"
                                </li>
                                <li className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                                    "Promijeni tekst u hero sekciji"
                                </li>
                                <li className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                                    "Napravi font veći u About sekciji"
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                msg.role === "user"
                                    ? "bg-green-600 text-white"
                                    : msg.isError
                                    ? "bg-red-900/30 text-red-400 border border-red-800"
                                    : msg.success
                                    ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800"
                                    : "bg-zinc-800 text-zinc-200"
                            }`}
                        >
                            {msg.content}
                            {msg.showBuyTokens && (
                                <div className="mt-3 pt-3 border-t border-red-800/50">
                                    <p className="text-xs text-red-300 mb-3">
                                        Trebate više tokena za nastavak AI uređivanja.
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <a 
                                            href={`/dashboard/projects/${project.id}/tokens`}
                                            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Coins size={16} />
                                            Kupi Tokene
                                        </a>
                                        <p className="text-xs text-zinc-400">
                                            💡 Ili koristite besplatno <strong>"Ažuriraj Web Stranicu"</strong> u tabu Sadržaj
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                            <Loader2 className="animate-spin" size={16} />
                            <span className="text-sm text-zinc-400">AI razmišlja...</span>
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
                        placeholder={tokens < 50 ? "Nemate dovoljno tokena..." : "Npr. 'promijeni boju hero sekcije u plavu'"}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 text-white placeholder-zinc-500"
                        disabled={loading || tokens < 50}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim() || tokens < 50}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Pošalji
                    </button>
                </div>
            </form>
        </div>
    );
}
