"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";

export default function ExportDownloadButton({ projectId, projectName }) {
    const [loading, setLoading] = useState(false);

    async function handleDownload() {
        setLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/export`);

            if (!res.ok) {
                const text = await res.text();
                alert(text || 'Greška pri preuzimanju.');
                return;
            }

            const blob = await res.blob();

            // Create safe ASCII filename
            const safeName = (projectName || 'website')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[đĐ]/g, 'd')
                .replace(/[^a-zA-Z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .toLowerCase()
                .substring(0, 50) || 'website';

            // file-saver works reliably across all browsers including Chrome
            saveAs(blob, `${safeName}-export.zip`);
        } catch (err) {
            console.error('Download error:', err);
            alert('Greška pri preuzimanju. Pokušajte ponovo.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className="font-semibold text-sm px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-wait cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white' }}
        >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {loading ? 'Preuzimanje...' : 'Preuzmi stranicu (.zip)'}
        </button>
    );
}
