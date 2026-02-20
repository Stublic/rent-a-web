"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentSchema } from "@/lib/schemas";
import { uploadImageAction, generateWebsiteAction } from "@/app/actions/content-generator";
import { saveContentAction } from "@/app/actions/save-content";
import { updateContentAction } from "@/app/actions/update-content";
import { Loader2, Upload, Trash2, Plus, Sparkles, Palette, Globe, Image, ChevronDown, ChevronUp, X, FolderOpen, Phone, Mail, Link2, MessageCircle, Clock, MapPin, Star, HelpCircle, Images, DollarSign, ExternalLink, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import StylePicker, { STYLES } from "@/app/try/StylePicker";

const CTA_TYPES = [
    { value: 'contact', label: 'Kontakt forma', icon: Mail, desc: 'Šalje na kontakt sekciju' },
    { value: 'phone', label: 'Poziv telefon', icon: Phone, desc: 'Poziva vaš broj' },
    { value: 'email', label: 'Pošalji email', icon: Mail, desc: 'Otvara email klijent' },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, desc: 'Otvara WhatsApp chat' },
    { value: 'link', label: 'Custom link', icon: ExternalLink, desc: 'PDF, vanjska stranica...' },
];

const COLOR_PRESETS = [
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
    '#f97316', '#f59e0b', '#eab308', '#84cc16',
];

const DAYS = ['Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota', 'Nedjelja'];

const DEFAULT_HOURS = DAYS.map(day => ({
    day,
    from: day === 'Subota' || day === 'Nedjelja' ? '' : '08:00',
    to: day === 'Subota' || day === 'Nedjelja' ? '' : '16:00',
    closed: day === 'Subota' || day === 'Nedjelja'
}));

// --- Media Picker Modal ---
function MediaPickerModal({ onSelect, onClose }) {
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                    <div>
                        <h3 className="text-lg font-bold text-white">Media Knjižnica</h3>
                        <p className="text-zinc-500 text-xs mt-0.5">Odaberite sliku iz vaše knjižnice</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><X size={20} className="text-zinc-400" /></button>
                </div>
                <div className="px-5 py-3 border-b border-zinc-800/50">
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Pretraži po nazivu..."
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition-colors" />
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-green-500" /></div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {filtered.map(item => (
                                <button key={item.id} type="button" onClick={() => onSelect(item.url)}
                                    className="group relative aspect-square rounded-xl overflow-hidden border-2 border-zinc-800 hover:border-green-500 transition-all focus:outline-none">
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
                            <Image size={32} className="mx-auto text-zinc-700 mb-3" />
                            <p className="text-zinc-500 text-sm font-medium">{search ? "Nema rezultata" : "Nema uploadanih slika"}</p>
                            <p className="text-zinc-600 text-xs mt-1">{search ? "Pokušajte s drugim pojmom" : "Idite na Media tab da uploadate slike"}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- CTA Selector Component ---
function CtaSelector({ prefix, register, watch, setValue }) {
    const ctaType = watch(`${prefix}.type`) || 'contact';
    return (
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 space-y-3">
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">CTA Gumb</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {CTA_TYPES.map(cta => {
                    const Icon = cta.icon;
                    return (
                        <button key={cta.value} type="button" onClick={() => setValue(`${prefix}.type`, cta.value)}
                            className={`p-2.5 rounded-lg border text-left transition-all ${ctaType === cta.value
                                ? 'border-green-500 bg-green-500/10 text-white' : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'}`}>
                            <Icon size={14} className={ctaType === cta.value ? 'text-green-400' : 'text-zinc-600'} />
                            <p className="text-xs font-medium mt-1.5 leading-tight">{cta.label}</p>
                        </button>
                    );
                })}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-zinc-500 text-xs">Tekst gumba</label>
                    <input {...register(`${prefix}.label`)} placeholder="npr. Kontaktirajte nas"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />
                </div>
                {ctaType === 'link' && (
                    <div className="space-y-1">
                        <label className="text-zinc-500 text-xs">URL / Poveznica</label>
                        <input {...register(`${prefix}.url`)} placeholder="https://..."
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Color Picker Component ---
function ColorPickerField({ label, value, onChange, presets = COLOR_PRESETS }) {
    return (
        <div className="space-y-2">
            <label className="text-zinc-300 text-sm font-medium">{label}</label>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border-2 border-zinc-700 flex-shrink-0" style={{ backgroundColor: value || '#000000' }} />
                <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white w-28 text-sm font-mono uppercase focus:outline-none focus:border-green-500" placeholder="#000000" />
            </div>
            <div className="flex flex-wrap gap-1.5">
                {presets.map(color => (
                    <button key={color} type="button" onClick={() => onChange(color)}
                        className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${value === color ? 'border-white scale-110 shadow-lg' : 'border-zinc-700 hover:border-zinc-500'}`}
                        style={{ backgroundColor: color }} />
                ))}
            </div>
        </div>
    );
}

// --- Section Wrapper ---
function Section({ number, icon, title, subtitle, children, collapsible = false, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <button type="button" onClick={collapsible ? () => setOpen(!open) : undefined}
                className={`w-full p-5 sm:p-6 flex items-center justify-between ${collapsible ? 'hover:bg-zinc-900/70 cursor-pointer' : 'cursor-default'} transition-colors`}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${number ? 'bg-green-500 text-white' : 'bg-zinc-800 text-green-500'}`}>
                        {number || icon}
                    </div>
                    <div className="text-left">
                        <h2 className="text-base sm:text-lg font-bold text-white">{title}</h2>
                        {subtitle && <p className="text-zinc-500 text-xs sm:text-sm">{subtitle}</p>}
                    </div>
                </div>
                {collapsible && (open ? <ChevronUp className="text-zinc-500 flex-shrink-0" size={20} /> : <ChevronDown className="text-zinc-500 flex-shrink-0" size={20} />)}
            </button>
            {(!collapsible || open) && <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-5">{children}</div>}
        </div>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ContentForm({ project }) {
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [generationStep, setGenerationStep] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
    const [uploadError, setUploadError] = useState("");
    const [mediaPickerField, setMediaPickerField] = useState(null);
    const [showAdvancedColors, setShowAdvancedColors] = useState(false);
    // styleKey: from project.contentData (locked if hasGenerated), or user picks
    const [styleKey, setStyleKey] = useState(() => {
        return project.contentData?.styleKey ?? null;
    });
    const router = useRouter();

    const defaults = project.contentData || {
        businessName: "", industry: "", description: "",
        template: "modern", primaryColor: "#22c55e",
        secondaryColor: "", backgroundColor: "", textColor: "",
        heroCta: { type: 'contact', label: '', url: '' },
        logoUrl: "", heroImageUrl: "", aboutImageUrl: "", featuresImageUrl: "", servicesBackgroundUrl: "",
        metaTitle: "", metaDescription: "", metaKeywords: [],
        email: "", phone: "", address: "", mapEmbed: "",
        workingHours: DEFAULT_HOURS,
        services: [{ name: "", description: "", imageUrl: "", cta: { type: 'contact', label: '', url: '' } }],
        testimonials: [],
        faq: [],
        gallery: [],
        pricing: [],
        socialLinks: { facebook: "", instagram: "", linkedin: "", twitter: "" }
    };

    const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(contentSchema),
        defaultValues: defaults
    });

    const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({ control, name: "services" });
    const { fields: testimonialFields, append: appendTestimonial, remove: removeTestimonial } = useFieldArray({ control, name: "testimonials" });
    const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({ control, name: "faq" });
    const { fields: galleryFields, append: appendGallery, remove: removeGallery } = useFieldArray({ control, name: "gallery" });
    const { fields: pricingFields, append: appendPricing, remove: removePricing } = useFieldArray({ control, name: "pricing" });
    const { fields: hoursFields } = useFieldArray({ control, name: "workingHours" });

    // Prefill from /try trial data (only if project is DRAFT with no contentData)
    useEffect(() => {
        if (project.contentData) return; // Already has content, don't overwrite
        try {
            const raw = localStorage.getItem('rentaweb_trial');
            if (!raw) return;
            const trial = JSON.parse(raw);
            if (!trial) return;

            // businessName and description
            if (trial.businessName) setValue('businessName', trial.businessName);
            if (trial.businessDescription) setValue('description', trial.businessDescription);

            // styleKey (from Faza 2)
            if (trial.styleKey) setStyleKey(trial.styleKey);

            // Try to extract contact info from generated HTML (regex)
            if (trial.generatedHtml) {
                const html = trial.generatedHtml;
                // Email — look for mailto: links
                const mailMatch = html.match(/mailto:([\w.%+-]+@[\w.-]+\.[a-z]{2,})/i);
                if (mailMatch?.[1]) setValue('email', mailMatch[1]);
                // Phone — look for tel: links
                const telMatch = html.match(/tel:([+\d\s()\-]{7,20})/);
                if (telMatch?.[1]) setValue('phone', telMatch[1].trim());
            }

            console.log('[ContentForm] Prefilled from trial data:', trial.businessName);
        } catch (e) {
            console.warn('[ContentForm] Could not load trial data:', e);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const generationSteps = [
        { label: "Validiranje podataka", icon: "✓" },
        { label: "Priprema sadržaja", icon: "✓" },
        { label: "AI piše kod (15s)", icon: "⏳" },
        { label: "Spremanje", icon: "✓" }
    ];

    const selectedTemplate = watch("template");
    const metaTitle = watch("metaTitle");
    const metaDescription = watch("metaDescription");

    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setUploadError("");
        const formData = new FormData();
        formData.append("file", file);
        try {
            const url = await uploadImageAction(formData);
            setValue(field, url);
        } catch (error) {
            console.error("Upload failed", error);
            setUploadError("Upload slike nije uspio. Molimo pokušajte ponovno.");
        } finally { setUploading(false); }
    };

    const onSubmit = async (data) => {
        setGenerating(true); setErrorMessage(""); setGenerationStep(0);
        try {
            setGenerationStep(1); await new Promise(r => setTimeout(r, 500));
            setGenerationStep(2); await new Promise(r => setTimeout(r, 500));
            setGenerationStep(3);
            const result = await generateWebsiteAction(project.id, { ...data, styleKey });
            if (result.error) { setErrorMessage(typeof result.error === 'string' ? result.error : "Greška pri generiranju."); setGenerating(false); setGenerationStep(0); return; }
            setGenerationStep(4); await new Promise(r => setTimeout(r, 500));
            router.refresh(); setGenerating(false); setGenerationStep(0);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error(error); setErrorMessage("Neočekivana greška. Pokušajte ponovno."); setGenerating(false); setGenerationStep(0);
        }
    };

    const onSave = async (data) => {
        const isUpdate = project.hasGenerated;
        if (isUpdate) setUpdating(true); else setSaving(true);
        setErrorMessage("");
        try {
            const result = isUpdate
                ? await updateContentAction(project.id, { ...data, styleKey })
                : await saveContentAction(project.id, { ...data, styleKey });
            if (result.error) { setErrorMessage(result.error); setSaving(false); setUpdating(false); return; }
            router.refresh(); setSaving(false); setUpdating(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error(error); setErrorMessage(isUpdate ? "Greška pri ažuriranju." : "Greška pri spremanju."); setSaving(false); setUpdating(false);
        }
    };

    const ImageUploadBox = ({ field, label, currentUrl }) => (
        <div className="space-y-2">
            <label className="text-zinc-300 text-sm font-medium flex items-center gap-2"><Image size={16} className="text-zinc-500" />{label}</label>
            <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 hover:border-green-500/50 transition-all group relative overflow-hidden bg-zinc-950/50">
                {currentUrl ? (
                    <div className="relative">
                        <img src={currentUrl} alt={label} className="w-full h-32 object-cover rounded-lg" />
                        <button type="button" onClick={() => setValue(field, "")} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-lg"><Trash2 size={14} /></button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <Upload className="text-zinc-600 group-hover:text-green-500 transition-colors" size={28} />
                        <div className="flex items-center gap-3">
                            <label className="cursor-pointer px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors">
                                Prenesi datoteku
                                <input type="file" onChange={e => handleImageUpload(e, field)} className="hidden" accept="image/*" />
                            </label>
                            <button type="button" onClick={() => setMediaPickerField(field)} className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-green-500/20">
                                <FolderOpen size={14} />Iz knjižnice
                            </button>
                        </div>
                        <p className="text-xs text-zinc-600 text-center">Ili ostavi prazno za automatski odabir</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="w-full pb-8 relative">
            {mediaPickerField && <MediaPickerModal onSelect={url => { setValue(mediaPickerField, url); setMediaPickerField(null); }} onClose={() => setMediaPickerField(null)} />}

            {/* Generating Overlay */}
            {generating && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-green-500/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-green-500/10">
                        <div className="text-center mb-6">
                            <div className="relative inline-block">
                                <Loader2 className="w-16 h-16 animate-spin text-green-500 mx-auto mb-4" />
                                <div className="absolute inset-0 blur-xl bg-green-500/30 animate-pulse"></div>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">✨ AI stvara web stranicu</h3>
                            <p className="text-zinc-400 text-sm">Koristi Gemini 3 Flash - Ovo može potrajati 30-60 sekundi.</p>
                        </div>
                        <div className="space-y-3">
                            {generationSteps.map((step, i) => (
                                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${i < generationStep ? 'bg-green-500/10 border border-green-500/30' : i === generationStep ? 'bg-zinc-800 border border-zinc-700 animate-pulse' : 'bg-zinc-900/50 border border-zinc-800/50'}`}>
                                    <span className="text-2xl">{i < generationStep ? '✅' : i === generationStep ? '⏳' : '○'}</span>
                                    <span className={`text-sm font-medium ${i <= generationStep ? 'text-white' : 'text-zinc-600'}`}>{step.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Updating Overlay */}
            {updating && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-blue-500/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-blue-500/10">
                        <div className="text-center mb-6">
                            <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">🔄 Ažuriranje sadržaja</h3>
                            <p className="text-zinc-400 text-sm">AI pametno ažurira samo promijenjene podatke...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Errors */}
            {errorMessage && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div><h4 className="font-bold text-red-400 mb-1">Greška</h4><p className="text-red-300 text-sm">{errorMessage}</p></div>
                </div>
            )}
            {uploadError && (
                <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-xl">⚠️</span><p className="text-orange-300 text-sm flex-1">{uploadError}</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* ── Style Picker ── */}
                <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl flex-shrink-0">🎨</div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-white">Vizualni Stil</h2>
                            <p className="text-zinc-400 text-xs sm:text-sm">
                                {project.hasGenerated
                                    ? 'Stil je zaključan nakon prvog generiranja'
                                    : 'Odaberi stil dizajna — zaključava se pri generiranju'}
                            </p>
                        </div>
                        {project.hasGenerated && <Lock size={16} className="text-zinc-500 ml-auto" />}
                    </div>
                    {project.hasGenerated ? (
                        // Locked — show read-only badge
                        <div className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                            <span className="text-2xl">
                                {styleKey ? (STYLES[styleKey]?.emoji ?? '🎨') : '🤖'}
                            </span>
                            <div>
                                <p className="text-white font-semibold text-sm">
                                    {styleKey ? (STYLES[styleKey]?.label ?? styleKey) : 'AI odabir'}
                                </p>
                                <p className="text-zinc-500 text-xs">
                                    {styleKey ? (STYLES[styleKey]?.desc ?? '') : 'AI sam odabrao stil'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <StylePicker selected={styleKey} onSelect={setStyleKey} />
                    )}
                </div>

                {/* ── 1. Basic Info ── */}
                <Section number="1" title="Osnovne Informacije">
                    <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium">Naziv Biznisa</label>
                            <input {...register("businessName")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 text-base" placeholder="npr. Rent a Web" />
                            {errors.businessName && <span className="text-red-400 text-xs">{errors.businessName.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium">Industrija</label>
                            <input {...register("industry")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 text-base" placeholder="npr. Web Dizajn" />
                            {errors.industry && <span className="text-red-400 text-xs">{errors.industry.message}</span>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-zinc-300 text-sm font-medium">Opis Biznisa</label>
                        <textarea {...register("description")} rows={4} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 resize-none text-base" placeholder="Opišite što radite, vaše prednosti i ciljeve..." />
                        {errors.description && <span className="text-red-400 text-xs">{errors.description.message}</span>}
                    </div>
                </Section>

                {/* ── Color Palette ── */}
                <Section icon={<Palette size={16} />} title="Boje" subtitle="Primarna boja je najvažnija — ostale su opcionalne">
                    <ColorPickerField label="✨ Primarna Boja" value={watch("primaryColor")} onChange={v => setValue("primaryColor", v)} />
                    <button type="button" onClick={() => setShowAdvancedColors(!showAdvancedColors)} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors mt-2">
                        {showAdvancedColors ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        Više boja (opcionalno)
                    </button>
                    {showAdvancedColors && (
                        <div className="grid sm:grid-cols-3 gap-5 pt-2 border-t border-zinc-800 mt-3">
                            <ColorPickerField label="Sekundarna" value={watch("secondaryColor")} onChange={v => setValue("secondaryColor", v)} />
                            <ColorPickerField label="Pozadina" value={watch("backgroundColor")} onChange={v => setValue("backgroundColor", v)}
                                presets={['#ffffff', '#f8fafc', '#f1f5f9', '#fafaf9', '#0a0a0a', '#18181b', '#1c1917', '#0c0a09', '#0f172a', '#1e1b4b', '#1a2e05', '#2e1065']} />
                            <ColorPickerField label="Tekst" value={watch("textColor")} onChange={v => setValue("textColor", v)}
                                presets={['#000000', '#18181b', '#27272a', '#3f3f46', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7', '#f4f4f5', '#fafafa', '#ffffff']} />
                        </div>
                    )}
                </Section>

                {/* ── Hero CTA ── */}
                <Section icon="🚀" title="Glavni CTA Gumb" subtitle="Akcija za glavni gumb na vrhu stranice">
                    <CtaSelector prefix="heroCta" register={register} watch={watch} setValue={setValue} />
                </Section>

                {/* ── 2. Images ── */}
                <Section number="2" title="Slike" subtitle="Opcionalno - AI automatski odabire slike">
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Brand</h3>
                        <div className="grid sm:grid-cols-2 gap-5">
                            <ImageUploadBox field="logoUrl" label="Logo" currentUrl={watch("logoUrl")} />
                            <ImageUploadBox field="heroImageUrl" label="Hero Slika" currentUrl={watch("heroImageUrl")} />
                        </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Sekcije</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <ImageUploadBox field="aboutImageUrl" label="O Nama" currentUrl={watch("aboutImageUrl")} />
                            <ImageUploadBox field="featuresImageUrl" label="Features" currentUrl={watch("featuresImageUrl")} />
                            <ImageUploadBox field="servicesBackgroundUrl" label="Usluge Pozadina" currentUrl={watch("servicesBackgroundUrl")} />
                        </div>
                    </div>
                </Section>

                {/* ── 3. Services ── */}
                <Section number="3" title="Usluge / Proizvodi">
                    <div className="flex justify-end -mt-2">
                        <button type="button" onClick={() => appendService({ name: "", description: "", imageUrl: "", cta: { type: 'contact', label: '', url: '' } })}
                            className="text-green-500 font-bold flex items-center gap-2 hover:text-green-400 transition-colors px-3 py-2 rounded-lg hover:bg-green-500/10">
                            <Plus size={18} /><span className="hidden sm:inline">Dodaj</span>
                        </button>
                    </div>
                    <div className="space-y-4">
                        {serviceFields.map((field, i) => (
                            <div key={field.id} className="bg-zinc-950/50 border border-zinc-700 rounded-xl p-4 sm:p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400 text-sm font-bold">Usluga #{i + 1}</span>
                                    {serviceFields.length > 1 && <button type="button" onClick={() => removeService(i)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>}
                                </div>
                                <input {...register(`services.${i}.name`)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-green-500 text-base" placeholder="Naziv usluge" />
                                <textarea {...register(`services.${i}.description`)} rows={2} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-green-500 resize-none text-base" placeholder="Kratak opis (opcionalno)" />
                                <ImageUploadBox field={`services.${i}.imageUrl`} label="Slika usluge (opcionalno)" currentUrl={watch(`services.${i}.imageUrl`)} />
                                <CtaSelector prefix={`services.${i}.cta`} register={register} watch={watch} setValue={setValue} />
                            </div>
                        ))}
                    </div>
                    {errors.services && <span className="text-red-400 text-xs">{errors.services.message}</span>}
                </Section>

                {/* ── Contact ── */}
                <Section icon="📧" title="Kontakt">
                    <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium">Email</label>
                            <input {...register("email")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 text-base" placeholder="info@mojbiznis.hr" />
                            {errors.email && <span className="text-red-400 text-xs">{errors.email.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium">Telefon (Opcionalno)</label>
                            <input {...register("phone")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 text-base" placeholder="+385 91 123 4567" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-zinc-300 text-sm font-medium flex items-center gap-2"><MapPin size={16} className="text-zinc-500" />Adresa (Opcionalno)</label>
                        <input {...register("address")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 text-base" placeholder="Ilica 1, 10000 Zagreb" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-zinc-300 text-sm font-medium flex items-center gap-2"><MapPin size={16} className="text-zinc-500" />Google Maps Embed URL (Opcionalno)</label>
                        <input {...register("mapEmbed")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 text-sm" placeholder="https://www.google.com/maps/embed?pb=..." />
                        <p className="text-zinc-600 text-xs">Kopirajte "src" iz Google Maps embed koda</p>
                    </div>
                </Section>

                {/* ── Working Hours ── */}
                <Section icon={<Clock size={16} />} title="Radno Vrijeme" subtitle="Opcionalno" collapsible defaultOpen={false}>
                    {hoursFields.length === 0 ? (
                        <button type="button" onClick={() => DEFAULT_HOURS.forEach((h, i) => { setValue(`workingHours.${i}`, h); })}
                            className="w-full py-4 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-green-400 hover:border-green-500/50 transition-all flex items-center justify-center gap-2">
                            <Plus size={18} />Dodaj radno vrijeme
                        </button>
                    ) : (
                        <div className="space-y-2">
                            {hoursFields.map((field, i) => {
                                const isClosed = watch(`workingHours.${i}.closed`);
                                return (
                                    <div key={field.id} className="flex items-center gap-3 bg-zinc-950/50 border border-zinc-800 rounded-lg p-3">
                                        <span className="w-24 text-sm text-zinc-300 font-medium flex-shrink-0">{watch(`workingHours.${i}.day`)}</span>
                                        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                                            <input type="checkbox" {...register(`workingHours.${i}.closed`)} className="accent-red-500 w-4 h-4" />
                                            <span className="text-xs text-zinc-500">Zatvoreno</span>
                                        </label>
                                        {!isClosed && (
                                            <div className="flex items-center gap-2 flex-1">
                                                <input type="time" {...register(`workingHours.${i}.from`)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-green-500" />
                                                <span className="text-zinc-600">—</span>
                                                <input type="time" {...register(`workingHours.${i}.to`)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-green-500" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Section>

                {/* ── Social Links ── */}
                <Section icon="🌐" title="Društvene Mreže" subtitle="Opcionalno" collapsible defaultOpen={false}>
                    <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium">Facebook</label>
                            <input {...register("socialLinks.facebook")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 text-base" placeholder="https://facebook.com/..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium">Instagram</label>
                            <input {...register("socialLinks.instagram")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-pink-500 text-base" placeholder="https://instagram.com/..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium">LinkedIn</label>
                            <input {...register("socialLinks.linkedin")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-600 text-base" placeholder="https://linkedin.com/..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium">Twitter / X</label>
                            <input {...register("socialLinks.twitter")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-zinc-400 text-base" placeholder="https://twitter.com/..." />
                        </div>
                    </div>
                </Section>

                {/* ── SEO ── */}
                <Section icon={<Globe size={16} />} title="SEO Podešavanja" subtitle="Opcionalno - za bolju vidljivost" collapsible defaultOpen={false}>
                    <div className="space-y-2">
                        <label className="text-zinc-300 text-sm font-medium flex items-center justify-between">
                            <span>Meta Naslov</span>
                            <span className={`text-xs ${metaTitle?.length > 60 ? 'text-red-400' : 'text-zinc-600'}`}>{metaTitle?.length || 0}/60</span>
                        </label>
                        <input {...register("metaTitle")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 text-base" placeholder="npr. Profesionalne Vodoinstalaterske Usluge" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-zinc-300 text-sm font-medium flex items-center justify-between">
                            <span>Meta Opis</span>
                            <span className={`text-xs ${metaDescription?.length > 160 ? 'text-red-400' : 'text-zinc-600'}`}>{metaDescription?.length || 0}/160</span>
                        </label>
                        <textarea {...register("metaDescription")} rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 resize-none text-base" placeholder="Kratak opis..." />
                    </div>
                </Section>

                {/* ── Testimonials ── */}
                <Section icon={<Star size={16} />} title="Testimonijali / Recenzije" subtitle="Opcionalno" collapsible defaultOpen={false}>
                    <div className="flex justify-end -mt-2">
                        <button type="button" onClick={() => appendTestimonial({ name: "", text: "", role: "", rating: 5, imageUrl: "" })}
                            className="text-green-500 font-bold flex items-center gap-2 hover:text-green-400 px-3 py-2 rounded-lg hover:bg-green-500/10"><Plus size={18} />Dodaj</button>
                    </div>
                    {testimonialFields.length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-4">Dodajte recenzije vaših klijenata</p>
                    ) : (
                        <div className="space-y-4">
                            {testimonialFields.map((field, i) => (
                                <div key={field.id} className="bg-zinc-950/50 border border-zinc-700 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 text-sm font-bold">Recenzija #{i + 1}</span>
                                        <button type="button" onClick={() => removeTestimonial(i)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <input {...register(`testimonials.${i}.name`)} placeholder="Ime klijenta" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />
                                        <input {...register(`testimonials.${i}.role`)} placeholder="Pozicija / Tvrtka (opcionalno)" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />
                                    </div>
                                    <textarea {...register(`testimonials.${i}.text`)} rows={2} placeholder="Što klijent kaže..." className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 resize-none" />
                                    <div className="flex items-center gap-3">
                                        <span className="text-zinc-500 text-xs">Ocjena:</span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button key={star} type="button" onClick={() => setValue(`testimonials.${i}.rating`, star)}
                                                    className={`text-lg ${watch(`testimonials.${i}.rating`) >= star ? 'text-yellow-400' : 'text-zinc-700'} hover:text-yellow-400 transition-colors`}>★</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* ── FAQ ── */}
                <Section icon={<HelpCircle size={16} />} title="FAQ — Često Postavljana Pitanja" subtitle="Opcionalno" collapsible defaultOpen={false}>
                    <div className="flex justify-end -mt-2">
                        <button type="button" onClick={() => appendFaq({ question: "", answer: "" })}
                            className="text-green-500 font-bold flex items-center gap-2 hover:text-green-400 px-3 py-2 rounded-lg hover:bg-green-500/10"><Plus size={18} />Dodaj</button>
                    </div>
                    {faqFields.length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-4">Dodajte pitanja i odgovore za vašu stranicu</p>
                    ) : (
                        <div className="space-y-4">
                            {faqFields.map((field, i) => (
                                <div key={field.id} className="bg-zinc-950/50 border border-zinc-700 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 text-sm font-bold">Pitanje #{i + 1}</span>
                                        <button type="button" onClick={() => removeFaq(i)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16} /></button>
                                    </div>
                                    <input {...register(`faq.${i}.question`)} placeholder="Pitanje..." className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />
                                    <textarea {...register(`faq.${i}.answer`)} rows={2} placeholder="Odgovor..." className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 resize-none" />
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* ── Gallery ── */}
                <Section icon={<Images size={16} />} title="Galerija Slika" subtitle="Opcionalno — portfolio, proizvodi, reference" collapsible defaultOpen={false}>
                    <div className="flex justify-end -mt-2">
                        <button type="button" onClick={() => setMediaPickerField(`__gallery_${galleryFields.length}`)}
                            className="text-green-500 font-bold flex items-center gap-2 hover:text-green-400 px-3 py-2 rounded-lg hover:bg-green-500/10"><Plus size={18} />Iz knjižnice</button>
                    </div>
                    {mediaPickerField?.startsWith('__gallery_') && (
                        <MediaPickerModal onSelect={url => { appendGallery({ imageUrl: url, caption: "" }); setMediaPickerField(null); }} onClose={() => setMediaPickerField(null)} />
                    )}
                    {galleryFields.length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-4">Dodajte slike iz Media knjižnice za galeriju</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {galleryFields.map((field, i) => (
                                <div key={field.id} className="relative group rounded-xl overflow-hidden border border-zinc-800">
                                    <img src={watch(`gallery.${i}.imageUrl`)} alt="" className="w-full aspect-square object-cover" />
                                    <button type="button" onClick={() => removeGallery(i)} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                                    <input {...register(`gallery.${i}.caption`)} placeholder="Opis..." className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs px-2 py-1.5 focus:outline-none" />
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* ── Pricing ── */}
                <Section icon={<DollarSign size={16} />} title="Cjenik / Paketi" subtitle="Opcionalno" collapsible defaultOpen={false}>
                    <div className="flex justify-end -mt-2">
                        <button type="button" onClick={() => appendPricing({ name: "", price: "", description: "", features: [], highlighted: false })}
                            className="text-green-500 font-bold flex items-center gap-2 hover:text-green-400 px-3 py-2 rounded-lg hover:bg-green-500/10"><Plus size={18} />Dodaj paket</button>
                    </div>
                    {pricingFields.length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-4">Dodajte cjenik ili pakete usluga</p>
                    ) : (
                        <div className="space-y-4">
                            {pricingFields.map((field, i) => (
                                <div key={field.id} className="bg-zinc-950/50 border border-zinc-700 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 text-sm font-bold">Paket #{i + 1}</span>
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" {...register(`pricing.${i}.highlighted`)} className="accent-green-500 w-4 h-4" />
                                                <span className="text-xs text-zinc-500">Istaknuto</span>
                                            </label>
                                            <button type="button" onClick={() => removePricing(i)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <input {...register(`pricing.${i}.name`)} placeholder="Naziv paketa" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />
                                        <input {...register(`pricing.${i}.price`)} placeholder="npr. 99€/mj" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />
                                    </div>
                                    <input {...register(`pricing.${i}.description`)} placeholder="Kratki opis paketa (opcionalno)" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />
                                    <div className="space-y-1">
                                        <label className="text-zinc-500 text-xs">Značajke (po jedna u redu)</label>
                                        <textarea
                                            value={(watch(`pricing.${i}.features`) || []).join('\n')}
                                            onChange={e => setValue(`pricing.${i}.features`, e.target.value.split('\n').filter(Boolean))}
                                            rows={3} placeholder={"✓ Neograničeni pozivi\n✓ 24/7 podrška\n✓ Besplatna instalacija"}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 resize-none font-mono" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* ── Submit Buttons ── */}
                <div className="sticky bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-zinc-800 p-4 sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-t-0 sm:pt-8 sm:p-0 -mx-4 sm:mx-0">
                    <div className="flex items-center justify-end gap-3 sm:gap-4">
                        <button type="button" onClick={handleSubmit(onSave)} disabled={uploading || generating || saving || updating}
                            className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 text-white px-6 sm:px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                            {(saving || updating) ? <><Loader2 className="animate-spin" size={18} /><span className="hidden sm:inline">{updating ? 'Ažuriranje...' : 'Spremanje...'}</span></> : (
                                <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                <span className="hidden sm:inline">{project.hasGenerated ? 'Ažuriraj Web Stranicu' : 'Spremi Podatke'}</span>
                                <span className="sm:hidden">{project.hasGenerated ? 'Ažuriraj' : 'Spremi'}</span></>
                            )}
                        </button>
                        {!project.hasGenerated && (
                            <button type="submit" disabled={uploading || generating || saving || updating}
                                className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-8 sm:px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105">
                                {generating ? <><Loader2 className="animate-spin" size={20} /><span className="hidden sm:inline">Generiranje...</span></> : <><Sparkles size={20} /><span className="hidden sm:inline">Generiraj Web Stranicu</span><span className="sm:hidden">Generiraj</span></>}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
