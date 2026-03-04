"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { INDUSTRY_OPTIONS } from "@/lib/industry-options";

/**
 * Searchable industry picker dropdown.
 * Shows all industries, filters by label + keywords as user types.
 * Stores the value (e.g. 'restoran') and shows the label (e.g. '🍽️ Restoran / Ugostiteljstvo').
 */
export default function IndustryPicker({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Find current option label
    const currentOption = INDUSTRY_OPTIONS.find(o => o.value === value);

    // Filter options based on search
    const filtered = search.trim()
        ? INDUSTRY_OPTIONS.filter(opt => {
            const q = search.toLowerCase();
            return (
                opt.label.toLowerCase().includes(q) ||
                opt.value.toLowerCase().includes(q) ||
                opt.keywords.some(k => k.toLowerCase().includes(q))
            );
        })
        : INDUSTRY_OPTIONS;

    // Close on outside click
    useEffect(() => {
        function handleClick(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setSearch("");
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Focus search input when opened
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const handleSelect = (opt) => {
        onChange(opt.value);
        setOpen(false);
        setSearch("");
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                style={{
                    background: 'var(--db-surface)',
                    border: '1px solid var(--db-border)',
                    color: currentOption ? 'var(--db-heading)' : 'var(--db-text-muted)',
                }}
            >
                <span className="truncate">
                    {currentOption ? currentOption.label : 'Odaberite industriju...'}
                </span>
                <ChevronDown
                    size={16}
                    className="shrink-0 transition-transform"
                    style={{
                        color: 'var(--db-text-muted)',
                        transform: open ? 'rotate(180deg)' : 'none',
                    }}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden shadow-2xl"
                    style={{
                        background: 'var(--db-bg-alt)',
                        border: '1px solid var(--db-border)',
                        maxHeight: '320px',
                    }}
                >
                    {/* Search input */}
                    <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--db-border)' }}>
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--db-text-muted)' }} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Pretražite industriju..."
                                className="w-full pl-8 pr-8 py-2 text-sm rounded-lg focus:outline-none"
                                style={{
                                    background: 'var(--db-surface)',
                                    border: '1px solid var(--db-border)',
                                    color: 'var(--db-heading)',
                                }}
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/5"
                                >
                                    <X size={12} style={{ color: 'var(--db-text-muted)' }} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options list */}
                    <div className="overflow-y-auto" style={{ maxHeight: '250px' }}>
                        {filtered.length > 0 ? (
                            filtered.map(opt => {
                                const isSelected = opt.value === value;
                                // Show matching keywords when searching
                                const matchingKeywords = search.trim()
                                    ? opt.keywords.filter(k => k.toLowerCase().includes(search.toLowerCase())).slice(0, 3)
                                    : [];

                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleSelect(opt)}
                                        className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between"
                                        style={{
                                            background: isSelected ? 'rgba(139,92,246,0.1)' : 'transparent',
                                            color: isSelected ? '#a78bfa' : 'var(--db-heading)',
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) e.currentTarget.style.background = 'var(--db-surface)';
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate">{opt.label}</div>
                                            {matchingKeywords.length > 0 && (
                                                <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--db-text-muted)' }}>
                                                    {matchingKeywords.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <span className="text-xs shrink-0 ml-2" style={{ color: '#a78bfa' }}>✓</span>
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--db-text-muted)' }}>
                                Nema rezultata za "{search}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
