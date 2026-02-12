"use client";

import { useState, useEffect } from "react";
import { ChevronRight, FileText, Zap, LifeBuoy } from "lucide-react";
import Link from "next/link";

export default function SubscriptionTab({ user, onPortal }) {
    const isSubscriber = user.subscriptionStatus === "active";
    const plan = user.planName || "Nema aktivne pretplate";
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
             try {
                 const res = await fetch("/api/user/subscription");
                 const data = await res.json();
                 if (data.invoices) setInvoices(data.invoices);
             } catch (err) {
                 console.error("Failed to fetch invoices", err);
             } finally {
                 setLoadingInvoices(false);
             }
        };
        fetchInvoices();
    }, []);

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="text-sm text-zinc-500 uppercase font-bold tracking-wider mb-2">Trenutni Status</div>
                        <h3 className="text-3xl font-bold mb-1">{plan}</h3>
                        <div className="flex items-center gap-2 mt-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isSubscriber ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-zinc-800 text-zinc-500"}`}>
                                {isSubscriber ? "Aktivan" : "Neaktivan"}
                            </span>
                        </div>
                    </div>
                    {isSubscriber ? (
                        <button 
                            onClick={onPortal}
                            className="bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2"
                        >
                             Upravljaj pretplatom <ChevronRight size={18} />
                        </button>
                    ) : (
                        <Link href="/dashboard/new-project" className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-4 rounded-xl transition-all inline-flex items-center gap-2">
                            Odaberi paket <ChevronRight size={18} />
                        </Link>
                    )}
                </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
                 <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-zinc-500" /> Povijest Računa
                 </h4>
                 {loadingInvoices ? (
                     <div className="text-center py-8 text-zinc-500">Učitavanje računa...</div>
                 ) : invoices.length > 0 ? (
                     <div className="space-y-2">
                        {invoices.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-colors">
                                <div>
                                    <div className="font-bold text-white">{inv.date}</div>
                                    <div className="text-xs text-zinc-500 uppercase">{inv.status}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-zinc-300">{inv.amount} {inv.currency}</span>
                                    <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 font-medium text-sm">
                                        PDF
                                    </a>
                                </div>
                            </div>
                        ))}
                     </div>
                 ) : (
                     <div className="text-center py-8 text-zinc-500 italic border border-dashed border-zinc-800 rounded-xl">
                        Nema dostupnih računa.
                     </div>
                 )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Poboljšajte svoj web</h4>
                    <p className="text-zinc-500 text-sm mb-4">Dodajte nove funkcionalnosti, SEO članke ili Google Ads vođenje.</p>
                    <button className="text-purple-400 font-bold text-sm hover:text-purple-300 flex items-center gap-1">Prikaži opcije <ChevronRight size={14} /></button>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <LifeBuoy size={24} />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Trebate pomoć?</h4>
                    <p className="text-zinc-500 text-sm mb-4">Naš tim je tu za vas 24/7. Otvorite ticket i riješit ćemo sve u trenu.</p>
                    <button className="text-blue-400 font-bold text-sm hover:text-blue-300 flex items-center gap-1">Kontaktiraj podršku <ChevronRight size={14} /></button>
                </div>
            </div>
        </div>
    );
}
