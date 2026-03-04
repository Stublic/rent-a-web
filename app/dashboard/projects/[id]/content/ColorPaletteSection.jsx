'use client';

import { useState, useMemo } from 'react';
import { Palette, Sparkles, Check, RotateCcw, ChevronDown } from 'lucide-react';

// ─── Industry-specific color palettes ────────────────────────────────
const INDUSTRY_PALETTES = {
    restoran: [
        { name: 'Topla Kuhinja', primary: '#D4451A', secondary: '#F5A623', bg: '#0D0D0D', text: '#FAFAFA' },
        { name: 'Elegantna Večera', primary: '#C9A96E', secondary: '#8B6914', bg: '#1A1A2E', text: '#F0E6D3' },
        { name: 'Svježi Okusi', primary: '#2D6A4F', secondary: '#95D5B2', bg: '#FFFFFF', text: '#1B1B1B' },
        { name: 'Mediteran', primary: '#E07A5F', secondary: '#3D405B', bg: '#F4F1DE', text: '#2B2D42' },
    ],
    salon: [
        { name: 'Lux Rose', primary: '#D4A0A0', secondary: '#C97B84', bg: '#1A1A1A', text: '#FAF0F0' },
        { name: 'Pastelna Elegancija', primary: '#B8A9C9', secondary: '#D4C5E2', bg: '#FAFAFA', text: '#2D2D2D' },
        { name: 'Zlatni Sjaj', primary: '#D4AF37', secondary: '#B8860B', bg: '#0F0F0F', text: '#F5F0E1' },
        { name: 'Fresh Mint', primary: '#48BF91', secondary: '#36997A', bg: '#FFFFFF', text: '#1F2937' },
    ],
    majstor: [
        { name: 'Industrijski', primary: '#F59E0B', secondary: '#D97706', bg: '#111827', text: '#F9FAFB' },
        { name: 'Plavi Obrt', primary: '#2563EB', secondary: '#1D4ED8', bg: '#FFFFFF', text: '#1F2937' },
        { name: 'Robustan', primary: '#DC2626', secondary: '#991B1B', bg: '#18181B', text: '#FAFAFA' },
        { name: 'Zeleni Majstor', primary: '#16A34A', secondary: '#15803D', bg: '#F9FAFB', text: '#111827' },
    ],
    zdravlje: [
        { name: 'Čist & Pouzdan', primary: '#0EA5E9', secondary: '#0284C7', bg: '#FFFFFF', text: '#0F172A' },
        { name: 'Miran Prostor', primary: '#14B8A6', secondary: '#0D9488', bg: '#F0FDFA', text: '#134E4A' },
        { name: 'Premium Klinika', primary: '#6366F1', secondary: '#4F46E5', bg: '#0F0F1A', text: '#E0E7FF' },
        { name: 'Topla Skrb', primary: '#F97316', secondary: '#EA580C', bg: '#FFFBEB', text: '#1C1917' },
    ],
    turizam: [
        { name: 'Azure Mediteran', primary: '#0891B2', secondary: '#06B6D4', bg: '#FFFFFF', text: '#164E63' },
        { name: 'Sunset Villa', primary: '#F97316', secondary: '#FB923C', bg: '#1C1917', text: '#FEF3C7' },
        { name: 'Zeleni Raj', primary: '#22C55E', secondary: '#16A34A', bg: '#F0FDF4', text: '#14532D' },
        { name: 'Luksuzni Odmor', primary: '#A78BFA', secondary: '#7C3AED', bg: '#0C0A1A', text: '#EDE9FE' },
    ],
    b2b: [
        { name: 'Korporativni', primary: '#3B82F6', secondary: '#2563EB', bg: '#FFFFFF', text: '#1E293B' },
        { name: 'Tamni Profesional', primary: '#6366F1', secondary: '#818CF8', bg: '#020617', text: '#E2E8F0' },
        { name: 'Zeleni Rast', primary: '#10B981', secondary: '#059669', bg: '#F8FAFC', text: '#0F172A' },
        { name: 'Sivi Konzalting', primary: '#64748B', secondary: '#475569', bg: '#FFFFFF', text: '#1E293B' },
    ],
    edukacija: [
        { name: 'Akademski', primary: '#7C3AED', secondary: '#6D28D9', bg: '#FAFAFA', text: '#1E1B4B' },
        { name: 'Energična Škola', primary: '#F59E0B', secondary: '#EAB308', bg: '#1F2937', text: '#FEF9C3' },
        { name: 'Digitalna Učionica', primary: '#06B6D4', secondary: '#0891B2', bg: '#FFFFFF', text: '#164E63' },
        { name: 'Kreativna', primary: '#EC4899', secondary: '#DB2777', bg: '#FDF2F8', text: '#831843' },
    ],
    auto: [
        { name: 'Brzina', primary: '#EF4444', secondary: '#DC2626', bg: '#111111', text: '#FAFAFA' },
        { name: 'Premium Garaža', primary: '#F59E0B', secondary: '#D97706', bg: '#0A0A0A', text: '#FEF3C7' },
        { name: 'Pouzdani Servis', primary: '#2563EB', secondary: '#1D4ED8', bg: '#FFFFFF', text: '#1E3A5F' },
        { name: 'Zeleni Motor', primary: '#22C55E', secondary: '#16A34A', bg: '#0F1A0F', text: '#DCFCE7' },
    ],
    saas: [
        { name: 'Tech Indigo', primary: '#6366F1', secondary: '#818CF8', bg: '#020617', text: '#E2E8F0' },
        { name: 'Neon Startup', primary: '#8B5CF6', secondary: '#A78BFA', bg: '#0F0720', text: '#F5F3FF' },
        { name: 'Clean SaaS', primary: '#3B82F6', secondary: '#60A5FA', bg: '#FFFFFF', text: '#0F172A' },
        { name: 'Cyber', primary: '#22D3EE', secondary: '#06B6D4', bg: '#0A0A0F', text: '#ECFEFF' },
    ],
    nekretnine: [
        { name: 'Luksuzne Nekretnine', primary: '#B8860B', secondary: '#DAA520', bg: '#0F0F0F', text: '#F5F0E1' },
        { name: 'Moderna Agencija', primary: '#2563EB', secondary: '#3B82F6', bg: '#FFFFFF', text: '#1E293B' },
        { name: 'Zelena Parcela', primary: '#16A34A', secondary: '#22C55E', bg: '#F0FDF4', text: '#14532D' },
        { name: 'Urban Chic', primary: '#6B7280', secondary: '#4B5563', bg: '#18181B', text: '#F4F4F5' },
    ],
    teretana: [
        { name: 'Energija', primary: '#EF4444', secondary: '#F97316', bg: '#0A0A0A', text: '#FAFAFA' },
        { name: 'Snaga', primary: '#8B5CF6', secondary: '#7C3AED', bg: '#0F0720', text: '#F5F3FF' },
        { name: 'Fresh Fit', primary: '#22C55E', secondary: '#10B981', bg: '#FFFFFF', text: '#1F2937' },
        { name: 'Power Gym', primary: '#F59E0B', secondary: '#EAB308', bg: '#111111', text: '#FEF3C7' },
    ],
    fotograf: [
        { name: 'Minimalist Mono', primary: '#FAFAFA', secondary: '#A1A1AA', bg: '#0A0A0A', text: '#FAFAFA' },
        { name: 'Kreativni Studio', primary: '#EC4899', secondary: '#F472B6', bg: '#0F0F0F', text: '#FDF2F8' },
        { name: 'Vintage Warm', primary: '#D4A574', secondary: '#B8860B', bg: '#FAF7F0', text: '#3D2914' },
        { name: 'Moderni Portfolio', primary: '#6366F1', secondary: '#818CF8', bg: '#FFFFFF', text: '#1E1B4B' },
    ],
    default: [
        { name: 'Profesionalni', primary: '#3B82F6', secondary: '#2563EB', bg: '#FFFFFF', text: '#1E293B' },
        { name: 'Tamna Elegancija', primary: '#A78BFA', secondary: '#7C3AED', bg: '#0A0A0F', text: '#E2E8F0' },
        { name: 'Svježi Zeleni', primary: '#22C55E', secondary: '#16A34A', bg: '#F0FDF4', text: '#14532D' },
        { name: 'Topli Sunset', primary: '#F97316', secondary: '#EA580C', bg: '#1C1917', text: '#FEF3C7' },
    ],
};

// Map industry picker values to palette keys
function getPaletteKey(industry) {
    if (!industry) return 'default';
    const lower = industry.toLowerCase();

    const mapping = [
        [/restoran|pizzeria|bistro|konoba|caffe|bar|pub|kafić|grill|catering|ugostiteljstvo/, 'restoran'],
        [/salon|frizer|kozmetičar|beauty|spa|masaža|wellness/, 'salon'],
        [/majstor|vodoinstalater|električar|keramičar|stolar|bravar|soboslikar|obrt/, 'majstor'],
        [/stomatolog|zubar|doktor|psiholog|fizioterapeut|ordinacija|klinika|zdravstv|medicin|veterinar/, 'zdravlje'],
        [/apartman|vila|smještaj|hotel|hostel|turizam|kamp|pansion/, 'turizam'],
        [/knjigovodstvo|agencija|konzalting|marketing|odvjetnik|poslovn|b2b/, 'b2b'],
        [/autoškola|tečaj|škola|edukacij|seminar|akademija/, 'edukacija'],
        [/mehaničar|vulkanizer|rent.a.car|auto.*servis|autokuća|autopraonica/, 'auto'],
        [/saas|software|aplikacija|startup|tech|fintech|it\b/, 'saas'],
        [/nekretnin|real.estate/, 'nekretnine'],
        [/teretana|fitness|gym|crossfit|pilates|yoga|trening/, 'teretana'],
        [/fotograf|videograf|snimanje|foto.studio/, 'fotograf'],
    ];

    for (const [pattern, key] of mapping) {
        if (pattern.test(lower)) return key;
    }

    // Direct key match
    if (INDUSTRY_PALETTES[lower]) return lower;

    return 'default';
}

// Determine if a color is light or dark
function isLight(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

export default function ColorPaletteSection({ watch, setValue }) {
    const industry = watch('industry');
    const currentPrimary = watch('primaryColor');
    const currentSecondary = watch('secondaryColor');
    const currentBg = watch('backgroundColor');
    const currentText = watch('textColor');
    const autoColors = watch('autoColors') !== false;

    const [showCustom, setShowCustom] = useState(false);

    const paletteKey = useMemo(() => getPaletteKey(industry), [industry]);
    const palettes = INDUSTRY_PALETTES[paletteKey] || INDUSTRY_PALETTES.default;

    // Check which palette is currently selected (if any)
    const selectedPaletteIndex = useMemo(() => {
        if (autoColors) return -1;
        return palettes.findIndex(p =>
            p.primary === currentPrimary &&
            p.secondary === currentSecondary &&
            p.bg === currentBg &&
            p.text === currentText
        );
    }, [autoColors, palettes, currentPrimary, currentSecondary, currentBg, currentText]);

    const applyPalette = (palette) => {
        setValue('autoColors', false, { shouldDirty: true });
        setValue('primaryColor', palette.primary, { shouldDirty: true });
        setValue('secondaryColor', palette.secondary, { shouldDirty: true });
        setValue('backgroundColor', palette.bg, { shouldDirty: true });
        setValue('textColor', palette.text, { shouldDirty: true });
        setShowCustom(false);
    };

    const resetToAuto = () => {
        setValue('autoColors', true, { shouldDirty: true });
        setValue('primaryColor', '', { shouldDirty: true });
        setValue('secondaryColor', '', { shouldDirty: true });
        setValue('backgroundColor', '', { shouldDirty: true });
        setValue('textColor', '', { shouldDirty: true });
        setShowCustom(false);
    };

    return (
        <div className="space-y-4">
            {/* AI Auto Option */}
            <button
                type="button"
                onClick={resetToAuto}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left group"
                style={{
                    background: autoColors ? 'rgba(139,92,246,0.1)' : 'var(--lp-surface)',
                    border: autoColors ? '2px solid rgba(139,92,246,0.4)' : '1px solid var(--lp-border)',
                }}
            >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899, #F59E0B)', }}>
                    <Sparkles size={18} className="text-white" />
                </div>
                <div className="flex-1">
                    <span className="text-sm font-semibold block" style={{ color: autoColors ? '#A78BFA' : 'var(--lp-heading)' }}>
                        AI odabire boje
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--lp-text-muted)' }}>
                        AI automatski bira paletu boja prema industriji i sadržaju
                    </span>
                </div>
                {autoColors && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#8B5CF6' }}>
                        <Check size={14} className="text-white" />
                    </div>
                )}
            </button>

            {/* Industry Palettes */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{ color: 'var(--lp-text-muted)' }}>
                    Preporučeno za {industry || 'vašu industriju'}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                    {palettes.map((palette, idx) => {
                        const isSelected = !autoColors && selectedPaletteIndex === idx;
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => applyPalette(palette)}
                                className="group relative rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    border: isSelected ? '2px solid rgba(34,197,94,0.5)' : '1px solid var(--lp-border)',
                                    background: 'var(--lp-surface)',
                                }}
                            >
                                {/* Color Preview Bar */}
                                <div className="h-14 relative flex" style={{ background: palette.bg }}>
                                    {/* Large primary swatch */}
                                    <div className="absolute left-3 top-2 bottom-2 w-10 rounded-lg shadow-lg" style={{ background: palette.primary }} />
                                    {/* Secondary pill */}
                                    <div className="absolute left-[3.5rem] top-3.5 bottom-3.5 w-7 rounded-md shadow" style={{ background: palette.secondary }} />
                                    {/* Text sample */}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-right">
                                        <div className="text-[10px] font-bold leading-none" style={{ color: palette.text }}>Aa</div>
                                        <div className="text-[8px] mt-0.5" style={{ color: palette.text, opacity: 0.6 }}>Tekst</div>
                                    </div>
                                </div>
                                {/* Label */}
                                <div className="px-3 py-2 flex items-center justify-between">
                                    <span className="text-xs font-medium" style={{ color: 'var(--lp-heading)' }}>{palette.name}</span>
                                    {isSelected && (
                                        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#22c55e' }}>
                                            <Check size={10} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Custom Colors Toggle */}
            <div>
                <button
                    type="button"
                    onClick={() => setShowCustom(v => !v)}
                    className="flex items-center gap-2 text-xs font-medium transition-colors hover:opacity-80"
                    style={{ color: 'var(--lp-text-muted)' }}
                >
                    <Palette size={13} />
                    Prilagođene boje
                    <ChevronDown size={12} className={`transition-transform ${showCustom ? 'rotate-180' : ''}`} />
                </button>

                {showCustom && (
                    <div className="mt-3 grid grid-cols-2 gap-3 p-4 rounded-xl" style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)' }}>
                        <ColorInput
                            label="Primarna"
                            value={currentPrimary || '#3B82F6'}
                            onChange={(val) => {
                                setValue('autoColors', false, { shouldDirty: true });
                                setValue('primaryColor', val, { shouldDirty: true });
                            }}
                        />
                        <ColorInput
                            label="Sekundarna"
                            value={currentSecondary || '#2563EB'}
                            onChange={(val) => {
                                setValue('autoColors', false, { shouldDirty: true });
                                setValue('secondaryColor', val, { shouldDirty: true });
                            }}
                        />
                        <ColorInput
                            label="Pozadina"
                            value={currentBg || '#FFFFFF'}
                            onChange={(val) => {
                                setValue('autoColors', false, { shouldDirty: true });
                                setValue('backgroundColor', val, { shouldDirty: true });
                            }}
                        />
                        <ColorInput
                            label="Tekst"
                            value={currentText || '#1E293B'}
                            onChange={(val) => {
                                setValue('autoColors', false, { shouldDirty: true });
                                setValue('textColor', val, { shouldDirty: true });
                            }}
                        />

                        {/* Live preview */}
                        <div className="col-span-2 rounded-xl overflow-hidden" style={{ border: '1px solid var(--lp-border)' }}>
                            <div className="p-4" style={{ background: currentBg || '#FFFFFF' }}>
                                <h4 className="text-sm font-bold mb-1" style={{ color: currentPrimary || '#3B82F6' }}>
                                    Primjer naslova
                                </h4>
                                <p className="text-xs" style={{ color: currentText || '#1E293B' }}>
                                    Ovako će izgledati tekst na vašoj stranici.
                                </p>
                                <div className="flex gap-2 mt-2.5">
                                    <span className="text-[10px] font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: currentPrimary || '#3B82F6' }}>
                                        Primarni gumb
                                    </span>
                                    <span
                                        className="text-[10px] font-semibold px-3 py-1.5 rounded-lg"
                                        style={{
                                            background: currentSecondary || '#2563EB',
                                            color: isLight(currentSecondary || '#2563EB') ? '#1E293B' : '#FFFFFF'
                                        }}
                                    >
                                        Sekundarni
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ColorInput({ label, value, onChange }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[11px] font-medium" style={{ color: 'var(--lp-text-muted)' }}>{label}</label>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div
                        className="w-8 h-8 rounded-lg border cursor-pointer shadow-sm"
                        style={{ background: value, borderColor: 'var(--lp-border)' }}
                    />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
                    }}
                    className="flex-1 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-white/20"
                    style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }}
                    placeholder="#000000"
                />
            </div>
        </div>
    );
}
