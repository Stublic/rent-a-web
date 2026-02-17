'use client';

import { useEffect, useState } from 'react';
import { FileText, ExternalLink, Download } from 'lucide-react';

export default function AdminInvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/invoices')
            .then(res => {
                if (!res.ok) throw new Error(`Status ${res.status}`);
                return res.json();
            })
            .then(data => setInvoices(data.invoices || []))
            .catch(err => console.error('Admin invoices error:', err))
            .finally(() => setLoading(false));
    }, []);

    const typeLabels = {
        SUBSCRIPTION: 'Pretplata',
        TOKEN_PURCHASE: 'Tokeni',
    };

    const typeColors = {
        SUBSCRIPTION: 'bg-blue-500/20 text-blue-400',
        TOKEN_PURCHASE: 'bg-amber-500/20 text-amber-400',
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Računi</h1>
                <p className="text-zinc-500 mt-1">{invoices.length} ukupno</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-zinc-800 text-left text-zinc-500">
                            <th className="px-5 py-3 font-medium">Broj</th>
                            <th className="px-5 py-3 font-medium">Korisnik</th>
                            <th className="px-5 py-3 font-medium">Opis</th>
                            <th className="px-5 py-3 font-medium">Tip</th>
                            <th className="px-5 py-3 font-medium">Iznos</th>
                            <th className="px-5 py-3 font-medium">Datum</th>
                            <th className="px-5 py-3 font-medium">PDF</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={7} className="px-5 py-4">
                                        <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-12 text-center text-zinc-600">
                                    Nema računa u bazi
                                </td>
                            </tr>
                        ) : invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="px-5 py-3">
                                    <p className="text-white font-mono text-xs font-medium">#{inv.invoiceNumber}</p>
                                </td>
                                <td className="px-5 py-3">
                                    <p className="text-zinc-300 text-sm">{inv.user?.name || '—'}</p>
                                    <p className="text-xs text-zinc-500">{inv.user?.email}</p>
                                </td>
                                <td className="px-5 py-3 text-zinc-400 text-sm">{inv.description}</td>
                                <td className="px-5 py-3">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${typeColors[inv.type] || ''}`}>
                                        {typeLabels[inv.type] || inv.type}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-green-400 font-semibold">€{inv.amount?.toFixed(2)}</td>
                                <td className="px-5 py-3 text-zinc-500 text-xs">
                                    {new Date(inv.createdAt).toLocaleDateString('hr-HR')}
                                </td>
                                <td className="px-5 py-3">
                                    {inv.pdfUrl ? (
                                        <a
                                            href={inv.pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 rounded-md hover:bg-green-500/20 text-zinc-500 hover:text-green-400 transition-colors inline-flex"
                                        >
                                            <Download size={14} />
                                        </a>
                                    ) : (
                                        <span className="text-zinc-700 text-xs">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
