'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Lightweight contextual tooltip for micro-guidance.
 * Hover or tap on the (?) icon to reveal the tooltip text.
 * 
 * Props:
 * - text: string — the tooltip content
 * - size?: number — icon size (default 13)
 * - side?: 'top' | 'bottom' | 'left' | 'right' (default 'top')
 * - maxWidth?: number (default 240)
 * - iconClassName?: string — extra classes for the icon
 */
export default function InfoTooltip({ text, size = 13, side = 'top', maxWidth = 240, iconClassName = '' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click (for mobile tap)
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const positionStyles = {
        top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
        bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
        left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 },
        right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 },
    };

    const arrowStyles = {
        top: { bottom: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
        bottom: { top: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
        left: { right: -4, top: '50%', transform: 'translateY(-50%) rotate(45deg)' },
        right: { left: -4, top: '50%', transform: 'translateY(-50%) rotate(45deg)' },
    };

    return (
        <span
            ref={ref}
            className="relative inline-flex items-center"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }}
            style={{ cursor: 'help' }}
        >
            <HelpCircle
                size={size}
                className={`transition-colors ${iconClassName}`}
                style={{ color: open ? 'var(--lp-heading, #fff)' : 'var(--lp-text-muted, #71717a)' }}
            />

            {open && (
                <span
                    className="absolute z-[200] pointer-events-none"
                    style={{
                        ...positionStyles[side],
                        width: maxWidth,
                        maxWidth: 'calc(100vw - 32px)',
                    }}
                >
                    {/* Arrow */}
                    <span
                        className="absolute w-2 h-2"
                        style={{
                            ...arrowStyles[side],
                            background: '#27272a',
                            borderRight: '1px solid #3f3f46',
                            borderBottom: '1px solid #3f3f46',
                        }}
                    />
                    {/* Body */}
                    <span
                        className="block rounded-xl px-3 py-2 text-[11px] leading-relaxed font-medium shadow-xl"
                        style={{
                            background: '#27272a',
                            border: '1px solid #3f3f46',
                            color: '#a1a1aa',
                        }}
                    >
                        {text}
                    </span>
                </span>
            )}
        </span>
    );
}
