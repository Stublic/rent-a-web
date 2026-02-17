"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Edit3, Eye, Loader2, Search, Sparkles, Calendar, ExternalLink, FolderOpen, Tag } from "lucide-react";

export default function BlogTab({ projectId }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usedThisMonth, setUsedThisMonth] = useState(0);
    const [deleteId, setDeleteId] = useState(null);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`/api/blog?projectId=${projectId}`);
            const data = await res.json();
            if (data.posts) setPosts(data.posts);
            if (data.blogPostsUsedThisMonth !== undefined) setUsedThisMonth(data.blogPostsUsedThisMonth);
        } catch (err) {
            console.error("Failed to fetch posts", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPosts(); }, [projectId]);

    const handleDelete = async (id) => {
        if (!confirm("Jeste li sigurni da želite obrisati ovaj članak?")) return;
        setDeleteId(id);
        try {
            await fetch(`/api/blog?id=${id}`, { method: 'DELETE' });
            setPosts(posts.filter(p => p.id !== id));
        } catch (err) {
            console.error("Delete failed", err);
        } finally {
            setDeleteId(null);
        }
    };

    const togglePublish = async (post) => {
        const newStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
        try {
            await fetch('/api/blog', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: post.id, status: newStatus })
            });
            fetchPosts();
        } catch (err) {
            console.error("Status update failed", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-green-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileText className="text-green-500" size={28} />
                        Blog Članci
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        AI generiranih: {usedThisMonth}/20 ovaj mjesec
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href={`/api/site/${projectId}/blog`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all text-sm border border-zinc-700"
                    >
                        <ExternalLink size={16} /> Pregledaj Blog
                    </a>
                    <a
                        href={`/dashboard/projects/${projectId}/blog/new`}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 w-fit"
                    >
                        <Plus size={18} /> Novi Članak
                    </a>
                </div>
            </div>

            {/* Posts List */}
            {posts.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
                    <FileText size={48} className="mx-auto text-zinc-700 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Nemate blog članaka</h3>
                    <p className="text-zinc-500 text-sm mb-6">Napišite prvi članak ili neka AI napiše za vas.</p>
                    <a
                        href={`/dashboard/projects/${projectId}/blog/new`}
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                    >
                        <Sparkles size={18} /> Kreiraj prvi članak
                    </a>
                </div>
            ) : (
                <div className="space-y-3">
                    {posts.map(post => (
                        <div key={post.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-zinc-700 transition-colors group">
                            {/* Cover image */}
                            {post.coverImage && (
                                <img src={post.coverImage} alt="" className="w-full sm:w-20 h-32 sm:h-16 object-cover rounded-lg flex-shrink-0" />
                            )}
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-white font-bold text-base truncate">{post.title}</h3>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                                        post.status === 'PUBLISHED' 
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                    }`}>
                                        {post.status === 'PUBLISHED' ? 'Objavljeno' : 'Nacrt'}
                                    </span>
                                </div>
                                {post.excerpt && <p className="text-zinc-500 text-sm truncate">{post.excerpt}</p>}
                                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(post.createdAt).toLocaleDateString('hr-HR')}
                                    </span>
                                    <span>/{post.slug}</span>
                                    {post.category && (
                                        <span className="flex items-center gap-1 text-green-500/70">
                                            <FolderOpen size={11} />{post.category.name}
                                        </span>
                                    )}
                                </div>
                                {post.tags && (
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {post.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                                            <span key={tag} className="text-[10px] bg-green-500/10 text-green-400/70 px-2 py-0.5 rounded-full border border-green-500/10">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => togglePublish(post)}
                                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                        post.status === 'PUBLISHED'
                                            ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                            : 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/20'
                                    }`}
                                >
                                    {post.status === 'PUBLISHED' ? 'Sakrij' : 'Objavi'}
                                </button>
                                <a
                                    href={`/dashboard/projects/${projectId}/blog/${post.id}`}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                >
                                    <Edit3 size={16} />
                                </a>
                                <button
                                    onClick={() => handleDelete(post.id)}
                                    disabled={deleteId === post.id}
                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-zinc-500 hover:text-red-400"
                                >
                                    {deleteId === post.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
