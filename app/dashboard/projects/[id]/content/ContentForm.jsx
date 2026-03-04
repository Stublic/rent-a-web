"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentSchema } from "@/lib/schemas";
import { uploadImageAction, generateWebsiteAction } from "@/app/actions/content-generator";
import { generateAdvancedWebsiteAction } from "@/app/actions/advanced-generator";
import { saveContentAction } from "@/app/actions/save-content";
import { updateContentAction } from "@/app/actions/update-content";
import {
    Loader2, Upload, Trash2, Plus, Sparkles, Image,
    FolderOpen, Phone, Mail, MapPin, X, Check, Clock,
    Star, HelpCircle, Images, DollarSign, Globe, Share2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ExtendedWaitBanner } from "@/app/dashboard/components/ExtendedWaitMessages";
import SuccessCelebration from "@/app/dashboard/components/SuccessCelebration";
import IndustryPicker from "./IndustryPicker";
import InfoTooltip from "@/components/InfoTooltip";
import ColorPaletteSection from "./ColorPaletteSection";
import TypographySection from "./TypographySection";

import {
    Section, SectionHint, CtaSelector,
    MediaPickerModal, DEFAULT_HOURS
} from "./content-shared";
import {
    WorkingHoursSection, SocialLinksSection,
    TestimonialsSection, FaqSection, GallerySection, PricingSection
} from "./CollapsibleSections";

// ─── Services Section ─────────────────────────────────────────────────────────
function ServicesSection({ control, register, watch, setValue, setMediaPickerField, onRemove }) {
    const { fields, append, remove } = useFieldArray({ control, name: "services" });

    const ImageUploadBox = ({ field, label, currentUrl }) => (
        <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--db-text-secondary)' }}>
                <Image size={14} style={{ color: 'var(--db-text-muted)' }} />{label}
            </label>
            <div className="border-2 border-dashed rounded-xl p-4 hover:border-emerald-500/40 transition-all group relative"
                style={{ borderColor: 'var(--db-border)', background: 'var(--db-surface)' }}>
                {currentUrl ? (
                    <div className="relative">
                        <img src={currentUrl} alt={label} className="w-full h-28 object-cover rounded-lg" />
                        <button type="button" onClick={() => setValue(field, "")} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-lg"><Trash2 size={12} /></button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload size={20} className="transition-colors group-hover:text-emerald-500" style={{ color: 'var(--db-text-muted)' }} />
                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-white/5"
                                style={{ background: 'var(--db-bg)', color: 'var(--db-text-secondary)', border: '1px solid var(--db-border)' }}>
                                Prenesi
                                <input type="file" onChange={async e => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const fd = new FormData(); fd.append("file", file);
                                    try {
                                        const url = await uploadImageAction(fd);
                                        setValue(field, url);
                                        // Auto-save to media library
                                        const mfd = new FormData(); mfd.append('file', file);
                                        if (project?.id) mfd.append('projectId', project.id);
                                        fetch('/api/media', { method: 'POST', body: mfd }).catch(() => {});
                                    } catch {}
                                }} className="hidden" accept="image/*" />
                            </label>
                            <button type="button" onClick={() => setMediaPickerField(field)}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                                style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                                <FolderOpen size={11} />Knjižnica
                            </button>
                        </div>
                        <p className="text-[11px]" style={{ color: 'var(--db-text-muted)' }}>Ili pozostavi prazno za auto-odabir</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <Section number="3" title="Usluge / Proizvodi" accentColor="#22c55e"
            onRemove={onRemove}
            hint="Svaka usluga prikazuje se kao kartica s naslovom, opisom, slikom i CTA gumbom. Dodajte barem 3 za bolji izgled.">
            <div className="flex justify-end">
                <button type="button" onClick={() => append({ name: "", description: "", imageUrl: "", cta: null })}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <Plus size={15} />Dodaj uslugu
                </button>
            </div>
            {fields.length === 0 ? (
                <button type="button" onClick={() => append({ name: "", description: "", imageUrl: "", cta: null })}
                    className="w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-2"
                    style={{ borderColor: 'rgba(34,197,94,0.2)', color: 'var(--db-text-muted)' }}>
                    <Plus size={20} style={{ color: '#4ade80' }} />
                    <span className="text-sm font-medium">Dodajte usluge ili proizvode</span>
                    <span className="text-xs">Opcionalno — AI može sam generirati sadržaj</span>
                </button>
            ) : (
                <div className="space-y-4">
                    {fields.map((field, i) => (
                        <div key={field.id} className="rounded-xl p-4 sm:p-5 space-y-4" style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold" style={{ color: 'var(--db-text-muted)' }}>Usluga #{i + 1}</span>
                                <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={15} /></button>
                            </div>
                            <input {...register(`services.${i}.name`)} placeholder="Naziv usluge"
                                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }} />
                            <textarea {...register(`services.${i}.description`)} rows={2} placeholder="Kratak opis (opcionalno)"
                                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                                style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }} />
                            <ImageUploadBox field={`services.${i}.imageUrl`} label="Slika usluge (opcionalno)" currentUrl={watch(`services.${i}.imageUrl`)} />
                            <CtaSelector prefix={`services.${i}.cta`} register={register} watch={watch} setValue={setValue} />
                        </div>
                    ))}
                </div>
            )}
        </Section>
    );
}

// ─── Updating Overlay ────────────────────────────────────────────────────────
const UPDATE_PHASES = [
    { from: 0,  label: "Analiziranje promjena u sadržaju...",          icon: "🔍" },
    { from: 10, label: "Webica AI piše novi HTML...",                  icon: "✍️" },
    { from: 30, label: "Optimizacija i provjera koda...",              icon: "🔧" },
    { from: 50, label: "Spremanje na server...",                       icon: "💾" },
];

function UpdatingOverlay({ seconds }) {
    const phase = [...UPDATE_PHASES].reverse().find(p => seconds >= p.from) || UPDATE_PHASES[0];
    // Slow logarithmic progress: reaches ~80% at 60s, ~90% at 120s, caps at 97%
    const progress = Math.min(97, 80 * (1 - Math.exp(-seconds / 50)));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(12px)' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
                style={{ background: 'var(--db-bg-alt)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 text-center">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                        <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'rgba(59,130,246,0.15)' }} />
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#60a5fa' }} />
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--db-heading)' }}>AI ažurira web stranicu</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--db-text-muted)' }}>Pametno mijenja samo ono što si promijenio/la</p>
                </div>

                {/* Timer */}
                <div className="mx-6 mb-4 rounded-2xl px-5 py-3 flex items-center justify-between" style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}>
                    <div className="flex items-center gap-2.5">
                        <motion.span
                            key={phase.icon}
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-xl"
                        >{phase.icon}</motion.span>
                        <motion.p
                            key={phase.label}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-xs font-medium"
                            style={{ color: 'var(--db-text-secondary)' }}
                        >{phase.label}</motion.p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-2xl font-bold tabular-nums" style={{ color: '#60a5fa' }}>{seconds}s</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mx-6 mb-4">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--db-surface)' }}>
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: 'linear' }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>Obrada u tijeku</span>
                        <span className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>{seconds > 180 ? 'Koristi se jači model...' : '~3-5 min prosječno'}</span>
                    </div>
                </div>

                {/* Steps */}
                <div className="mx-6 mb-4 space-y-1.5">
                    {UPDATE_PHASES.map((p, i) => {
                        const isDone = seconds > p.from + 8;
                        const isActive = phase.from === p.from;
                        return (
                            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                                style={{
                                    background: isActive ? 'rgba(59,130,246,0.08)' : isDone ? 'rgba(34,197,94,0.05)' : 'transparent',
                                    border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent'
                                }}>
                                <span className="text-sm w-5 text-center flex-shrink-0">
                                    {isDone ? '✅' : isActive ? '⏳' : '○'}
                                </span>
                                <span className="text-xs" style={{ color: isActive ? 'var(--db-heading)' : isDone ? 'var(--db-text-secondary)' : 'var(--db-text-muted)' }}>
                                    {p.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <ExtendedWaitBanner seconds={seconds} showAfterSeconds={65} accentColor="#60a5fa" />

                {/* Don't refresh warning */}
                <div className="mx-6 mb-6 flex items-start gap-2.5 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                    <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
                    <p className="text-xs font-medium" style={{ color: '#fbbf24' }}>
                        <strong>Ne osvježavaj stranicu!</strong> Ažuriranje je u tijeku — prekidanje može oštetiti sadržaj.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Generating Overlay ──────────────────────────────────────────────────────
const GENERATION_PHASES = [
    { from: 0,  label: "Priprema podataka...",                         icon: "📋" },
    { from: 8,  label: "Webica AI piše HTML kod stranice...",          icon: "✍️" },
    { from: 30, label: "Generiranje slika i optimizacija...",          icon: "🖼️" },
    { from: 55, label: "Završne provjere i spremanje...",              icon: "💾" },
    { from: 80, label: "Koristi se jači AI model...",                  icon: "🚀" },
];

function GeneratingOverlay({ seconds, isAdvanced }) {
    const phases = GENERATION_PHASES;
    const phase = [...phases].reverse().find(p => seconds >= p.from) || phases[0];
    const avgTime = 240; // 4 min average
    // Slow logarithmic progress: adapts to longer waits
    const progress = Math.min(97, 80 * (1 - Math.exp(-seconds / (avgTime * 0.6))));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(12px)' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
                style={{ background: 'var(--db-bg-alt)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 text-center">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                        <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'rgba(34,197,94,0.15)' }} />
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4ade80' }} />
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--db-heading)' }}>✨ Webica AI stvara web stranicu</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--db-text-muted)' }}>Generiranje traje u prosjeku 3–5 minuta.</p>
                </div>

                {/* Timer */}
                <div className="mx-6 mb-4 rounded-2xl px-5 py-3 flex items-center justify-between" style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}>
                    <div className="flex items-center gap-2.5">
                        <motion.span key={phase.icon} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-xl">{phase.icon}</motion.span>
                        <motion.p key={phase.label} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="text-xs font-medium" style={{ color: 'var(--db-text-secondary)' }}>{phase.label}</motion.p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-2xl font-bold tabular-nums" style={{ color: '#4ade80' }}>{seconds}s</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mx-6 mb-4">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--db-surface)' }}>
                        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #22c55e, #4ade80)' }} initial={{ width: '0%' }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'linear' }} />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>Generiranje u tijeku</span>
                        <span className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>{seconds > 180 ? 'Koristi se jači model...' : '~3-5 min prosječno'}</span>
                    </div>
                </div>

                {/* Steps */}
                <div className="mx-6 mb-4 space-y-1.5">
                    {phases.map((p, i) => {
                        const isDone = seconds > p.from + 8;
                        const isActive = phase.from === p.from;
                        return (
                            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                                style={{ background: isActive ? 'rgba(34,197,94,0.08)' : isDone ? 'rgba(34,197,94,0.05)' : 'transparent', border: isActive ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent' }}>
                                <span className="text-sm w-5 text-center flex-shrink-0">{isDone ? '✅' : isActive ? '⏳' : '○'}</span>
                                <span className="text-xs" style={{ color: isActive ? 'var(--db-heading)' : isDone ? 'var(--db-text-secondary)' : 'var(--db-text-muted)' }}>{p.label}</span>
                            </div>
                        );
                    })}
                </div>

                <ExtendedWaitBanner seconds={seconds} showAfterSeconds={avgTime} accentColor="#4ade80" />

                {/* Warning */}
                <div className="mx-6 mb-6 flex items-start gap-2.5 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                    <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
                    <p className="text-xs font-medium" style={{ color: '#fbbf24' }}>
                        <strong>Ne zatvaraj i ne osvježavaj stranicu!</strong> Generiranje je u tijeku — prekidanje može uzrokovati grešku.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Main ContentForm ─────────────────────────────────────────────────────────
export default function ContentForm({ project }) {
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [generatingSeconds, setGeneratingSeconds] = useState(0);
    const generatingTimerRef = useRef(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [uploadError, setUploadError] = useState("");
    const [mediaPickerField, setMediaPickerField] = useState(null);
    const [updatingSeconds, setUpdatingSeconds] = useState(0);
    const updatingTimerRef = useRef(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationSeconds, setCelebrationSeconds] = useState(0);
    const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);
    const router = useRouter();

    const defaults = project.contentData || {
        businessName: "", industry: "", description: "",
        autoColors: true, fontPair: "",
        primaryColor: "", secondaryColor: "", backgroundColor: "", textColor: "",
        heroCta: null,
        logoUrl: "", heroImageUrl: "", aboutImageUrl: "", featuresImageUrl: "", servicesBackgroundUrl: "",
        metaTitle: "", metaDescription: "", metaKeywords: [],
        email: "", phone: "", address: "", mapEmbed: "",
        workingHours: DEFAULT_HOURS,
        services: [],
        testimonials: [], faq: [], gallery: [], pricing: [],
        socialLinks: { facebook: "", instagram: "", linkedin: "", twitter: "" }
    };

    const { register, control, handleSubmit, setValue, watch, getValues, formState: { errors } } = useForm({
        resolver: zodResolver(contentSchema),
        defaultValues: defaults
    });

    // ─── Optional Sections Config ─────────────────────────────────────────────
    const OPTIONAL_SECTIONS = [
        { key: 'services', label: 'Usluge / Proizvodi', icon: <Plus size={18} />, color: '#22c55e', description: 'Kartice s vašim uslugama ili proizvodima', checkFn: (d) => d.services?.length > 0 },
        { key: 'images', label: 'Slike', icon: <Image size={18} />, color: '#06b6d4', description: 'Logo, hero slika i slike sekcija', checkFn: (d) => d.logoUrl || d.heroImageUrl || d.aboutImageUrl },
        { key: 'designRef', label: 'Inspiracija za dizajn', icon: <Globe size={18} />, color: '#8b5cf6', description: 'URL stranice čiji vam se dizajn sviđa', checkFn: (d) => !!d.designReferenceUrl },
        { key: 'heroCta', label: 'Glavni CTA gumb', icon: <Sparkles size={18} />, color: '#f97316', description: 'Glavni gumb u hero sekciji', checkFn: (d) => !!d.heroCta?.label },
        { key: 'workingHours', label: 'Radno vrijeme', icon: <Clock size={18} />, color: '#f59e0b', description: 'Radno vrijeme za kontakt sekciju', checkFn: (d) => d.workingHours?.some(h => !h.closed && h.from) },
        { key: 'socialLinks', label: 'Društvene mreže', icon: <Share2 size={18} />, color: '#06b6d4', description: 'Facebook, Instagram, LinkedIn...', checkFn: (d) => d.socialLinks?.facebook || d.socialLinks?.instagram },
        { key: 'testimonials', label: 'Recenzije', icon: <Star size={18} />, color: '#eab308', description: 'Recenzije i iskustva vaših klijenata', checkFn: (d) => d.testimonials?.length > 0 },
        { key: 'faq', label: 'Česta pitanja (FAQ)', icon: <HelpCircle size={18} />, color: '#8b5cf6', description: 'Odgovori na najčešća pitanja', checkFn: (d) => d.faq?.length > 0 },
        { key: 'gallery', label: 'Galerija', icon: <Images size={18} />, color: '#ec4899', description: 'Portfolio, proizvodi, reference', checkFn: (d) => d.gallery?.length > 0 },
        { key: 'pricing', label: 'Cjenik / Paketi', icon: <DollarSign size={18} />, color: '#f97316', description: 'Paketi usluga s cijenama', checkFn: (d) => d.pricing?.length > 0 },
    ];

    // Track which optional sections are visible + their order
    const [initialState] = useState(() => {
        const d = defaults;
        const active = new Set(['designRef']);
        const order = ['designRef'];
        OPTIONAL_SECTIONS.forEach(s => {
            if (s.checkFn(d) && !active.has(s.key)) {
                active.add(s.key);
                order.push(s.key);
            }
        });
        return { active, order };
    });
    const [activeSections, setActiveSections] = useState(() => initialState.active);
    const [sectionOrder, setSectionOrder] = useState(() => initialState.order);
    const toggleSection = (key) => {
        setActiveSections(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
                setSectionOrder(o => o.filter(k => k !== key));
            } else {
                next.add(key);
                setSectionOrder(o => o.includes(key) ? o : [...o, key]);
            }
            return next;
        });
    };

    // Prefill from /try trial data (only for fresh DRAFT projects)
    useEffect(() => {
        if (project.contentData) return;
        try {
            const trial = JSON.parse(localStorage.getItem('rentaweb_trial') || 'null');
            if (!trial) return;
            if (trial.businessName) setValue('businessName', trial.businessName);
            if (trial.businessDescription) setValue('description', trial.businessDescription);
            // trial.styleKey no longer used (design is AI-controlled now)
            if (trial.generatedHtml) {
                const mailM = trial.generatedHtml.match(/mailto:([\w.%+-]+@[\w.-]+\.[a-z]{2,})/i);
                if (mailM?.[1]) setValue('email', mailM[1]);
                const telM = trial.generatedHtml.match(/tel:([+\d\s()\-]{7,20})/);
                if (telM?.[1]) setValue('phone', telM[1].trim());
            }
        } catch (e) { console.warn('[ContentForm] Could not load trial data:', e); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Detect if this is an Advanced plan
    const isAdvanced = (() => {
        const p = (project.planName || '').toLowerCase();
        return p.includes('advanced') || p.includes('growth');
    })();


    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true); setUploadError("");
        const formData = new FormData(); formData.append("file", file);
        try {
            const url = await uploadImageAction(formData);
            setValue(field, url);
            // Auto-save to media library (fire-and-forget)
            const mfd = new FormData(); mfd.append('file', file);
            if (project?.id) mfd.append('projectId', project.id);
            fetch('/api/media', { method: 'POST', body: mfd }).catch(() => {});
        }
        catch { setUploadError("Upload slike nije uspio. Molimo pokušajte ponovno."); }
        finally { setUploading(false); }
    };

    const ImageUploadBox = ({ field, label, currentUrl }) => (
        <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--db-text-secondary)' }}>
                <Image size={14} style={{ color: 'var(--db-text-muted)' }} />{label}
            </label>
            <div className="border-2 border-dashed rounded-xl p-4 hover:border-emerald-500/40 transition-all group"
                style={{ borderColor: 'var(--db-border)', background: 'var(--db-surface)' }}>
                {currentUrl ? (
                    <div className="relative">
                        <img src={currentUrl} alt={label} className="w-full h-28 object-cover rounded-lg" />
                        <button type="button" onClick={() => setValue(field, "")} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg"><Trash2 size={12} /></button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload size={20} className="group-hover:text-emerald-500 transition-colors" style={{ color: 'var(--db-text-muted)' }} />
                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/5 transition-colors"
                                style={{ background: 'var(--db-bg)', color: 'var(--db-text-secondary)', border: '1px solid var(--db-border)' }}>
                                Prenesi datoteku
                                <input type="file" onChange={e => handleImageUpload(e, field)} className="hidden" accept="image/*" />
                            </label>
                            <button type="button" onClick={() => setMediaPickerField(field)}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                                style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                                <FolderOpen size={11} />Knjižnica
                            </button>
                        </div>
                        <p className="text-[11px]" style={{ color: 'var(--db-text-muted)' }}>Ili ostavi prazno za automatski odabir</p>
                    </div>
                )}
            </div>
        </div>
    );


    const doGenerate = async (data) => {
        setGenerating(true); setErrorMessage("");
        setGeneratingSeconds(0);
        generatingTimerRef.current = setInterval(() => setGeneratingSeconds(s => s + 1), 1000);
        try {
            const result = isAdvanced
                ? await generateAdvancedWebsiteAction(project.id, data)
                : await generateWebsiteAction(project.id, data);
            clearInterval(generatingTimerRef.current);
            if (result.error) {
                setErrorMessage(typeof result.error === 'string' ? result.error : "Greška pri generiranju.");
                setGenerating(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            setCelebrationSeconds(generatingSeconds);
            setGenerating(false);
            setShowCelebration(true);
        } catch {
            clearInterval(generatingTimerRef.current);
            setErrorMessage("Neočekivana greška. Pokušajte ponovno.");
            setGenerating(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // onSubmit now shows a confirmation modal with missing sections
    const onSubmit = async (data) => {
        const missingSections = OPTIONAL_SECTIONS.filter(s => !s.checkFn(data));
        if (missingSections.length > 0 && !showConfirmGenerate) {
            setShowConfirmGenerate(true);
            return;
        }
        setShowConfirmGenerate(false);
        doGenerate(data);
    };

    const onSave = async (data) => {
        const isUpdate = project.hasGenerated;
        if (isUpdate) {
            setUpdating(true);
            setUpdatingSeconds(0);
            updatingTimerRef.current = setInterval(() => setUpdatingSeconds(s => s + 1), 1000);
        } else {
            setSaving(true);
        }
        setErrorMessage("");
        try {
            const result = isUpdate
                ? await updateContentAction(project.id, data)
                : await saveContentAction(project.id, data);
            if (result.error) {
                setErrorMessage(result.error);
                setSaving(false); setUpdating(false); clearInterval(updatingTimerRef.current);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            router.refresh(); setSaving(false); setUpdating(false); clearInterval(updatingTimerRef.current);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            setErrorMessage("Greška pri spremanju.");
            setSaving(false); setUpdating(false); clearInterval(updatingTimerRef.current);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Shared props for sections
    const formProps = { control, register, watch, setValue };

    // react-hook-form validation error handler
    const FIELD_LABELS_HR = {
        businessName: 'Ime biznisa', industry: 'Industrija', description: 'Opis',
        email: 'Email', phone: 'Telefon', primaryColor: 'Primarna boja',
        services: 'Usluge', heroCta: 'CTA gumb'
    };
    const onFormError = (formErrors) => {
        const lines = Object.entries(formErrors).map(([field, err]) => {
            const label = FIELD_LABELS_HR[field] || field;
            const msg = err?.message || err?.root?.message || 'Polje nije ispravno';
            return `${label}: ${msg}`;
        });
        setErrorMessage(lines.join('\n') || 'Podaci forme nisu ispravni.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="w-full pb-8 relative">
            {/* Media picker (non-gallery) */}
            {mediaPickerField && !mediaPickerField.startsWith('__gallery_') && (
                <MediaPickerModal
                    onSelect={url => { setValue(mediaPickerField, url); setMediaPickerField(null); }}
                    onClose={() => setMediaPickerField(null)} />
            )}

            {/* Generating Overlay */}
            {generating && (
                <GeneratingOverlay seconds={generatingSeconds} isAdvanced={isAdvanced} />
            )}

            {/* Updating Overlay */}
            {updating && (
                <UpdatingOverlay seconds={updatingSeconds} />
            )}

            {/* Success Celebration */}
            {showCelebration && (
                <SuccessCelebration
                    seconds={celebrationSeconds}
                    projectId={project.id}
                    onDismiss={() => {
                        setShowCelebration(false);
                        router.refresh();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                />
            )}

            {/* Pre-Generation Confirmation Modal */}
            {showConfirmGenerate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
                        style={{ background: 'var(--db-bg-alt)', border: '1px solid rgba(34,197,94,0.2)' }}
                    >
                        <div className="px-6 pt-6 pb-4">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-lg font-bold" style={{ color: 'var(--db-heading)' }}>
                                    Želite li dodati još informacija?
                                </h3>
                                <button type="button" onClick={() => setShowConfirmGenerate(false)}
                                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                                    <X size={18} style={{ color: 'var(--db-text-muted)' }} />
                                </button>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--db-text-muted)' }}>
                                Više podataka = kvalitetnija web stranica. Ove sekcije još niste dodali:
                            </p>
                        </div>

                        <div className="px-6 pb-4 max-h-[40vh] overflow-y-auto">
                            <div className="space-y-2">
                                {OPTIONAL_SECTIONS.filter(s => !s.checkFn(getValues())).map(section => (
                                    <button
                                        key={section.key}
                                        type="button"
                                        onClick={() => {
                                            toggleSection(section.key);
                                            setShowConfirmGenerate(false);
                                            // Scroll to the section after a short delay
                                            setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
                                        style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}
                                    >
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: `${section.color}15`, color: section.color }}>
                                            {section.icon}
                                        </div>
                                        <div className="text-left flex-1">
                                            <span className="text-xs font-semibold" style={{ color: 'var(--db-heading)' }}>{section.label}</span>
                                            <p className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>{section.description}</p>
                                        </div>
                                        <Plus size={14} style={{ color: section.color }} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="px-6 pb-6 pt-2 space-y-2.5">
                            <button
                                type="button"
                                onClick={() => { setShowConfirmGenerate(false); doGenerate(getValues()); }}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff' }}
                            >
                                <Sparkles size={16} />
                                Generiraj bez dodatnih informacija
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowConfirmGenerate(false)}
                                className="w-full px-6 py-2.5 rounded-xl font-medium text-xs transition-all hover:bg-white/5"
                                style={{ color: 'var(--db-text-muted)' }}
                            >
                                Natrag na uređivanje
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Error messages */}
            {errorMessage && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <h4 className="font-bold text-red-400 mb-1">Greška</h4>
                        {errorMessage.includes('\n') ? (
                            <ul className="text-red-300 text-sm space-y-1 list-none">
                                {errorMessage.split('\n').map((line, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-red-400 mt-0.5">•</span>
                                        <span>{line}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-red-300 text-sm">{errorMessage}</p>
                        )}
                    </div>
                </div>
            )}
            {uploadError && (
                <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-xl">⚠️</span><p className="text-orange-300 text-sm flex-1">{uploadError}</p>
                </div>
            )}

            <motion.form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-4"
                initial="hidden" animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}>

                {/* ── Post-generation info banner ── */}
                {project.hasGenerated && (
                    <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
                        <div className="rounded-2xl p-5 flex items-start gap-3.5"
                            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                            <span className="text-2xl flex-shrink-0 mt-0.5">🔒</span>
                            <div>
                                <h4 className="font-bold text-sm mb-1" style={{ color: '#60a5fa' }}>Stranica je generirana</h4>
                                <p className="text-xs leading-relaxed" style={{ color: 'var(--db-text-secondary)' }}>
                                    Sadržaj, dizajn i sekcije su zaključani nakon prvog generiranja.
                                    Možete uređivati <strong style={{ color: '#60a5fa' }}>kontakt podatke</strong> i dodavati <strong style={{ color: '#60a5fa' }}>podstranice</strong> iznad.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── 1. Basic Info ── */}
                {!project.hasGenerated && (
                <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
                    <Section number="1" title="Osnovne Informacije" accentColor="#e2e8f0"
                        hint="Naziv i opis biznisa pojavljuju se u hero sekciji, naslovu preglednika i meta tagovima.">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" style={{ color: 'var(--db-text-secondary)' }}>Naziv Biznisa</label>
                                <input {...register("businessName")} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                    style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }} placeholder="npr. Rent a webica" />
                                {errors.businessName && <span className="text-red-400 text-xs">{errors.businessName.message}</span>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" style={{ color: 'var(--db-text-secondary)' }}>Industrija</label>
                                <IndustryPicker
                                    value={watch("industry")}
                                    onChange={(val) => setValue("industry", val, { shouldDirty: true })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium" style={{ color: 'var(--db-text-secondary)' }}>Opis Biznisa</label>
                            <textarea {...register("description")} rows={4} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                                style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }}
                                placeholder="Opišite što radite, vaše prednosti i ciljeve..." />
                            {errors.description && <span className="text-red-400 text-xs">{errors.description.message}</span>}
                            <p className="text-[11px] mt-1" style={{ color: 'var(--db-text-muted)' }}>Opišite što radite, za koga i zašto ste posebni. AI koristi ovaj tekst kao osnovu za cijelu stranicu.</p>
                        </div>
                    </Section>
                </motion.div>
                )}

                {/* ── Color Palette ── */}
                {!project.hasGenerated && (
                <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
                    <Section icon="🎨" title="Paleta Boja" accentColor="#8B5CF6"
                        hint="Odaberite paletu boja za vašu stranicu ili prepustite AI-u da odabere idealne boje.">
                        <ColorPaletteSection watch={watch} setValue={setValue} />
                    </Section>
                </motion.div>
                )}

                {/* ── Typography ── */}
                {!project.hasGenerated && (
                <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
                    <Section icon="📝" title="Tipografija" accentColor="#3B82F6"
                        hint="Odaberite kombinaciju fontova za naslove i tekst vaše stranice.">
                        <TypographySection watch={watch} setValue={setValue} />
                    </Section>
                </motion.div>
                )}

                {/* ── Design Reference URL ── */}
                {!project.hasGenerated && (
                <AnimatePresence>
                {activeSections.has('designRef') && (
                <motion.div key="designRef" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                    <Section icon="🎨" title="Inspiracija za Dizajn" accentColor="#8b5cf6"
                        onRemove={() => toggleSection('designRef')}
                        hint="AI će koristiti ovu stranicu kao vizualnu inspiraciju pri generiranju vaše stranice.">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium" style={{ color: 'var(--db-text-secondary)' }}>URL Stranice</label>
                            <input {...register("designReferenceUrl")} type="text" className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }}
                                placeholder="https://example.com" />
                            <p className="text-[11px]" style={{ color: 'var(--db-text-muted)' }}>
                                Zalijepite link stranice čiji dizajn želite kao referencu.
                            </p>
                        </div>
                    </Section>
                </motion.div>
                )}
                </AnimatePresence>
                )}

                {/* ── Hero CTA ── */}
                {!project.hasGenerated && (
                <AnimatePresence>
                {activeSections.has('heroCta') && (
                <motion.div key="heroCta" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                    <Section icon="🚀" title="Glavni CTA Gumb" accentColor="#f97316"
                        onRemove={() => toggleSection('heroCta')}
                        hint='Ovaj gumb prikazuje se prominentno u hero sekciji — prva stvar koju posjetitelji vide.'>
                        <CtaSelector prefix="heroCta" register={register} watch={watch} setValue={setValue} />
                    </Section>
                </motion.div>
                )}
                </AnimatePresence>
                )}

                {/* ── Images ── */}
                {!project.hasGenerated && (
                <AnimatePresence>
                {activeSections.has('images') && (
                <motion.div key="images" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                    <Section number="2" title="Slike" accentColor="#06b6d4"
                        onRemove={() => toggleSection('images')}
                        subtitle="AI automatski odabire ako ostavite prazno"
                        hint="Logo se prikazuje u navigaciji, hero slika kao pozadina početnog ekrana.">
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--db-text-muted)' }}>Brand</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <ImageUploadBox field="logoUrl" label="Logo" currentUrl={watch("logoUrl")} />
                                <ImageUploadBox field="heroImageUrl" label="Hero Slika" currentUrl={watch("heroImageUrl")} />
                            </div>
                        </div>
                        <div className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--db-border)' }}>
                            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--db-text-muted)' }}>Sekcije</h3>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <ImageUploadBox field="aboutImageUrl" label="O Nama" currentUrl={watch("aboutImageUrl")} />
                                <ImageUploadBox field="featuresImageUrl" label="Features" currentUrl={watch("featuresImageUrl")} />
                                <ImageUploadBox field="servicesBackgroundUrl" label="Usluge Pozadina" currentUrl={watch("servicesBackgroundUrl")} />
                            </div>
                        </div>
                    </Section>
                </motion.div>
                )}
                </AnimatePresence>
                )}

                {/* ── Services ── */}
                {!project.hasGenerated && (
                <AnimatePresence>
                {activeSections.has('services') && (
                <motion.div key="services" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                    <ServicesSection {...formProps} setMediaPickerField={setMediaPickerField} onRemove={() => toggleSection('services')} />
                </motion.div>
                )}
                </AnimatePresence>
                )}

                {/* ── Contact (always visible) ── */}
                <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
                    <Section icon="📧" title="Kontakt" accentColor="#3b82f6"
                        hint="Email se koristi za kontakt formu — poruke klijenata dolaze na tu adresu. Adresa i mapa prikazuju se u footer sekciji.">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" style={{ color: 'var(--db-text-secondary)' }}>Email</label>
                                <input {...register("email")} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                    style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }} placeholder="info@mojbiznis.hr" />
                                {errors.email && <span className="text-red-400 text-xs">{errors.email.message}</span>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" style={{ color: 'var(--db-text-secondary)' }}>Telefon (Opcionalno)</label>
                                <input {...register("phone")} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                    style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }} placeholder="+385 91 123 4567" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--db-text-secondary)' }}><MapPin size={14} style={{ color: 'var(--db-text-muted)' }} />Adresa (Opcionalno)</label>
                            <input {...register("address")} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }} placeholder="Ilica 1, 10000 Zagreb" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--db-text-secondary)' }}><MapPin size={14} style={{ color: 'var(--db-text-muted)' }} />Google Maps Embed URL (Opcionalno)</label>
                            <input {...register("mapEmbed")} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }} placeholder="https://www.google.com/maps/embed?pb=..." />
                            <p className="text-xs" style={{ color: 'var(--db-text-muted)' }}>Kopirajte "src" iz Google Maps embed koda</p>
                        </div>
                    </Section>
                </motion.div>

                {/* ── Dynamic optional sections (rendered in insertion order) ── */}
                {!project.hasGenerated && (
                <div className="space-y-4">
                    <AnimatePresence>
                    {sectionOrder.filter(k => activeSections.has(k) && ['workingHours','socialLinks','testimonials','faq','gallery','pricing'].includes(k)).map(key => {
                        const motionProps = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.25 } };
                        switch (key) {
                            case 'workingHours': return <motion.div key={key} {...motionProps}><WorkingHoursSection {...formProps} onRemove={() => toggleSection('workingHours')} /></motion.div>;
                            case 'socialLinks': return <motion.div key={key} {...motionProps}><SocialLinksSection register={register} onRemove={() => toggleSection('socialLinks')} /></motion.div>;
                            case 'testimonials': return <motion.div key={key} {...motionProps}><TestimonialsSection {...formProps} onRemove={() => toggleSection('testimonials')} /></motion.div>;
                            case 'faq': return <motion.div key={key} {...motionProps}><FaqSection control={control} register={register} onRemove={() => toggleSection('faq')} /></motion.div>;
                            case 'gallery': return <motion.div key={key} {...motionProps}><GallerySection {...formProps} setMediaPickerField={setMediaPickerField} mediaPickerField={mediaPickerField} MediaPickerModal={MediaPickerModal} onRemove={() => toggleSection('gallery')} /></motion.div>;
                            case 'pricing': return <motion.div key={key} {...motionProps}><PricingSection {...formProps} onRemove={() => toggleSection('pricing')} /></motion.div>;
                            default: return null;
                        }
                    })}
                    </AnimatePresence>
                </div>
                )}

                {/* ── Section Picker ("Add" cards for inactive sections) ── */}
                {!project.hasGenerated && (() => {
                    const inactive = OPTIONAL_SECTIONS.filter(s => !activeSections.has(s.key));
                    if (inactive.length === 0) return null;
                    return (
                        <div>
                            <div className="rounded-2xl p-4 sm:p-5" style={{ background: 'var(--db-bg-alt)', border: '1px solid var(--db-border)' }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Plus size={16} style={{ color: '#4ade80' }} />
                                    <h3 className="text-sm font-bold" style={{ color: 'var(--db-heading)' }}>Dodaj dodatne informacije</h3>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>Opcionalno</span>
                                </div>
                                <p className="text-xs mb-4" style={{ color: 'var(--db-text-muted)' }}>
                                    Više informacija = bolja web stranica. Odaberite što želite dodati.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                    {inactive.map(section => (
                                        <button
                                            key={section.key}
                                            type="button"
                                            onClick={() => toggleSection(section.key)}
                                            className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl text-center transition-all hover:scale-[1.03] group"
                                            style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}
                                        >
                                            <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                                                style={{ background: `${section.color}15`, color: section.color }}>
                                                {section.icon}
                                            </div>
                                            <span className="text-xs font-semibold leading-tight" style={{ color: 'var(--db-heading)' }}>{section.label}</span>
                                            <span className="text-[10px] leading-tight hidden sm:block" style={{ color: 'var(--db-text-muted)' }}>{section.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* ── Submit Buttons ── */}
                <div className="sticky bottom-0 left-0 right-0 backdrop-blur-md p-4 pb-[calc(1rem+4.5rem)] md:pb-4 sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-t-0 sm:pt-6 sm:p-0 -mx-4 sm:mx-0"
                    style={{ background: 'var(--db-header-bg)', borderTop: '1px solid var(--db-border)' }}>
                    <div className="flex items-center justify-end gap-2.5 sm:gap-3">
                        <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                            <button type="button" onClick={() => onSave(getValues())} disabled={uploading || generating || saving || updating}
                                className="flex-1 sm:flex-none px-5 sm:px-7 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 text-sm hover:scale-105"
                                style={{ background: 'var(--db-surface)', color: 'var(--db-text-secondary)', border: '1px solid var(--db-border)' }}>
                                {(saving || updating) ? <><Loader2 className="animate-spin" size={16} /><span className="hidden sm:inline">{updating ? 'Ažuriranje...' : 'Spremanje...'}</span></> : (
                                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                    <span className="hidden sm:inline">{project.hasGenerated ? 'Ažuriraj Kontakt Podatke' : 'Spremi Podatke'}</span>
                                    <span className="sm:hidden">{project.hasGenerated ? 'Ažuriraj' : 'Spremi'}</span></>
                                )}
                            </button>
                            <span className="hidden sm:inline"><InfoTooltip text={project.hasGenerated ? 'Sprema promjene kontakt podataka i ažurira stranicu.' : 'Sprema unesene podatke kao skicu. Stranica se još neće generirati.'} side="top" /></span>
                        </div>
                        {!project.hasGenerated && (
                            <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                                <button type="submit" disabled={uploading || generating || saving || updating}
                                    className="flex-1 sm:flex-none px-7 sm:px-9 py-3 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 text-sm hover:scale-105"
                                    style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}>
                                    {generating ? <><Loader2 className="animate-spin" size={18} /><span className="hidden sm:inline">Generiranje...</span></> : <><Sparkles size={18} /><span className="hidden sm:inline">Generiraj Web Stranicu</span><span className="sm:hidden">Generiraj</span></>}
                                </button>
                                <span className="hidden sm:inline"><InfoTooltip text="AI koristi sve unesene podatke da izradi kompletnu, profesionalnu web stranicu. Proces traje u prosjeku 3-5 minuta." side="top" /></span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.form>
        </div>
    );
}
