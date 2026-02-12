"use client";

import { useState, useRef, useEffect } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

export default function EditorPreview({ html, projectId }) {
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

                // Intercept all link clicks
                iframeDoc.addEventListener('click', (e) => {
                    const target = e.target.closest('a');
                    if (target && target.tagName === 'A') {
                        e.preventDefault();
                        const href = target.getAttribute('href');
                        
                        if (href) {
                            // If it's an external link, open in new tab
                            if (href.startsWith('http://') || href.startsWith('https://')) {
                                window.open(href, '_blank');
                            } 
                            // If it's an internal link (like #section), scroll in iframe
                            else if (href.startsWith('#')) {
                                const element = iframeDoc.querySelector(href);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth' });
                                }
                            }
                            // For other links (like /editor, /dashboard), ignore or open in parent
                            else if (href.startsWith('/')) {
                                // Ignore navigation to app routes
                                console.log('Prevented navigation to:', href);
                            }
                        }
                    }
                });
            } catch (error) {
                // Cross-origin error - iframe is from different domain
                console.warn('Cannot access iframe content (cross-origin)');
            }
        };

        iframe.addEventListener('load', handleIframeLoad);
        
        // Also run on initial mount if iframe already loaded
        if (iframe.contentDocument?.readyState === 'complete') {
            handleIframeLoad();
        }

        return () => {
            iframe.removeEventListener('load', handleIframeLoad);
        };
    }, [refreshKey]);

    return (
        <div className="h-full flex flex-col bg-zinc-950">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                <h2 className="font-bold text-white">Live Preview</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium flex items-center gap-2 transition-colors"
                        title="Osvježi preview"
                    >
                        <RefreshCw size={16} />
                        <span className="hidden sm:inline">Osvježi</span>
                    </button>
                    <button
                        onClick={openInNewTab}
                        className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium flex items-center gap-2 transition-colors"
                        title="Otvori u novom tabu"
                    >
                        <ExternalLink size={16} />
                        <span className="hidden sm:inline">Novi Tab</span>
                    </button>
                </div>
            </div>

            {/* Preview */}
            <div className="flex-1 bg-white relative overflow-auto">
                {html ? (
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
                        <p className="text-zinc-500">Nema generiranog HTML-a za prikaz</p>
                    </div>
                )}
            </div>
        </div>
    );
}
