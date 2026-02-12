"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, Loader2, Zap, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ProjectsTab() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

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
                <Link href="/dashboard/new-project" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
                    <Zap size={18} />
                    <span className="hidden sm:inline">Novi projekt</span>
                </Link>
            </div>

            {projects.length === 0 ? (
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
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
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
        </div>
    );
}
