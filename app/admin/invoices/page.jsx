'use client';

import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';

export default function AdminInvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/invoices')
            .then(res => { if (!res.ok) throw new Error(`Status ${res.status}`); return res.json(); })
            .then(data => setInvoices(data.invoices || []))
            .catch(err => console.error('Admin invoices error:', err))
            .finally(() => setLoading(false));
    }, []);

    const typeLabels = { SUBSCRIPTION: 'Pretplata', TOKEN_PURCHASE: 'Tokeni' };

    return (
        <div className="p-6 md:p-8 db-fade-in">
            <div className="mb-6">
                <h1 className="text-xl font-bold" style={{ color: 'var(--lp-heading)' }}>Računi</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>{invoices.length} ukupno</p>
            </div>

            <div className="db-card overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--lp-border)' }}>
                            {['Broj', 'Korisnik', 'Opis', 'Tip', 'Iznos', 'Datum', 'PDF'].map(h => (
                                <th key={h} className="px-4 py-3 font-medium text-left text-xs" style={{ color: 'var(--lp-text-muted)' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? [...Array(5)].map((_, i) => (
                            <tr key={i}><td colSpan={7} className="px-4 py-3.5"><div className="h-4 rounded animate-pulse" style={{ background: 'var(--lp-surface)' }} /></td></tr>
                        )) : invoices.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--lp-text-muted)' }}>Nema računa u bazi</td></tr>
                        ) : invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                                <td className="px-4 py-3"><span className="font-mono text-xs font-medium" style={{ color: 'var(--lp-heading)' }}>#{inv.invoiceNumber}</span></td>
                                <td className="px-4 py-3">
                                    <p className="text-sm" style={{ color: 'var(--lp-text-secondary)' }}>{inv.user?.name || '—'}</p>
                                    <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>{inv.user?.email}</p>
                                </td>
                                <td className="px-4 py-3 text-sm" style={{ color: 'var(--lp-text-secondary)' }}>{inv.description}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${inv.type === 'TOKEN_PURCHASE' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
                                        {typeLabels[inv.type] || inv.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-semibold text-emerald-400">€{inv.amount?.toFixed(2)}</td>
                                <td className="px-4 py-3 text-xs" style={{ color: 'var(--lp-text-muted)' }}>{new Date(inv.createdAt).toLocaleDateString('hr-HR')}</td>
                                <td className="px-4 py-3">
                                    {inv.pdfUrl ? (
                                        <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-emerald-500/15 transition-colors inline-flex" style={{ color: 'var(--lp-text-muted)' }}>
                                            <Download size={14} />
                                        </a>
                                    ) : <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>—</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
}
