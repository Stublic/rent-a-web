"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentSchema } from "@/lib/schemas";
import { uploadImageAction, generateWebsiteAction } from "@/app/actions/content-generator";
import { Loader2, Upload, Trash2, Plus, Sparkles, Eye, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ContentForm({ project }) {
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const router = useRouter();

    const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(contentSchema),
        defaultValues: project.contentData || {
            businessName: "",
            industry: "",
            description: "",
            primaryColor: "#22c55e",
            logoUrl: "",
            heroImageUrl: "",
            email: "",
            phone: "",
            services: [""]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "services"
    });

    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const url = await uploadImageAction(formData);
            setValue(field, url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (data) => {
        setGenerating(true);
        try {
            const result = await generateWebsiteAction(project.id, data);
            if (result.error) {
                alert("Error: " + JSON.stringify(result.error));
            } else {
                router.refresh(); // Refresh to see the new status/preview
                alert("Website generated successfully!");
            }
        } catch (error) {
            console.error(error);
            alert("Generation failed");
        } finally {
            setGenerating(false);
        }
    };

    const logoUrl = watch("logoUrl");
    const heroImageUrl = watch("heroImageUrl");

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Uredi sadržaj</h1>
                    <p className="text-zinc-400">Ispunite formu i AI će generirati vašu web stranicu.</p>
                </div>
                {project.generatedHtml && (
                    <button 
                        onClick={() => {
                            const blob = new Blob([project.generatedHtml], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            window.open(url, '_blank');
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-zinc-700"
                    >
                        <Eye size={18} /> Pregledaj Web
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Section 1: Business Info */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm">1</span>
                        O Biznisu
                    </h2>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-zinc-400 text-sm font-medium">Naziv Biznisa</label>
                            <input {...register("businessName")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500" placeholder="npr. Rent a Web" />
                            {errors.businessName && <span className="text-red-500 text-xs">{errors.businessName.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-zinc-400 text-sm font-medium">Industrija</label>
                            <input {...register("industry")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500" placeholder="npr. Web Dizajn" />
                            {errors.industry && <span className="text-red-500 text-xs">{errors.industry.message}</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-zinc-400 text-sm font-medium">Opis</label>
                        <textarea {...register("description")} rows={4} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500" placeholder="Opišite što radite, vaše prednosti i ciljeve..." />
                        {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
                    </div>
                </div>

                {/* Section 2: Visual Identity */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm">2</span>
                        Vizualni Identitet
                    </h2>

                    <div className="space-y-2">
                        <label className="text-zinc-400 text-sm font-medium">Primarna Boja</label>
                        <div className="flex items-center gap-4">
                            <input type="color" {...register("primaryColor")} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none" />
                            <input type="text" {...register("primaryColor")} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white w-32 focus:outline-none focus:border-green-500" />
                        </div>
                        {errors.primaryColor && <span className="text-red-500 text-xs">{errors.primaryColor.message}</span>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-zinc-400 text-sm font-medium">Logo (Opcionalno)</label>
                            <div className="border-2 border-dashed border-zinc-800 rounded-xl p-6 text-center hover:bg-zinc-900/50 transition-colors relative">
                                {logoUrl ? (
                                    <div className="relative h-20 w-auto mx-auto">
                                        <img src={logoUrl} alt="Logo" className="h-full object-contain mx-auto" />
                                        <button type="button" onClick={() => setValue("logoUrl", "")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><Trash2 size={12} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto text-zinc-500 mb-2" />
                                        <input type="file" onChange={(e) => handleImageUpload(e, "logoUrl")} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                        <span className="text-xs text-zinc-500">{uploading ? "Učitavanje..." : "Klikni za upload"}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-zinc-400 text-sm font-medium">Hero Slika (Opcionalno)</label>
                             <div className="border-2 border-dashed border-zinc-800 rounded-xl p-6 text-center hover:bg-zinc-900/50 transition-colors relative">
                                {heroImageUrl ? (
                                    <div className="relative h-20 w-auto mx-auto">
                                        <img src={heroImageUrl} alt="Hero" className="h-full object-cover rounded-lg mx-auto" />
                                        <button type="button" onClick={() => setValue("heroImageUrl", "")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><Trash2 size={12} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto text-zinc-500 mb-2" />
                                        <input type="file" onChange={(e) => handleImageUpload(e, "heroImageUrl")} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                        <span className="text-xs text-zinc-500">{uploading ? "Učitavanje..." : "Klikni za upload"}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Contact & Services */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm">3</span>
                        Kontakt & Usluge
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-zinc-400 text-sm font-medium">Email za kontakt</label>
                            <input {...register("email")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500" placeholder="info@mojabrtva.hr" />
                            {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-zinc-400 text-sm font-medium">Telefon (Opcionalno)</label>
                            <input {...register("phone")} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500" placeholder="+385 91 123 4567" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                             <label className="text-zinc-400 text-sm font-medium">Usluge / Proizvodi</label>
                             <button type="button" onClick={() => append("")} className="text-green-500 text-sm font-bold flex items-center gap-1 hover:text-green-400">
                                <Plus size={16} /> Dodaj uslugu
                             </button>
                        </div>
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2">
                                <input {...register(`services.${index}`)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500" placeholder="npr. Konzultacije" />
                                <button type="button" onClick={() => remove(index)} className="p-3 text-zinc-500 hover:text-red-500 transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                        {errors.services && <span className="text-red-500 text-xs">{errors.services.message}</span>}
                        {errors.services?.root && <span className="text-red-500 text-xs">{errors.services.root.message}</span>}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 border-t border-zinc-800 pt-8">
                     <button 
                        type="button"
                        className="px-6 py-3 text-zinc-400 font-bold hover:text-white transition-colors"
                        onClick={() => router.back()}
                     >
                        Odustani
                     </button>
                     <button 
                        type="submit" 
                        disabled={uploading || generating}
                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
                     >
                        {generating ? (
                            <>
                                <Loader2 className="animate-spin" /> Generiranje...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} /> Spremi i Generiraj
                            </>
                        )}
                     </button>
                </div>
            </form>
        </div>
    );
}
