"use client";

import { useState, useEffect } from "react";

const STEPS = [
    "Učitavanje podataka...",
    "Priprema sučelja...",
    "Gotovo!",
];

/**
 * DashboardLoader — Premium branded loader for the dashboard.
 * Shows animated Webica logo, rotating status messages, and a progress bar.
 * 
 * @param {string} message - Optional custom message
 * @param {boolean} inline - If true, renders compact (no full-screen)
 * @param {string[]} steps - Custom step messages
 */
export default function DashboardLoader({ message, inline = false, steps }) {
    const [stepIndex, setStepIndex] = useState(0);
    const displaySteps = steps || STEPS;

    useEffect(() => {
        if (stepIndex >= displaySteps.length - 1) return;
        const t = setTimeout(() => setStepIndex(i => Math.min(i + 1, displaySteps.length - 1)), 1200);
        return () => clearTimeout(t);
    }, [stepIndex, displaySteps.length]);

    const progress = ((stepIndex + 1) / displaySteps.length) * 100;

    if (inline) {
        return (
            <div className="flex flex-col items-center gap-3 py-12">
                <div className="db-loader-ring">
                    <div className="db-loader-ring-inner" />
                </div>
                <p className="text-sm text-[var(--db-text-muted)] animate-pulse">
                    {message || displaySteps[stepIndex]}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-6 max-w-xs w-full px-6">
                {/* Animated logo */}
                <div className="relative">
                    <div className="db-loader-ring">
                        <div className="db-loader-ring-inner" />
                    </div>
                    {/* Glow */}
                    <div className="absolute inset-0 rounded-full bg-white/5 blur-xl scale-150 animate-pulse" />
                </div>

                {/* Step text */}
                <p className="text-sm font-medium text-[var(--db-text-secondary)] text-center transition-all duration-300">
                    {message || displaySteps[stepIndex]}
                </p>

                {/* Progress bar */}
                <div className="w-full h-1 bg-[color:var(--db-surface)] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white/80 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * TabLoader — Lighter loader for tab content loading
 */
export function TabLoader({ message = "Učitavanje..." }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 db-fade-in">
            <div className="db-loader-ring">
                <div className="db-loader-ring-inner" />
            </div>
            <p className="text-sm text-[var(--db-text-muted)]">{message}</p>
        </div>
    );
}

/**
 * ButtonLoader — Inline spinner for buttons
 */
export function ButtonLoader({ size = 16 }) {
    return (
        <svg
            className="animate-spin"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
        >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.25" />
            <path d="M12 2v4" />
        </svg>
    );
}
