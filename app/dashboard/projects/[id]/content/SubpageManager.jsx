"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { FileText, Plus, Loader2, Check, RefreshCw, Trash2, Coins, Sparkles, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateSubpageAction, generateCustomSubpageAction, deleteSubpageAction } from "@/app/actions/generate-subpage";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/dashboard/components/ToastProvider";
import { ExtendedWaitBanner } from "@/app/dashboard/components/ExtendedWaitMessages";

// ─── Predefined subpages ─────────────────────────────────────────────────────
const SUBPAGES = [
    { slug: 'o-nama', label: 'O nama', description: 'Priča o vašem poslovanju, misija i vrijednosti', icon: '👥' },
    { slug: 'usluge', label: 'Usluge', description: 'Detaljne kartice usluga, cjenik, FAQ', icon: '⚙️' },
    { slug: 'kontakt', label: 'Kontakt', description: 'Kontakt forma, mapa, radno vrijeme', icon: '📧' },
];

// ─── Section catalog for custom subpages ─────────────────────────────────────
const SECTION_CATALOG = [
    { id: 'hero', label: 'Hero sekcija', icon: '🎯', desc: 'Naslov, podnaslov i CTA gumb' },
    { id: 'features', label: 'Značajke', icon: '⭐', desc: 'Kartice s ikonama i opisima' },
    { id: 'pricing', label: 'Cjenik / Paketi', icon: '💰', desc: 'Usporedba cjenovnih paketa' },
    { id: 'gallery', label: 'Galerija', icon: '📸', desc: 'Mreža slika i portflio' },
    { id: 'team', label: 'Naš tim', icon: '👥', desc: 'Kartice članova tima' },
    { id: 'faq', label: 'Česta pitanja', icon: '❓', desc: 'Harmonika s pitanjima i odgovorima' },
    { id: 'testimonials', label: 'Recenzije', icon: '💬', desc: 'Citati i ocjene klijenata' },
    { id: 'stats', label: 'Statistika', icon: '📊', desc: 'Brojke i postignuća' },
    { id: 'contact_form', label: 'Kontakt forma', icon: '📧', desc: 'Forma za poruke i upite' },
    { id: 'cta', label: 'Poziv na akciju', icon: '🚀', desc: 'Završni CTA blok s naglaskom' },
    { id: 'process', label: 'Kako radimo', icon: '📋', desc: '3-5 koraka procesa rada' },
    { id: 'case_studies', label: 'Studije slučaja', icon: '💼', desc: 'Projekti i rezultati (ROI)' },
    { id: 'text_block', label: 'Tekstualni blok', icon: '📄', desc: 'Dugi tekst za pravne stranice' },
    { id: 'map_location', label: 'Mapa i lokacija', icon: '📍', desc: 'Google Maps + adresa' },
    { id: 'before_after', label: 'Prije / Poslije', icon: '🔄', desc: 'Usporedba transformacija' },
    { id: 'booking', label: 'Rezervacija', icon: '📅', desc: 'Forma za rezervacije termina' },
    { id: 'logo_cloud', label: 'Logo Cloud', icon: '🏢', desc: 'Logotipi partnera i klijenata' },
];

// ─── Smart template matching ─────────────────────────────────────────────────
const SUBPAGE_TEMPLATES = [
    { keywords: ['cjenik', 'pricing', 'paketi', 'cijene', 'cijena'], sections: ['hero', 'pricing', 'features', 'faq', 'cta'] },
    { keywords: ['galerija', 'portfolio', 'radovi', 'slike', 'fotograf'], sections: ['hero', 'gallery', 'before_after', 'testimonials', 'cta'] },
    { keywords: ['tim', 'stručnjaci', 'team', 'zaposlenici', 'ekipa'], sections: ['hero', 'team', 'stats', 'cta'] },
    { keywords: ['faq', 'pitanja', 'podrška', 'pomoć', 'support'], sections: ['hero', 'faq', 'contact_form'] },
    { keywords: ['recenzije', 'iskustva', 'testimonials', 'mišljenja', 'ocjene'], sections: ['hero', 'stats', 'testimonials', 'logo_cloud', 'cta'] },
    { keywords: ['projekti', 'case', 'studije', 'referenc'], sections: ['hero', 'case_studies', 'testimonials', 'cta'] },
    { keywords: ['rezervacij', 'booking', 'naruč', 'termin', 'zakaž'], sections: ['hero', 'process', 'booking', 'map_location'] },
    { keywords: ['pravne', 'privatnost', 'uvjeti', 'terms', 'privacy', 'politika'], sections: ['text_block'] },
    { keywords: ['karijere', 'posao', 'prijava', 'zapošljavanje'], sections: ['hero', 'features', 'team', 'contact_form', 'cta'] },
    { keywords: ['blog', 'vijesti', 'novosti', 'članci'], sections: ['hero', 'features', 'cta'] },
];

function getSuggestedSections(title) {
    if (!title || title.length < 2) return ['hero', 'features', 'cta'];
    const lower = title.toLowerCase();
    for (const template of SUBPAGE_TEMPLATES) {
        if (template.keywords.some(kw => lower.includes(kw))) {
            return template.sections;
        }
    }
    return ['hero', 'features', 'cta']; // default
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/č/g, 'c').replace(/ć/g, 'c').replace(/š/g, 's')
        .replace(/ž/g, 'z').replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// ─── Loader overlay ──────────────────────────────────────────────────────────
const SUBPAGE_PHASES = [
    { from: 0, label: "Čitanje dizajna naslovne...", icon: "📄" },
    { from: 8, label: "Webica AI generira sadržaj...", icon: "✍️" },
    { from: 30, label: "Usklađivanje i spremanje...", icon: "🎨" },
    { from: 55, label: "Koristi se jači AI model...", icon: "🚀" },
];

function SubpageGeneratingOverlay({ seconds, pageName }) {
    const phase = [...SUBPAGE_PHASES].reverse().find(p => seconds >= p.from) || SUBPAGE_PHASES[0];
    const progress = Math.min(97, 80 * (1 - Math.exp(-seconds / 35)));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
                style={{ background: 'var(--lp-bg-alt)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div className="px-6 pt-6 pb-4 text-center">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                        <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'rgba(139,92,246,0.15)' }} />
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#a78bfa' }} />
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--lp-heading)' }}>Generiranje: {pageName}</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--lp-text-muted)' }}>Podstranica se kreira prema dizajnu naslovne</p>
                </div>
                <div className="mx-6 mb-4 rounded-2xl px-5 py-3 flex items-center justify-between" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                    <div className="flex items-center gap-2.5">
                        <motion.span key={phase.icon} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-xl">{phase.icon}</motion.span>
                        <motion.p key={phase.label} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="text-xs font-medium" style={{ color: 'var(--lp-text-secondary)' }}>{phase.label}</motion.p>
                    </div>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: '#a78bfa' }}>{seconds}s</p>
                </div>
                <div className="mx-6 mb-4">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--lp-surface)' }}>
                        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} initial={{ width: '0%' }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'linear' }} />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px]" style={{ color: 'var(--lp-text-muted)' }}>Generiranje u tijeku</span>
                        <span className="text-[10px]" style={{ color: 'var(--lp-text-muted)' }}>{seconds > 55 ? 'Koristi se jači model...' : '~50s prosječno'}</span>
                    </div>
                </div>
                <div className="mx-6 mb-4 space-y-1.5">
                    {SUBPAGE_PHASES.map((p, i) => {
                        const isDone = seconds > p.from + 8;
                        const isActive = phase.from === p.from;
                        return (
                            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                                style={{ background: isActive ? 'rgba(139,92,246,0.08)' : isDone ? 'rgba(139,92,246,0.05)' : 'transparent', border: isActive ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent' }}>
                                <span className="text-sm w-5 text-center flex-shrink-0">{isDone ? '✅' : isActive ? '⏳' : '○'}</span>
                                <span className="text-xs" style={{ color: isActive ? 'var(--lp-heading)' : isDone ? 'var(--lp-text-secondary)' : 'var(--lp-text-muted)' }}>{p.label}</span>
                            </div>
                        );
                    })}
                </div>
                <ExtendedWaitBanner seconds={seconds} showAfterSeconds={55} accentColor="#a78bfa" />

                <div className="mx-6 mb-6 flex items-start gap-2.5 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                    <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
                    <p className="text-xs font-medium" style={{ color: '#fbbf24' }}>
                        <strong>Ne zatvaraj stranicu!</strong> Generiranje je u tijeku.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SubpageManager({ project }) {
    const [generatingSlug, setGeneratingSlug] = useState(null);
    const [generatingName, setGeneratingName] = useState('');
    const [seconds, setSeconds] = useState(0);
    const [regenConfirm, setRegenConfirm] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const timerRef = useRef(null);
    const router = useRouter();
    const toast = useToast();

    // Custom subpage creator state
    const [showCreator, setShowCreator] = useState(false);
    const [customTitle, setCustomTitle] = useState('');
    const [selectedSections, setSelectedSections] = useState(new Set(['hero', 'features', 'cta']));

    const existingSubpages = project.reactFiles || {};
    const customSubpagesMeta = (project.contentData?._customSubpages) || {};

    // Smart section suggestions based on title
    useEffect(() => {
        if (!customTitle) return;
        const timer = setTimeout(() => {
            const suggested = getSuggestedSections(customTitle);
            setSelectedSections(new Set(suggested));
        }, 300);
        return () => clearTimeout(timer);
    }, [customTitle]);

    const customSlug = useMemo(() => slugify(customTitle), [customTitle]);

    // Check if slug conflicts
    const slugConflict = useMemo(() => {
        if (!customSlug) return false;
        return SUBPAGES.some(p => p.slug === customSlug) || !!existingSubpages[customSlug];
    }, [customSlug, existingSubpages]);

    const handleGenerate = async (slug, label) => {
        setGeneratingSlug(slug);
        setGeneratingName(label);
        setSeconds(0);
        timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);

        try {
            const result = await generateSubpageAction(project.id, slug);
            clearInterval(timerRef.current);
            if (result.error) {
                toast.error(result.error);
                setGeneratingSlug(null);
                return;
            }
            router.refresh();
            toast.success(`${label} stranica je generirana!`);
            setGeneratingSlug(null);
        } catch {
            clearInterval(timerRef.current);
            toast.error("Neočekivana greška. Pokušajte ponovno.");
            setGeneratingSlug(null);
        }
    };

    const handleGenerateCustom = async () => {
        if (!customTitle.trim() || !customSlug || selectedSections.size === 0) {
            toast.error('Unesite naslov i odaberite barem jednu sekciju.');
            return;
        }
        if (slugConflict) {
            toast.error('Podstranica s ovim URL-om već postoji.');
            return;
        }

        setGeneratingSlug(customSlug);
        setGeneratingName(customTitle);
        setSeconds(0);
        timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);

        try {
            const result = await generateCustomSubpageAction(project.id, {
                title: customTitle,
                slug: customSlug,
                sections: Array.from(selectedSections),
            });
            clearInterval(timerRef.current);
            if (result.error) {
                toast.error(result.error);
                setGeneratingSlug(null);
                return;
            }
            router.refresh();
            toast.success(`"${customTitle}" stranica je generirana!`);
            setGeneratingSlug(null);
            setShowCreator(false);
            setCustomTitle('');
            setSelectedSections(new Set(['hero', 'features', 'cta']));
        } catch {
            clearInterval(timerRef.current);
            toast.error("Neočekivana greška. Pokušajte ponovno.");
            setGeneratingSlug(null);
        }
    };

    const handleDelete = async (slug) => {
        try {
            const result = await deleteSubpageAction(project.id, slug);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            router.refresh();
            toast.success('Podstranica je obrisana.');
            setDeleteConfirm(null);
        } catch {
            toast.error("Greška pri brisanju.");
        }
    };

    const toggleSection = (id) => {
        setSelectedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // Get list of custom subpages
    const customSubpagesList = Object.entries(customSubpagesMeta).map(([slug, meta]) => ({
        slug,
        ...(meta),
    }));

    return (
        <>
            {generatingSlug && (
                <SubpageGeneratingOverlay
                    seconds={seconds}
                    pageName={generatingName}
                />
            )}

            {/* ─── Predefined Subpages ─── */}
            <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                <div className="flex items-center gap-2.5 mb-4">
                    <FileText size={18} style={{ color: '#a78bfa' }} />
                    <h3 className="font-bold text-sm" style={{ color: 'var(--lp-heading)' }}>Podstranice</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>Advanced</span>
                </div>
                <p className="text-xs mb-4" style={{ color: 'var(--lp-text-muted)' }}>
                    Odaberite koje podstranice želite za vašu web stranicu. Svaka se generira zasebno prema dizajnu naslovne.
                </p>

                <div className="space-y-2.5">
                    {SUBPAGES.map(page => {
                        const isGenerated = !!existingSubpages[page.slug];
                        const isGenerating = generatingSlug === page.slug;

                        return (
                            <div key={page.slug}
                                className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl transition-all"
                                style={{
                                    background: isGenerated ? 'rgba(34,197,94,0.05)' : 'var(--lp-bg)',
                                    border: isGenerated ? '1px solid rgba(34,197,94,0.15)' : '1px solid var(--lp-border)'
                                }}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-xl flex-shrink-0">{page.icon}</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold" style={{ color: 'var(--lp-heading)' }}>{page.label}</p>
                                        <p className="text-[11px] truncate" style={{ color: 'var(--lp-text-muted)' }}>{page.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {isGenerated ? (
                                        <>
                                            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>
                                                <Check size={12} /> Gotovo
                                            </span>
                                            <button
                                                onClick={() => setRegenConfirm({ slug: page.slug, label: page.label })}
                                                disabled={!!generatingSlug}
                                                className="p-1.5 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-40"
                                                title="Regeneriraj"
                                            >
                                                <RefreshCw size={14} style={{ color: 'var(--lp-text-muted)' }} />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleGenerate(page.slug, page.label)}
                                            disabled={!!generatingSlug}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-40"
                                            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}
                                        >
                                            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                            Generiraj
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Custom generated subpages */}
                {customSubpagesList.length > 0 && (
                    <div className="mt-4 pt-4 space-y-2.5" style={{ borderTop: '1px solid var(--lp-border)' }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--lp-text-muted)' }}>Vaše podstranice</p>
                        {customSubpagesList.map(page => {
                            const isGenerated = !!existingSubpages[page.slug];
                            return (
                                <div key={page.slug}
                                    className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
                                    style={{
                                        background: 'rgba(139,92,246,0.04)',
                                        border: '1px solid rgba(139,92,246,0.12)'
                                    }}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-xl flex-shrink-0">✨</span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold" style={{ color: 'var(--lp-heading)' }}>{page.title}</p>
                                            <p className="text-[11px] truncate" style={{ color: 'var(--lp-text-muted)' }}>/{page.slug} • {page.sections?.length || 0} sekcija</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {isGenerated && (
                                            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>
                                                <Check size={12} /> Gotovo
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setRegenConfirm({ slug: page.slug, label: page.title, isCustom: true })}
                                            disabled={!!generatingSlug}
                                            className="p-1.5 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-40"
                                            title="Regeneriraj"
                                        >
                                            <RefreshCw size={14} style={{ color: 'var(--lp-text-muted)' }} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm({ slug: page.slug, title: page.title })}
                                            disabled={!!generatingSlug}
                                            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 disabled:opacity-40"
                                            title="Obriši"
                                        >
                                            <Trash2 size={14} style={{ color: 'var(--lp-text-muted)' }} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── Custom Subpage Creator ─── */}
            <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                <button
                    type="button"
                    onClick={() => setShowCreator(!showCreator)}
                    className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.02]"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <Sparkles size={16} style={{ color: '#a78bfa' }} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold" style={{ color: 'var(--lp-heading)' }}>Kreiraj vlastitu podstranicu</h3>
                            <p className="text-[11px]" style={{ color: 'var(--lp-text-muted)' }}>Odaberite naslov i sekcije — AI generira stranicu po mjeri</p>
                        </div>
                    </div>
                    <motion.div animate={{ rotate: showCreator ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={16} style={{ color: 'var(--lp-text-muted)' }} />
                    </motion.div>
                </button>

                <AnimatePresence>
                    {showCreator && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--lp-border)' }}>
                                {/* Title input */}
                                <div className="pt-4 space-y-1.5">
                                    <label className="text-xs font-semibold" style={{ color: 'var(--lp-text-secondary)' }}>Naslov podstranice</label>
                                    <input
                                        type="text"
                                        value={customTitle}
                                        onChange={e => setCustomTitle(e.target.value)}
                                        placeholder="npr. Cjenik, Galerija, Naš Tim, Rezervacije..."
                                        className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                                        style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }}
                                    />
                                    {customSlug && (
                                        <p className="text-[11px] flex items-center gap-1" style={{ color: slugConflict ? '#f87171' : 'var(--lp-text-muted)' }}>
                                            URL: /{customSlug}
                                            {slugConflict && <span className="text-red-400 font-medium"> — već postoji!</span>}
                                        </p>
                                    )}
                                </div>

                                {/* AI suggestion hint */}
                                {customTitle.length >= 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                        style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}
                                    >
                                        <Sparkles size={12} style={{ color: '#a78bfa' }} />
                                        <p className="text-[11px]" style={{ color: '#a78bfa' }}>
                                            Sekcije su preporučene na temelju naslova. Možete ih prilagoditi.
                                        </p>
                                    </motion.div>
                                )}

                                {/* Section picker grid */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold" style={{ color: 'var(--lp-text-secondary)' }}>
                                        Odaberite sekcije ({selectedSections.size} odabrano)
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {SECTION_CATALOG.map(section => {
                                            const isSelected = selectedSections.has(section.id);
                                            return (
                                                <button
                                                    key={section.id}
                                                    type="button"
                                                    onClick={() => toggleSection(section.id)}
                                                    className="flex items-start gap-2.5 p-3 rounded-xl text-left transition-all hover:scale-[1.02]"
                                                    style={{
                                                        background: isSelected ? 'rgba(139,92,246,0.08)' : 'var(--lp-bg)',
                                                        border: isSelected ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--lp-border)',
                                                    }}
                                                >
                                                    <span className="text-lg flex-shrink-0 mt-0.5">{section.icon}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold leading-tight" style={{ color: isSelected ? '#c4b5fd' : 'var(--lp-heading)' }}>
                                                            {section.label}
                                                        </p>
                                                        <p className="text-[10px] leading-tight mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>
                                                            {section.desc}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#a78bfa' }} />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Generate button */}
                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-[11px]" style={{ color: 'var(--lp-text-muted)' }}>
                                        {selectedSections.size === 0 ? 'Odaberite barem jednu sekciju' : `${selectedSections.size} sekcija odabrano`}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleGenerateCustom}
                                        disabled={!customTitle.trim() || selectedSections.size === 0 || slugConflict || !!generatingSlug}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.03] disabled:opacity-40 disabled:hover:scale-100"
                                        style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff' }}
                                    >
                                        <Sparkles size={14} />
                                        Generiraj podstranicu
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── Regeneration confirmation modal ─── */}
            {regenConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                    <div className="rounded-2xl max-w-sm w-full p-6" style={{ background: 'var(--lp-bg-alt)', border: '1px solid var(--lp-border)' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <RefreshCw size={18} style={{ color: '#a78bfa' }} />
                            <h3 className="font-bold text-sm" style={{ color: 'var(--lp-heading)' }}>Regeneriraj: {regenConfirm.label}</h3>
                        </div>
                        <div className="space-y-2 mb-4">
                            <p className="text-xs" style={{ color: 'var(--lp-text-secondary)' }}>
                                Regeneriranjem će se postojeća <strong>{regenConfirm.label}</strong> stranica zamijeniti potpuno novom verzijom.
                            </p>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)' }}>
                                <Coins size={14} style={{ color: '#fbbf24' }} />
                                <p className="text-xs font-medium" style={{ color: '#fbbf24' }}>
                                    Regeneriranje košta 500 tokena
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const { slug, label, isCustom } = regenConfirm;
                                    setRegenConfirm(null);
                                    if (isCustom) {
                                        const meta = customSubpagesMeta[slug];
                                        if (meta) {
                                            setGeneratingSlug(slug);
                                            setGeneratingName(meta.title);
                                            setSeconds(0);
                                            timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
                                            generateCustomSubpageAction(project.id, {
                                                title: meta.title,
                                                slug,
                                                sections: meta.sections || ['hero', 'features', 'cta'],
                                            }).then(result => {
                                                clearInterval(timerRef.current);
                                                if (result.error) toast.error(result.error);
                                                else { router.refresh(); toast.success(`"${meta.title}" regenerirana!`); }
                                                setGeneratingSlug(null);
                                            }).catch(() => {
                                                clearInterval(timerRef.current);
                                                toast.error("Greška pri regeneriranju.");
                                                setGeneratingSlug(null);
                                            });
                                        }
                                    } else {
                                        handleGenerate(slug, label);
                                    }
                                }}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl transition-all"
                                style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}
                            >
                                <RefreshCw size={12} />
                                Regeneriraj (500 tokena)
                            </button>
                            <button
                                onClick={() => { setRegenConfirm(null); }}
                                className="px-4 py-2 text-xs font-medium rounded-xl transition-colors"
                                style={{ color: 'var(--lp-text-muted)' }}
                            >
                                Odustani
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Delete confirmation modal ─── */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                    <div className="rounded-2xl max-w-sm w-full p-6" style={{ background: 'var(--lp-bg-alt)', border: '1px solid var(--lp-border)' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <Trash2 size={18} style={{ color: '#f87171' }} />
                            <h3 className="font-bold text-sm" style={{ color: 'var(--lp-heading)' }}>Obriši: {deleteConfirm.title}</h3>
                        </div>
                        <p className="text-xs mb-4" style={{ color: 'var(--lp-text-secondary)' }}>
                            Jeste li sigurni da želite obrisati podstranicu <strong>"{deleteConfirm.title}"</strong>? Ova akcija se ne može poništiti.
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleDelete(deleteConfirm.slug)}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl transition-all"
                                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                            >
                                <Trash2 size={12} />
                                Obriši
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-xs font-medium rounded-xl transition-colors"
                                style={{ color: 'var(--lp-text-muted)' }}
                            >
                                Odustani
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
