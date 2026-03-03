'use client';

import { useEffect, useState } from 'react';
import { Cpu, Check, RefreshCw, Edit3 } from 'lucide-react';

const PRESET_MODELS = [
    { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', badge: 'Najnoviji' },
    { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro', badge: 'Stabilan' },
];

export default function AdminSettingsPage() {
    const [primary, setPrimary] = useState('');
    const [fallback, setFallback] = useState('');
    const [customPrimary, setCustomPrimary] = useState('');
    const [customFallback, setCustomFallback] = useState('');
    const [showCustomPrimary, setShowCustomPrimary] = useState(false);
    const [showCustomFallback, setShowCustomFallback] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetch('/api/admin/config')
            .then(r => r.json())
            .then(data => {
                setPrimary(data.aiPrimaryModel || 'gemini-3.1-pro-preview');
                setFallback(data.aiFallbackModel || 'gemini-3-pro-preview');
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const save = async (newPrimary, newFallback) => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aiPrimaryModel: newPrimary || primary,
                    aiFallbackModel: newFallback || fallback,
                }),
            });
            if (!res.ok) throw new Error('Failed');
            setPrimary(newPrimary || primary);
            setFallback(newFallback || fallback);
            showToast('Model postavke spremljene!');
        } catch {
            showToast('Greška pri spremanju.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePresetClick = (modelId, type) => {
        if (type === 'primary') {
            setPrimary(modelId);
            setShowCustomPrimary(false);
            save(modelId, null);
        } else {
            setFallback(modelId);
            setShowCustomFallback(false);
            save(null, modelId);
        }
    };

    const handleCustomSave = (type) => {
        const val = type === 'primary' ? customPrimary.trim() : customFallback.trim();
        if (!val) return;
        if (type === 'primary') {
            setPrimary(val);
            save(val, null);
        } else {
            setFallback(val);
            save(null, val);
        }
    };

    if (loading) {
        return (
            <div className="p-6 md:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-7 rounded w-48" style={{ background: 'var(--lp-surface)' }} />
                    <div className="h-48 rounded-xl" style={{ background: 'var(--lp-surface)' }} />
                </div>
            </div>
        );
    }

    const isPreset = (id) => PRESET_MODELS.some(m => m.id === id);

    return (
        <div className="p-6 md:p-8 db-fade-in">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl animate-in fade-in slide-in-from-top-2"
                    style={{
                        background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                        border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                        color: toast.type === 'error' ? '#f87171' : '#4ade80',
                    }}>
                    <Check size={14} />
                    {toast.msg}
                </div>
            )}

            <div className="mb-6">
                <h1 className="text-xl font-bold" style={{ color: 'var(--lp-heading)' }}>Postavke</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>Sistemske postavke aplikacije</p>
            </div>

            {/* AI Model Selection */}
            <div className="db-card p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                        <Cpu size={18} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm" style={{ color: 'var(--lp-heading)' }}>AI Model</h2>
                        <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Odaberite model za generiranje web stranica</p>
                    </div>
                </div>

                {/* Primary Model */}
                <ModelSelector
                    label="Primarni Model"
                    description="Koristi se za sve generiranje"
                    current={primary}
                    saving={saving}
                    showCustom={showCustomPrimary}
                    customValue={customPrimary}
                    onCustomChange={setCustomPrimary}
                    onToggleCustom={() => setShowCustomPrimary(!showCustomPrimary)}
                    onPresetClick={(id) => handlePresetClick(id, 'primary')}
                    onCustomSave={() => handleCustomSave('primary')}
                    accentColor="rgba(139,92,246,0.8)"
                />

                <div style={{ borderTop: '1px solid var(--lp-border)' }} />

                {/* Fallback Model */}
                <ModelSelector
                    label="Fallback Model"
                    description="Koristi se kada primarni nije dostupan (503, timeout)"
                    current={fallback}
                    saving={saving}
                    showCustom={showCustomFallback}
                    customValue={customFallback}
                    onCustomChange={setCustomFallback}
                    onToggleCustom={() => setShowCustomFallback(!showCustomFallback)}
                    onPresetClick={(id) => handlePresetClick(id, 'fallback')}
                    onCustomSave={() => handleCustomSave('fallback')}
                    accentColor="rgba(59,130,246,0.8)"
                />
            </div>
        </div>
    );
}

function ModelSelector({ label, description, current, saving, showCustom, customValue, onCustomChange, onToggleCustom, onPresetClick, onCustomSave, accentColor }) {
    const isPreset = PRESET_MODELS.some(m => m.id === current);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--lp-heading)' }}>{label}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>{description}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    {current}
                </div>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_MODELS.map(m => {
                    const isActive = current === m.id;
                    return (
                        <button
                            key={m.id}
                            onClick={() => !isActive && !saving && onPresetClick(m.id)}
                            disabled={saving}
                            className="relative flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                            style={{
                                background: isActive ? `${accentColor.replace('0.8', '0.1')}` : 'var(--lp-surface)',
                                border: `1.5px solid ${isActive ? accentColor : 'var(--lp-border)'}`,
                                opacity: saving ? 0.6 : 1,
                                cursor: saving ? 'wait' : isActive ? 'default' : 'pointer',
                            }}
                        >
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: isActive ? accentColor : 'var(--lp-border)' }}>
                                {isActive
                                    ? <Check size={16} className="text-white" />
                                    : <Cpu size={16} style={{ color: 'var(--lp-text-muted)' }} />
                                }
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--lp-heading)' }}>
                                        {m.label}
                                    </span>
                                    {m.badge && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                                            style={{
                                                background: isActive ? 'rgba(255,255,255,0.15)' : 'var(--lp-border)',
                                                color: isActive ? 'white' : 'var(--lp-text-muted)',
                                            }}>
                                            {m.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] truncate" style={{ color: 'var(--lp-text-muted)' }}>
                                    {m.id}
                                </p>
                            </div>
                            {saving && isActive && (
                                <RefreshCw size={14} className="absolute top-3 right-3 animate-spin" style={{ color: accentColor }} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Custom Model */}
            <div>
                <button
                    onClick={onToggleCustom}
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                    style={{ color: showCustom ? '#a78bfa' : 'var(--lp-text-muted)' }}
                >
                    <Edit3 size={12} />
                    {showCustom ? 'Sakrij custom' : 'Ili unesite drugi model'}
                </button>

                {showCustom && (
                    <div className="flex gap-2 mt-2">
                        <input
                            type="text"
                            value={customValue}
                            onChange={e => onCustomChange(e.target.value)}
                            placeholder="npr. gemini-3.5-pro-preview"
                            className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1"
                            style={{
                                background: 'var(--lp-surface)',
                                border: '1px solid var(--lp-border)',
                                color: 'var(--lp-heading)',
                            }}
                            onKeyDown={e => e.key === 'Enter' && onCustomSave()}
                        />
                        <button
                            onClick={onCustomSave}
                            disabled={!customValue.trim() || saving}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                            style={{
                                background: customValue.trim() ? accentColor : 'var(--lp-border)',
                                opacity: saving ? 0.6 : 1,
                            }}
                        >
                            {saving ? <RefreshCw size={14} className="animate-spin" /> : 'Spremi'}
                        </button>
                    </div>
                )}

                {!isPreset && !showCustom && (
                    <p className="text-[11px] mt-1" style={{ color: '#f59e0b' }}>
                        ⚠️ Koristi se custom model: <strong>{current}</strong>
                    </p>
                )}
            </div>
        </div>
    );
}
