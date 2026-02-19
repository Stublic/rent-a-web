'use client';

import { useState, useRef, useEffect } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

export default function TrialPreview({ html, isGenerating }) {
    const [refreshKey, setRefreshKey] = useState(0);
    const iframeRef = useRef(null);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const openInNewTab = () => {
        const newWindow = window.open();
        if (newWindow && html) {
            newWindow.document.write(html);
            newWindow.document.close();
        }
    };

    // Prevent navigation inside iframe
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleIframeLoad = () => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc) return;

                iframeDoc.addEventListener('click', (e) => {
                    const target = e.target.closest('a');
                    if (target && target.tagName === 'A') {
                        e.preventDefault();
                        const href = target.getAttribute('href');
                        if (href?.startsWith('#')) {
                            const element = iframeDoc.querySelector(href);
                            if (element) element.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                });
            } catch (error) {
                console.warn('Cannot access iframe content');
            }
        };

        iframe.addEventListener('load', handleIframeLoad);
        return () => iframe.removeEventListener('load', handleIframeLoad);
    }, [refreshKey, html]);

    return (
        <div className="h-full flex flex-col bg-zinc-950">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                <h2 className="font-bold text-white text-sm">Preview</h2>
                {html && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors text-zinc-300"
                        >
                            <RefreshCw size={14} />
                            Osvježi
                        </button>
                        <button
                            onClick={openInNewTab}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors text-zinc-300"
                        >
                            <ExternalLink size={14} />
                            Novi Tab
                        </button>
                    </div>
                )}
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-white relative overflow-auto">
                {isGenerating ? (
                    // Skeleton Loader
                    <div className="w-full h-full bg-zinc-900 p-6 animate-pulse">
                        {/* Navbar skeleton */}
                        <div className="flex items-center justify-between mb-12">
                            <div className="h-8 w-32 bg-zinc-800 rounded-lg" />
                            <div className="flex gap-4">
                                <div className="h-4 w-16 bg-zinc-800 rounded" />
                                <div className="h-4 w-16 bg-zinc-800 rounded" />
                                <div className="h-4 w-16 bg-zinc-800 rounded" />
                            </div>
                        </div>
                        {/* Hero skeleton */}
                        <div className="flex flex-col items-center justify-center mt-16 space-y-6">
                            <div className="h-12 w-3/4 bg-zinc-800 rounded-xl" />
                            <div className="h-6 w-1/2 bg-zinc-800/60 rounded-lg" />
                            <div className="h-12 w-48 bg-zinc-800 rounded-xl mt-4" />
                        </div>
                        {/* Cards skeleton */}
                        <div className="grid grid-cols-3 gap-6 mt-24 max-w-3xl mx-auto">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-zinc-800/50 rounded-2xl p-6 space-y-4">
                                    <div className="h-12 w-12 bg-zinc-700 rounded-xl" />
                                    <div className="h-4 w-24 bg-zinc-700 rounded" />
                                    <div className="h-3 w-full bg-zinc-800 rounded" />
                                    <div className="h-3 w-3/4 bg-zinc-800 rounded" />
                                </div>
                            ))}
                        </div>
                        {/* Loading text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/80 backdrop-blur-sm rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl border border-zinc-700">
                                <div className="relative w-10 h-10">
                                    <div className="absolute inset-0 border-2 border-zinc-600 rounded-full" />
                                    <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                                <p className="text-white font-semibold">AI generira stranicu...</p>
                                <p className="text-zinc-400 text-xs">Ovo može potrajati do 30 sekundi</p>
                            </div>
                        </div>
                    </div>
                ) : html ? (
                    <iframe
                        ref={iframeRef}
                        key={refreshKey}
                        srcDoc={html}
                        className="w-full h-full border-0"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                        title="Website Preview"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-zinc-900">
                        <div className="text-center space-y-3">
                            <div className="text-4xl">🌐</div>
                            <p className="text-zinc-400 text-sm">Tvoja web stranica će se pojaviti ovdje</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
