"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Edit3, Loader2, Sparkles, Calendar, ExternalLink, FolderOpen, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BlogTab({ projectId }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usedThisMonth, setUsedThisMonth] = useState(0);
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteAll, setShowDeleteAll] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);
    const router = useRouter();

    const fetchPosts = async () => {
        try {
            const res = await fetch(`/api/blog?projectId=${projectId}`);
            const data = await res.json();
            if (data.posts) setPosts(data.posts);
            if (data.blogPostsUsedThisMonth !== undefined) setUsedThisMonth(data.blogPostsUsedThisMonth);
        } catch (err) { console.error("Failed to fetch posts", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPosts(); }, [projectId]);

    const handleDelete = async (id) => {
        if (!confirm("Jeste li sigurni da želite obrisati ovaj članak?")) return;
        setDeleteId(id);
        try {
            await fetch(`/api/blog?id=${id}`, { method: 'DELETE' });
            setPosts(posts.filter(p => p.id !== id));
        } catch (err) { console.error("Delete failed", err); }
        finally { setDeleteId(null); }
    };

    const handleDeleteAll = async () => {
        setDeletingAll(true);
        try {
            const res = await fetch(`/api/blog?projectId=${projectId}&deleteAll=true`, { method: 'DELETE' });
            if (res.ok) {
                setPosts([]);
                setUsedThisMonth(0);
                setShowDeleteAll(false);
                router.refresh();
            }
        } catch (err) { console.error("Delete all failed", err); }
        finally { setDeletingAll(false); }
    };

    const togglePublish = async (post) => {
        const newStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
        try {
            await fetch('/api/blog', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: post.id, status: newStatus }) });
            fetchPosts();
        } catch (err) { console.error("Status update failed", err); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin" size={20} style={{ color: 'var(--db-text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--db-text-muted)' }}>Učitavanje članaka...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 db-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2.5" style={{ color: 'var(--db-heading)' }}>
                        <FileText className="text-emerald-400" size={22} /> Blog Članci
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--db-text-muted)' }}>
                        Webica AI generiranih: {usedThisMonth}/20 ovaj mjesec
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowDeleteAll(true)}
                        className="px-3.5 py-2 rounded-xl font-medium flex items-center gap-2 transition-all text-xs hover:scale-105 hover:bg-red-500/10"
                        style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <Trash2 size={14} /> <span className="hidden sm:inline">Izbriši Blog</span>
                    </button>
                    <a href={`/api/site/${projectId}/blog`} target="_blank" rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl font-medium flex items-center gap-2 transition-all text-xs hover:scale-105"
                        style={{ color: 'var(--db-text-secondary)', border: '1px solid var(--db-border)' }}>
                        <ExternalLink size={14} /> <span className="hidden sm:inline">Pregledaj Blog</span><span className="sm:hidden">Blog</span>
                    </a>
                    <a href={`/dashboard/projects/${projectId}/blog/new`}
                        className="px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all text-xs hover:scale-105"
                        style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}>
                        <Plus size={15} /> Novi Članak
                    </a>
                </div>
            </div>

            {/* Posts List */}
            {posts.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ border: '1px dashed var(--db-border)' }}>
                    <FileText size={36} className="mx-auto mb-3" style={{ color: 'var(--db-text-muted)' }} />
                    <h3 className="text-base font-bold mb-1.5" style={{ color: 'var(--db-heading)' }}>Nemate blog članaka</h3>
                    <p className="text-xs mb-5" style={{ color: 'var(--db-text-muted)' }}>Napišite prvi članak ili neka Webica AI napiše za vas.</p>
                    <a href={`/dashboard/projects/${projectId}/blog/new`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                        style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}>
                        <Sparkles size={16} /> Kreiraj prvi članak
                    </a>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {posts.map(post => (
                        <div key={post.id} className="db-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-white/[0.02] transition-colors group">
                            {/* Cover image */}
                            {post.coverImage && (
                                <img src={post.coverImage} alt="" className="w-full sm:w-16 h-28 sm:h-14 object-cover rounded-lg flex-shrink-0" />
                            )}
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="font-bold text-sm truncate" style={{ color: 'var(--db-heading)' }}>{post.title}</h3>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                                        post.status === 'PUBLISHED' 
                                            ? 'bg-emerald-500/15 text-emerald-400' 
                                            : 'bg-zinc-500/15 text-[color:var(--db-text-muted)]'
                                    }`}>
                                        {post.status === 'PUBLISHED' ? 'Objavljeno' : 'Nacrt'}
                                    </span>
                                </div>
                                {post.excerpt && <p className="text-xs truncate" style={{ color: 'var(--db-text-muted)' }}>{post.excerpt}</p>}
                                <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: 'var(--db-text-muted)' }}>
                                    <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(post.createdAt).toLocaleDateString('hr-HR')}</span>
                                    <span>/{post.slug}</span>
                                    {post.category && <span className="flex items-center gap-1 text-emerald-500/70"><FolderOpen size={10} />{post.category.name}</span>}
                                </div>
                                {post.tags && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {post.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                                            <span key={tag} className="text-[10px] bg-emerald-500/10 text-emerald-400/70 px-1.5 py-0.5 rounded-full">#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button onClick={() => togglePublish(post)}
                                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                                        post.status === 'PUBLISHED' ? 'text-[color:var(--db-text-muted)] hover:bg-white/5' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                    }`} style={{ border: '1px solid var(--db-border)' }}>
                                    {post.status === 'PUBLISHED' ? 'Sakrij' : 'Objavi'}
                                </button>
                                <a href={`/dashboard/projects/${projectId}/blog/${post.id}`}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--db-text-muted)' }}>
                                    <Edit3 size={14} />
                                </a>
                                <button onClick={() => handleDelete(post.id)} disabled={deleteId === post.id}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: 'var(--db-text-muted)' }}>
                                    {deleteId === post.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete All Confirmation Modal */}
            {showDeleteAll && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !deletingAll && setShowDeleteAll(false)}>
                    <div className="rounded-2xl max-w-md w-full p-6 shadow-2xl" style={{ background: 'var(--db-bg-alt)', border: '1px solid var(--db-border)' }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-red-500/10">
                                <AlertTriangle size={22} className="text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold" style={{ color: 'var(--db-heading)' }}>Izbriši cijeli Blog?</h3>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--db-text-muted)' }}>Ova radnja se ne može poništiti</p>
                            </div>
                        </div>
                        <div className="rounded-xl p-3.5 mb-5" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--db-text-secondary)' }}>
                                Ovo će trajno obrisati <strong style={{ color: '#ef4444' }}>sve blog članke</strong>, kategorije i ukloniti Blog link iz navigacije vaše stranice. 
                                Blog možete ponovno pokrenuti kreiranjem novog članka.
                            </p>
                        </div>
                        <div className="flex items-center gap-2.5 justify-end">
                            <button onClick={() => setShowDeleteAll(false)} disabled={deletingAll}
                                className="px-4 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-white/5"
                                style={{ color: 'var(--db-text-secondary)', border: '1px solid var(--db-border)' }}>
                                Odustani
                            </button>
                            <button onClick={handleDeleteAll} disabled={deletingAll}
                                className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-105"
                                style={{ background: '#ef4444', color: 'white' }}>
                                {deletingAll ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                {deletingAll ? 'Brisanje...' : 'Da, izbriši sve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
