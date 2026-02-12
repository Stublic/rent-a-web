"use client";

import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Loader2, ExternalLink } from 'lucide-react';

export default function PreviewPanel({ project }) {
    const [showPreview, setShowPreview] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);

    // Refresh iframe when project updates
    useEffect(() => {
        setIframeKey(prev => prev + 1);
    }, [project.generatedHtml]);

    if (!project.generatedHtml) {
        return null;
    }

    const openInNewTab = () => {
        const blob = new Blob([project.generatedHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-4">
            {/* Preview Controls */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                        showPreview
                            ? 'bg-zinc-800 text-white border border-zinc-700'
                            : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/30'
                    }`}
                >
                    {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
                    {showPreview ? 'Sakrij Preview' : 'Prikaži Preview'}
                </button>

                <button
                    onClick={openInNewTab}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-semibold transition-all"
                >
                    <ExternalLink size={18} />
                    Otvori u Novom Tabu
                </button>
            </div>

            {/* Preview Iframe */}
            {showPreview && (
                <div className="border-2 border-green-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-zinc-500 text-xs font-mono ml-2">preview.html</span>
                    </div>
                    <PreviewIframe html={project.generatedHtml} iframeKey={iframeKey} />
                </div>
            )}
        </div>
    );
}

// Separate component to handle iframe with navigation prevention
function PreviewIframe({ html, iframeKey }) {
    const iframeRef = useRef(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleIframeLoad = () => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc) return;

                // Intercept all link clicks
                iframeDoc.addEventListener('click', (e) => {
                    const target = e.target.closest('a');
                    if (target && target.tagName === 'A') {
                        e.preventDefault();
                        const href = target.getAttribute('href');
                        
                        if (href) {
                            // External links open in new tab
                            if (href.startsWith('http://') || href.startsWith('https://')) {
                                window.open(href, '_blank');
                            } 
                            // Hash links scroll within iframe
                            else if (href.startsWith('#')) {
                                const element = iframeDoc.querySelector(href);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth' });
                                }
                            }
                            // Block app routes
                            else if (href.startsWith('/')) {
                                console.log('Prevented navigation to:', href);
                            }
                        }
                    }
                });
            } catch (error) {
                console.warn('Cannot access iframe content (cross-origin)');
            }
        };

        iframe.addEventListener('load', handleIframeLoad);
        
        if (iframe.contentDocument?.readyState === 'complete') {
            handleIframeLoad();
        }

        return () => {
            iframe.removeEventListener('load', handleIframeLoad);
        };
    }, [iframeKey]);

    return (
        <iframe
            ref={iframeRef}
            key={iframeKey}
            srcDoc={html}
            className="w-full h-[600px] bg-white"
            title="Website Preview"
            sandbox="allow-scripts allow-same-origin"
        />
    );
}
