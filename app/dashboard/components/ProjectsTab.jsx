"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, Loader2, Zap, Sparkles, ChevronRight, Clock, RefreshCw, Lock } from "lucide-react";
import Link from "next/link";

const GRACE_PERIOD_DAYS = 90;

function getDaysLeft(cancelledAt) {
    if (!cancelledAt) return null;
    const cancelled = new Date(cancelledAt);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - cancelled.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, GRACE_PERIOD_DAYS - daysSince);
}

export default function ProjectsTab() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [renewingProjectId, setRenewingProjectId] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch("/api/projects");
                const data = await res.json();
                if (Array.isArray(data)) {
                    setProjects(data);
                } else {
                    console.error("Failed to fetch projects:", data);
                    setProjects([]);
                }
            } catch (err) {
                console.error(err);
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const activeProjects = projects.filter(p => !p.cancelledAt);
    const cancelledProjects = projects.filter(p => p.cancelledAt);

    const handleRenew = async (projectId) => {
        setRenewingProjectId(projectId);
        try {
            const res = await fetch('/api/renew-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Greška pri obnovi.');
            }
        } catch (err) {
            console.error('Renew error:', err);
            alert('Došlo je do greške.');
        } finally {
            setRenewingProjectId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Moji Projekti</h2>
                    <p className="text-zinc-400">Upravljajte svojim web stranicama</p>
                </div>
                <Link id="tour-new-project" href="/dashboard/new-project" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
                    <Zap size={18} />
                    <span className="hidden sm:inline">Novi projekt</span>
                </Link>
            </div>

            {/* Active Projects */}
            {activeProjects.length === 0 && cancelledProjects.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800 rounded-3xl border-dashed">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-500">
                        <LayoutDashboard size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Nemate aktivnih projekata</h3>
                    <p className="text-zinc-500 mb-6 max-w-sm mx-auto">Započnite svoje putovanje odabirom paketa i kreiranjem prve web stranice.</p>
                    <Link href="/dashboard/new-project" className="text-green-500 font-bold hover:underline">
                        Kreiraj prvi projekt
                    </Link>
                </div>
            ) : (
                <>
                    {activeProjects.length > 0 && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeProjects.map((project) => (
                                <div key={project.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl ${project.status === 'LIVE' ? 'bg-green-500' : 'bg-zinc-800'}`}>
                                            {project.name.charAt(0)}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${project.status === 'LIVE' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                                            {project.status === 'LIVE' ? 'Aktivan' : 'U izradi'}
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-bold text-lg mb-1">{project.name}</h3>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-xs text-zinc-600">{project.domain || "Domena u pripremi"}</span>
                                        <Link 
                                            href={`/dashboard/projects/${project.id}/content`} 
                                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                                                project.status === 'DRAFT' 
                                                    ? "bg-white text-black hover:bg-zinc-200" 
                                                    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                                            }`}
                                        >
                                            {project.status === 'DRAFT' ? (
                                                <>
                                                    <Sparkles size={16} /> Kreiraj Web
                                                </>
                                            ) : (
                                                <>
                                                    Uredi <ChevronRight size={16} />
                                                </>
                                            )}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Cancelled Projects */}
                    {cancelledProjects.length > 0 && (
                        <div className={activeProjects.length > 0 ? 'mt-10' : ''}>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Clock size={20} className="text-amber-500" />
                                Otkazani projekti
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cancelledProjects.map((project) => {
                                    const daysLeft = getDaysLeft(project.cancelledAt);
                                    const urgency = daysLeft <= 7 ? 'critical' : daysLeft <= 30 ? 'high' : 'normal';

                                    return (
                                        <div 
                                            key={project.id} 
                                            className={`border rounded-2xl p-6 transition-all opacity-70 ${
                                                urgency === 'critical' 
                                                    ? 'bg-red-500/5 border-red-500/20' 
                                                    : urgency === 'high' 
                                                        ? 'bg-amber-500/5 border-amber-500/20' 
                                                        : 'bg-zinc-900/30 border-zinc-800'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-zinc-600 font-bold text-xl bg-zinc-800/50">
                                                    {project.name.charAt(0)}
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                    urgency === 'critical'
                                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                }`}>
                                                    Briše se za {daysLeft}d
                                                </div>
                                            </div>
                                            
                                            <h3 className="font-bold text-lg mb-1 text-zinc-400">{project.name}</h3>
                                            
                                            {/* Progress bar */}
                                            <div className="mt-3 mb-4">
                                                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            urgency === 'critical' ? 'bg-red-500' :
                                                            urgency === 'high' ? 'bg-amber-500' : 'bg-zinc-500'
                                                        }`}
                                                        style={{ width: `${Math.max(2, (daysLeft / GRACE_PERIOD_DAYS) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-zinc-600">
                                                    Otkazano {new Date(project.cancelledAt).toLocaleDateString('hr-HR')}
                                                </span>
                                            <button 
                                                onClick={() => handleRenew(project.id)}
                                                disabled={renewingProjectId === project.id}
                                                className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 bg-green-600/10 text-green-500 hover:bg-green-600/20 transition-all disabled:opacity-50"
                                            >
                                                {renewingProjectId === project.id ? (
                                                    <><Loader2 size={14} className="animate-spin" /> Obnavljam...</>
                                                ) : (
                                                    <><RefreshCw size={14} /> Obnovi</>
                                                )}
                                            </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
