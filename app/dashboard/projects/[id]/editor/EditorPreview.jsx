"use client";

import { useState, useRef, useEffect } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

export default function EditorPreview({ html, projectId }) {
    const [refreshKey, setRefreshKey] = useState(0);
    const iframeRef = useRef(null);

    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const openInNewTab = () => {
        const newWindow = window.open();
        if (newWindow && html) { newWindow.document.write(html); newWindow.document.close(); }
    };

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
                        if (href) {
                            if (href.startsWith('http://') || href.startsWith('https://')) window.open(href, '_blank');
                            else if (href.startsWith('#')) { const el = iframeDoc.querySelector(href); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                        }
                    }
                });
            } catch (error) { console.warn('Cannot access iframe content (cross-origin)'); }
        };
        iframe.addEventListener('load', handleIframeLoad);
        if (iframe.contentDocument?.readyState === 'complete') handleIframeLoad();
        return () => iframe.removeEventListener('load', handleIframeLoad);
    }, [refreshKey]);

    return (
        <div className="h-full flex flex-col" style={{ background: 'var(--lp-bg)' }}>
            {/* Header */}
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'var(--lp-bg-alt)', borderBottom: '1px solid var(--lp-border)' }}>
                <h2 className="font-bold text-sm" style={{ color: 'var(--lp-heading)' }}>Live Preview</h2>
                <div className="flex items-center gap-1.5">
                    <button onClick={handleRefresh} className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:bg-white/5" style={{ color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }} title="Osvježi preview">
                        <RefreshCw size={13} /><span className="hidden sm:inline">Osvježi</span>
                    </button>
                    <button onClick={openInNewTab} className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:bg-white/5" style={{ color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }} title="Otvori u novom tabu">
                        <ExternalLink size={13} /><span className="hidden sm:inline">Novi Tab</span>
                    </button>
                </div>
            </div>

            {/* Preview */}
            <div className="flex-1 bg-white relative overflow-auto">
                {html ? (
                    <iframe ref={iframeRef} key={refreshKey} srcDoc={html} className="w-full h-full border-0" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" title="Website Preview" />
                ) : (
                    <div className="flex items-center justify-center h-full" style={{ background: 'var(--lp-bg)' }}>
                        <p className="text-sm" style={{ color: 'var(--lp-text-muted)' }}>Nema generiranog HTML-a za prikaz</p>
                    </div>
                )}
            </div>
        </div>
    );
}
