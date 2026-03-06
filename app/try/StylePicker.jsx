'use client';

import { useState } from 'react';
import { Check, Bot } from 'lucide-react';
import { STYLES } from '@/lib/styles';

// Re-export for backward compatibility
export { STYLES };

const CATEGORIES = ['Moderno & Tehnološki', 'Kreativno & Odvažno', 'Elegantno & Premium', 'Specifične niše'];

export default function StylePicker({ selected, onSelect }) {
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);

    const stylesInCategory = Object.entries(STYLES).filter(
        ([, s]) => s.category === activeCategory
    );

    return (
        <div className="w-full">
            {/* Category tabs */}
            <div className="flex gap-2 flex-wrap mb-5">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            activeCategory === cat
                                ? 'bg-white text-black'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Style grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* "Let AI decide" option */}
                {activeCategory === CATEGORIES[0] && (
                    <button
                        onClick={() => onSelect(null)}
                        className={`relative flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all ${
                            selected === null
                                ? 'border-white bg-white/8'
                                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
                        }`}
                    >
                        {selected === null && (
                            <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                                <Check size={10} className="text-black" />
                            </span>
                        )}
                        <Bot size={20} />
                        <span className="text-xs font-bold text-white">AI odabir</span>
                        <span className="text-[10px] text-zinc-500 leading-tight">AI sam bira najbolji stil</span>
                    </button>
                )}

                {stylesInCategory.map(([key, style]) => (
                    <button
                        key={key}
                        onClick={() => onSelect(key)}
                        className={`relative flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all ${
                            selected === key
                                ? 'border-white bg-white/8'
                                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
                        }`}
                    >
                        {selected === key && (
                            <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                                <Check size={10} className="text-black" />
                            </span>
                        )}
                        <span className="text-xl leading-none">{style.emoji}</span>
                        <span className="text-xs font-bold text-white leading-tight">{style.label}</span>
                        <span className="text-[10px] text-zinc-500 leading-tight">{style.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
