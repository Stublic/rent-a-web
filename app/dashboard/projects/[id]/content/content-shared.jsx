"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Upload, Trash2, Plus, Palette, Image, ChevronDown, X, FolderOpen, Phone, Mail, MessageCircle, ExternalLink, Eye } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
export const CTA_TYPES = [
    { value: 'contact', label: 'Kontakt forma', icon: Mail, desc: 'Šalje na kontakt sekciju' },
    { value: 'phone', label: 'Poziv telefon', icon: Phone, desc: 'Poziva vaš broj' },
    { value: 'email', label: 'Pošalji email', icon: Mail, desc: 'Otvara email klijent' },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, desc: 'Otvara WhatsApp chat' },
    { value: 'link', label: 'Custom link', icon: ExternalLink, desc: 'PDF, vanjska stranica...' },
];

export const COLOR_PRESETS = [
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
    '#f97316', '#f59e0b', '#eab308', '#84cc16',
];

export const DAYS = ['Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota', 'Nedjelja'];

export const DEFAULT_HOURS = DAYS.map(day => ({
    day,
    from: '',
    to: '',
    closed: true
}));

// ─── Media Picker Modal ────────────────────────────────────────────────────────
export function MediaPickerModal({ onSelect, onClose }) {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const res = await fetch('/api/media');
                const data = await res.json();
                if (data.media) setMedia(data.media.filter(m => m.type.startsWith('image/')));
            } catch (err) { console.error("Failed to fetch media", err); }
            finally { setLoading(false); }
        };
        fetchMedia();
    }, []);

    const filtered = search ? media.filter(m => m.filename.toLowerCase().includes(search.toLowerCase())) : media;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl" style={{ background: 'var(--lp-bg-alt)', border: '1px solid var(--lp-border)' }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                    <div>
                        <h3 className="text-base font-bold" style={{ color: 'var(--lp-heading)' }}>Media Knjižnica</h3>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>Odaberite sliku iz vaše knjižnice</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><X size={18} style={{ color: 'var(--lp-text-muted)' }} /></button>
                </div>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Pretraži po nazivu..."
                        className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                        style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--lp-text-muted)' }} /></div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {filtered.map(item => (
                                <button key={item.id} type="button" onClick={() => onSelect(item.url)}
                                    className="group relative aspect-square rounded-xl overflow-hidden border-2 hover:border-emerald-500 transition-all focus:outline-none"
                                    style={{ borderColor: 'var(--lp-border)' }}>
                                    <img src={item.url} alt={item.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                                        <div className="w-full p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white text-xs truncate font-medium">{item.filename}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <Image size={28} className="mx-auto mb-3" style={{ color: 'var(--lp-text-muted)' }} />
                            <p className="text-sm font-medium" style={{ color: 'var(--lp-text-muted)' }}>{search ? "Nema rezultata" : "Nema uploadanih slika"}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--lp-text-muted)' }}>{search ? "Pokušajte s drugim pojmom" : "Idite na Media tab da uploadate slike"}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── CTA Selector ─────────────────────────────────────────────────────────────
export function CtaSelector({ prefix, register, watch, setValue }) {
    const ctaType = watch(`${prefix}.type`) || 'contact';
    return (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--lp-text-muted)' }}>CTA Gumb</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {CTA_TYPES.map(cta => {
                    const Icon = cta.icon;
                    return (
                        <button key={cta.value} type="button" onClick={() => setValue(`${prefix}.type`, cta.value)}
                            className={`p-2.5 rounded-lg text-left transition-all ${ctaType === cta.value ? 'border-emerald-500 bg-emerald-500/10' : 'hover:bg-white/5'}`}
                            style={{ border: ctaType === cta.value ? '1px solid rgb(52,211,153)' : '1px solid var(--lp-border)', color: ctaType === cta.value ? 'var(--lp-heading)' : 'var(--lp-text-muted)' }}>
                            <Icon size={14} className={ctaType === cta.value ? 'text-emerald-400' : ''} style={ctaType !== cta.value ? { color: 'var(--lp-text-muted)' } : {}} />
                            <p className="text-xs font-medium mt-1.5 leading-tight">{cta.label}</p>
                        </button>
                    );
                })}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Tekst gumba</label>
                    <input {...register(`${prefix}.label`)} placeholder="npr. Kontaktirajte nas"
                        className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                        style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                </div>
                {ctaType === 'link' && (
                    <div className="space-y-1">
                        <label className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>URL / Poveznica</label>
                        <input {...register(`${prefix}.url`)} placeholder="https://..."
                            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                            style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Color Picker ─────────────────────────────────────────────────────────────
export function ColorPickerField({ label, value, onChange, presets = COLOR_PRESETS }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--lp-text-secondary)' }}>{label}</label>
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ backgroundColor: value || '#000000', border: '2px solid var(--lp-border)' }} />
                <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
                    className="rounded-lg px-3 py-2 w-28 text-sm font-mono uppercase focus:outline-none focus:ring-1 focus:ring-white/20"
                    style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} placeholder="#000000" />
            </div>
            <div className="flex flex-wrap gap-1.5">
                {presets.map(color => (
                    <button key={color} type="button" onClick={() => onChange(color)}
                        className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${value === color ? 'scale-110 shadow-lg' : ''}`}
                        style={{ backgroundColor: color, borderColor: value === color ? 'white' : 'var(--lp-border)' }} />
                ))}
            </div>
        </div>
    );
}

// ─── Section Hint ─────────────────────────────────────────────────────────────
export function SectionHint({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-xs"
            style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', color: '#a5b4fc' }}
        >
            <Eye size={13} className="flex-shrink-0 mt-0.5" />
            <span>{children}</span>
        </motion.div>
    );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
export function Section({ number, icon, title, subtitle, hint, accentColor, children, collapsible = false, defaultOpen = true, onRemove }) {
    const [open, setOpen] = useState(defaultOpen);
    const accent = accentColor || 'var(--lp-heading)';
    return (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--lp-bg-alt)', border: '1px solid var(--lp-border)' }}>
            <div className="w-full flex items-center justify-between"
                style={{ padding: '18px 20px' }}>
                <button type="button" onClick={collapsible ? () => setOpen(!open) : undefined}
                    className={`flex items-center gap-3 flex-1 ${collapsible ? 'hover:bg-white/[0.025] cursor-pointer' : 'cursor-default'} transition-colors`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}>
                        {number || icon}
                    </div>
                    <div className="text-left">
                        <h2 className="text-sm sm:text-base font-bold" style={{ color: 'var(--lp-heading)' }}>{title}</h2>
                        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>{subtitle}</p>}
                    </div>
                </button>
                <div className="flex items-center gap-2">
                    {collapsible && (
                        <motion.button type="button" onClick={() => setOpen(!open)} animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
                            className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                            <ChevronDown size={16} style={{ color: 'var(--lp-text-muted)' }} />
                        </motion.button>
                    )}
                    {onRemove && (
                        <button type="button" onClick={onRemove} title="Ukloni sekciju"
                            className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors group">
                            <X size={14} className="text-zinc-600 group-hover:text-red-400 transition-colors" />
                        </button>
                    )}
                </div>
            </div>
            <AnimatePresence initial={false}>
                {(!collapsible || open) && (
                    <motion.div key="content"
                        initial={collapsible ? { height: 0, opacity: 0 } : false}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}>
                        <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--lp-border)' }}>
                            {hint && <div className="pt-4"><SectionHint>{hint}</SectionHint></div>}
                            <div className={hint ? '' : 'pt-4'}>{children}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
