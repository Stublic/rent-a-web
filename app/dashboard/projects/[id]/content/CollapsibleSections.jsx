"use client";

import { motion } from "framer-motion";
import { useFieldArray } from "react-hook-form";
import { Trash2, Plus, Globe, Clock, Star, HelpCircle, Images, DollarSign } from "lucide-react";
import { Section, CtaSelector, DEFAULT_HOURS, DAYS } from "./content-shared";

// ─── Working Hours ────────────────────────────────────────────────────────────
export function WorkingHoursSection({ control, register, watch, setValue, onRemove }) {
    const { fields: hoursFields, replace } = useFieldArray({ control, name: "workingHours" });
    return (
        <Section icon={<Clock size={15} />} title="Radno Vrijeme" accentColor="#f59e0b"
            onRemove={onRemove}
            hint="Radno vrijeme prikazuje se u contact/footer sekciji stranice.">
            {hoursFields.length === 0 ? (
                <button type="button" onClick={() => replace(DEFAULT_HOURS)}
                    className="w-full py-5 border-2 border-dashed rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-medium hover:scale-[1.01]"
                    style={{ borderColor: 'var(--lp-border)', color: 'var(--lp-text-muted)' }}>
                    <Clock size={16} /> Dodaj radno vrijeme
                </button>
            ) : (
                <div className="space-y-1.5">
                    {hoursFields.map((field, i) => {
                        const isClosed = watch(`workingHours.${i}.closed`);
                        return (
                            <div key={field.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                                style={{ background: isClosed ? 'transparent' : 'var(--lp-surface)', border: '1px solid var(--lp-border)', opacity: isClosed ? 0.5 : 1 }}>
                                <span className="w-28 text-xs font-semibold flex-shrink-0" style={{ color: 'var(--lp-text-secondary)' }}>{watch(`workingHours.${i}.day`)}</span>
                                <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                                    <input type="checkbox" {...register(`workingHours.${i}.closed`)} className="accent-red-500 w-3.5 h-3.5" />
                                    <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Zatv.</span>
                                </label>
                                {!isClosed && (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input type="time" {...register(`workingHours.${i}.from`)} className="rounded-lg px-2 py-1.5 text-sm focus:outline-none" style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                                        <span style={{ color: 'var(--lp-text-muted)' }}>—</span>
                                        <input type="time" {...register(`workingHours.${i}.to`)} className="rounded-lg px-2 py-1.5 text-sm focus:outline-none" style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Section>
    );
}

// ─── Social Links ─────────────────────────────────────────────────────────────
export function SocialLinksSection({ register, onRemove }) {
    const nets = [
        { field: 'socialLinks.facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
        { field: 'socialLinks.instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
        { field: 'socialLinks.linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/...' },
        { field: 'socialLinks.twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/...' },
    ];
    return (
        <Section icon="🌐" title="Društvene Mreže" accentColor="#06b6d4"
            onRemove={onRemove}
            hint="Ikone društvenih mreža prikazuju se u navigaciji i footeru stranice.">
            <div className="grid sm:grid-cols-2 gap-4">
                {nets.map(({ field, label, placeholder }) => (
                    <div key={field} className="space-y-1.5">
                        <label className="text-sm font-medium" style={{ color: 'var(--lp-text-secondary)' }}>{label}</label>
                        <input {...register(field)} placeholder={placeholder}
                            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                            style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                    </div>
                ))}
            </div>
        </Section>
    );
}

// ─── SEO ─────────────────────────────────────────────────────────────────────
export function SeoSection({ register, watch }) {
    const metaTitle = watch("metaTitle");
    const metaDescription = watch("metaDescription");
    return (
        <Section icon={<Globe size={15} />} title="SEO" accentColor="#10b981"
            subtitle="Opcionalno — za bolju Google vidljivost" collapsible defaultOpen={false}
            hint="Meta naslov i opis prikazuju se u Google rezultatima pretrage — važno za privlačenje posjetitelja.">
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center justify-between" style={{ color: 'var(--lp-text-secondary)' }}>
                        <span>Meta Naslov</span>
                        <span className={`text-xs ${metaTitle?.length > 60 ? 'text-red-400' : ''}`} style={metaTitle?.length <= 60 ? { color: 'var(--lp-text-muted)' } : {}}>{metaTitle?.length || 0}/60</span>
                    </label>
                    <input {...register("metaTitle")}
                        className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                        style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }}
                        placeholder="npr. Profesionalne Vodoinstalaterske Usluge" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center justify-between" style={{ color: 'var(--lp-text-secondary)' }}>
                        <span>Meta Opis</span>
                        <span className={`text-xs ${metaDescription?.length > 160 ? 'text-red-400' : ''}`} style={metaDescription?.length <= 160 ? { color: 'var(--lp-text-muted)' } : {}}>{metaDescription?.length || 0}/160</span>
                    </label>
                    <textarea {...register("metaDescription")} rows={3}
                        className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                        style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }}
                        placeholder="Kratak opis za Google..." />
                </div>
            </div>
        </Section>
    );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
export function TestimonialsSection({ control, register, watch, setValue, onRemove }) {
    const { fields, append, remove } = useFieldArray({ control, name: "testimonials" });
    const addNew = () => append({ name: "", text: "", role: "", rating: 5, imageUrl: "" });
    return (
        <Section icon={<Star size={15} />} title="Recenzije" accentColor="#eab308"
            onRemove={onRemove}
            hint="Recenzije klijenata prikazuju se u posebnoj sekciji stranice i grade povjerenje posjetitelja.">
            <div className="flex justify-end">
                <button type="button" onClick={addNew}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                    style={{ background: 'rgba(234,179,8,0.1)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.25)' }}>
                    <Plus size={15} />Dodaj recenziju
                </button>
            </div>
            {fields.length === 0 ? (
                <motion.button type="button" whileHover={{ scale: 1.01 }} onClick={addNew}
                    className="w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-2"
                    style={{ borderColor: 'rgba(234,179,8,0.2)', color: 'var(--lp-text-muted)' }}>
                    <Star size={20} style={{ color: '#fbbf24' }} />
                    <span className="text-sm font-medium">Dodajte prvu recenziju klijenta</span>
                    <span className="text-xs">Recenzije povećavaju konverziju za 20%+</span>
                </motion.button>
            ) : (
                <div className="space-y-3">
                    {fields.map((field, i) => (
                        <div key={field.id} className="rounded-xl p-4 space-y-3" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold" style={{ color: 'var(--lp-text-muted)' }}>Recenzija #{i + 1}</span>
                                <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14} /></button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <input {...register(`testimonials.${i}.name`)} placeholder="Ime klijenta"
                                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                    style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                                <input {...register(`testimonials.${i}.role`)} placeholder="Pozicija / Tvrtka (opcionalno)"
                                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                    style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                            </div>
                            <textarea {...register(`testimonials.${i}.text`)} rows={2} placeholder="Što klijent kaže..."
                                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                                style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                            <div className="flex items-center gap-3">
                                <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Ocjena:</span>
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
    );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
export function FaqSection({ control, register, onRemove }) {
    const { fields, append, remove } = useFieldArray({ control, name: "faq" });
    const addNew = () => append({ question: "", answer: "" });
    return (
        <Section icon={<HelpCircle size={15} />} title="Česta Pitanja (FAQ)" accentColor="#8b5cf6"
            onRemove={onRemove}
            hint="FAQ sekcija smanjuje broj upita i pomaže posjetiteljima brzo dobiti odgovore. Dodajte 3-5 najčešćih pitanja.">
            <div className="flex justify-end">
                <button type="button" onClick={addNew}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                    <Plus size={15} />Dodaj pitanje
                </button>
            </div>
            {fields.length === 0 ? (
                <motion.button type="button" whileHover={{ scale: 1.01 }} onClick={addNew}
                    className="w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-2"
                    style={{ borderColor: 'rgba(139,92,246,0.2)', color: 'var(--lp-text-muted)' }}>
                    <HelpCircle size={20} style={{ color: '#a78bfa' }} />
                    <span className="text-sm font-medium">Dodajte česta pitanja</span>
                    <span className="text-xs">Smanjuje broj upita i pomaže korisnicima</span>
                </motion.button>
            ) : (
                <div className="space-y-3">
                    {fields.map((field, i) => (
                        <div key={field.id} className="rounded-xl p-4 space-y-3" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold" style={{ color: 'var(--lp-text-muted)' }}>Pitanje #{i + 1}</span>
                                <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14} /></button>
                            </div>
                            <input {...register(`faq.${i}.question`)} placeholder="Pitanje..."
                                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                            <textarea {...register(`faq.${i}.answer`)} rows={2} placeholder="Odgovor..."
                                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                                style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                        </div>
                    ))}
                </div>
            )}
        </Section>
    );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
export function GallerySection({ control, register, watch, setValue, setMediaPickerField, mediaPickerField, MediaPickerModal, onRemove }) {
    const { fields, append, remove } = useFieldArray({ control, name: "gallery" });
    return (
        <Section icon={<Images size={15} />} title="Galerija" accentColor="#ec4899"
            onRemove={onRemove}
            hint="Slike galerije prikazuju se u grid mreži na stranici — idealno za portfolio, proizvode ili reference.">
            <div className="flex justify-end">
                <button type="button" onClick={() => setMediaPickerField(`__gallery_${fields.length}`)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                    style={{ background: 'rgba(236,72,153,0.1)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.25)' }}>
                    <Plus size={15} />Dodaj iz knjižnice
                </button>
            </div>
            {mediaPickerField?.startsWith('__gallery_') && (
                <MediaPickerModal
                    onSelect={url => { append({ imageUrl: url, caption: "" }); setMediaPickerField(null); }}
                    onClose={() => setMediaPickerField(null)} />
            )}
            {fields.length === 0 ? (
                <motion.button type="button" whileHover={{ scale: 1.01 }} onClick={() => setMediaPickerField('__gallery_0')}
                    className="w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-2"
                    style={{ borderColor: 'rgba(236,72,153,0.2)', color: 'var(--lp-text-muted)' }}>
                    <Images size={20} style={{ color: '#f472b6' }} />
                    <span className="text-sm font-medium">Dodajte slike galerije</span>
                    <span className="text-xs">Portfolio, proizvodi, radovi...</span>
                </motion.button>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {fields.map((field, i) => (
                        <div key={field.id} className="relative group rounded-xl overflow-hidden border border-zinc-800">
                            <img src={watch(`gallery.${i}.imageUrl`)} alt="" className="w-full aspect-square object-cover" />
                            <button type="button" onClick={() => remove(i)} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                            <input {...register(`gallery.${i}.caption`)} placeholder="Opis..." className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs px-2 py-1.5 focus:outline-none" />
                        </div>
                    ))}
                </div>
            )}
        </Section>
    );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
export function PricingSection({ control, register, watch, setValue, onRemove }) {
    const { fields, append, remove } = useFieldArray({ control, name: "pricing" });
    const addNew = () => append({ name: "", price: "", description: "", features: [], highlighted: false });
    return (
        <Section icon={<DollarSign size={15} />} title="Cjenik / Paketi" accentColor="#f97316"
            onRemove={onRemove}
            hint="Cjenik se prikazuje kao kartice s paketima — istaknuti paket (toggle) dobiva vizualnu prednost.">
            <div className="flex justify-end">
                <button type="button" onClick={addNew}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                    style={{ background: 'rgba(249,115,22,0.1)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' }}>
                    <Plus size={15} />Dodaj paket
                </button>
            </div>
            {fields.length === 0 ? (
                <motion.button type="button" whileHover={{ scale: 1.01 }} onClick={addNew}
                    className="w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-2"
                    style={{ borderColor: 'rgba(249,115,22,0.2)', color: 'var(--lp-text-muted)' }}>
                    <DollarSign size={20} style={{ color: '#fb923c' }} />
                    <span className="text-sm font-medium">Dodajte cjenik ili pakete</span>
                    <span className="text-xs">Transparentne cijene povećavaju povjerenje</span>
                </motion.button>
            ) : (
                <div className="space-y-4">
                    {fields.map((field, i) => (
                        <div key={field.id} className="rounded-xl p-4 space-y-3" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold" style={{ color: 'var(--lp-text-muted)' }}>Paket #{i + 1}</span>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" {...register(`pricing.${i}.highlighted`)} className="accent-green-500 w-4 h-4" />
                                        <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Istaknuto</span>
                                    </label>
                                    <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <input {...register(`pricing.${i}.name`)} placeholder="Naziv paketa"
                                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                    style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                                <input {...register(`pricing.${i}.price`)} placeholder="npr. 99€/mj"
                                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                    style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                            </div>
                            <input {...register(`pricing.${i}.description`)} placeholder="Kratki opis paketa (opcionalno)"
                                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                            <div className="space-y-1">
                                <label className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Značajke (po jedna u redu)</label>
                                <textarea
                                    value={(watch(`pricing.${i}.features`) || []).join('\n')}
                                    onChange={e => setValue(`pricing.${i}.features`, e.target.value.split('\n').filter(Boolean))}
                                    rows={3} placeholder={"✓ Neograničeni pozivi\n✓ 24/7 podrška\n✓ Besplatna instalacija"}
                                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 resize-none font-mono"
                                    style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Section>
    );
}
