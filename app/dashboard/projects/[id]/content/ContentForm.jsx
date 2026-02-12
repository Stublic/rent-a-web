"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentSchema } from "@/lib/schemas";
import { uploadImageAction, generateWebsiteAction } from "@/app/actions/content-generator";
import { saveContentAction } from "@/app/actions/save-content";
import { updateContentAction } from "@/app/actions/update-content";
import { Loader2, Upload, Trash2, Plus, Sparkles, Eye, Palette, Globe, Image, FileText, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

const templates = [
    { id: 'modern', name: 'Modern', desc: 'Gradients, bold design', icon: '🎨', color: 'from-purple-500 to-pink-500' },
    { id: 'professional', name: 'Professional', desc: 'Classic & trustworthy', icon: '💼', color: 'from-blue-600 to-indigo-700' },
    { id: 'creative', name: 'Creative', desc: 'Artistic & unique', icon: '✨', color: 'from-orange-500 to-red-500' },
    { id: 'minimal', name: 'Minimal', desc: 'Clean & simple', icon: '⚪', color: 'from-zinc-600 to-zinc-800' },
];

export default function ContentForm({ project }) {
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [generationStep, setGenerationStep] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
    const [uploadError, setUploadError] = useState("");
    const [seoExpanded, setSeoExpanded] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const router = useRouter();

    const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(contentSchema),
        defaultValues: project.contentData || {
            businessName: "",
            industry: "",
            description: "",
            template: "modern",
            primaryColor: "#22c55e",
            logoUrl: "",
            heroImageUrl: "",
            aboutImageUrl: "",
            featuresImageUrl: "",
            servicesBackgroundUrl: "",
            metaTitle: "",
            metaDescription: "",
            metaKeywords: [],
            email: "",
            phone: "",
            services: [{ name: "", description: "", imageUrl: "" }],
            socialLinks: {
                facebook: "",
                instagram: "",
                linkedin: "",
                twitter: ""
            }
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "services"
    });

    const generationSteps = [
        { label: "Validiranje podataka", icon: "✓" },
        { label: "Priprema sadržaja", icon: "✓" },
        { label: "AI piše kod (15s)", icon: "⏳" },
        { label: "Spremanje", icon: "✓" }
    ];

    const selectedTemplate = watch("template");
    const metaTitle = watch("metaTitle");
    const metaDescription = watch("metaDescription");

    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadError("");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const url = await uploadImageAction(formData);
            setValue(field, url);
        } catch (error) {
            console.error("Upload failed", error);
            setUploadError("Upload slike nije uspio. Molimo pokušajte ponovno.");
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (data) => {
        setGenerating(true);
        setErrorMessage("");
        setGenerationStep(0);

        try {
            setGenerationStep(1);
            await new Promise(resolve => setTimeout(resolve, 500));

            setGenerationStep(2);
            await new Promise(resolve => setTimeout(resolve, 500));

            setGenerationStep(3);
            const result = await generateWebsiteAction(project.id, data);

            if (result.error) {
                setErrorMessage(typeof result.error === 'string' ? result.error : "Greška pri generiranju. Molimo pokušajte ponovno.");
                setGenerating(false);
                setGenerationStep(0);
                return;
            }

            setGenerationStep(4);
            await new Promise(resolve => setTimeout(resolve, 500));

            router.refresh();
            setGenerating(false);
            setGenerationStep(0);

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error(error);
            setErrorMessage("Došlo je do neočekivane greške. Molimo pokušajte ponovno.");
            setGenerating(false);
            setGenerationStep(0);
        }
    };

    const onSave = async (data) => {
        // Use updateContentAction if website already generated, otherwise saveContentAction
        const isUpdate = project.hasGenerated;
        
        if (isUpdate) {
            setUpdating(true);
        } else {
            setSaving(true);
        }
        setErrorMessage("");

        try {
            const result = isUpdate 
                ? await updateContentAction(project.id, data)
                : await saveContentAction(project.id, data);

            if (result.error) {
                setErrorMessage(result.error);
                setSaving(false);
                setUpdating(false);
                return;
            }

            router.refresh();
            setSaving(false);
            setUpdating(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error(error);
            setErrorMessage(isUpdate 
                ? "Došlo je do neočekivane greške pri ažuriranju."
                : "Došlo je do neočekivane greške pri spremanju."
            );
            setSaving(false);
            setUpdating(false);
        }
    };

    const ImageUploadBox = ({ field, label, currentUrl }) => (
        <div className="space-y-2">
            <label className="text-zinc-300 text-sm font-medium flex items-center gap-2">
                <Image size={16} className="text-zinc-500" />
                {label}
            </label>
            <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 hover:border-green-500/50 transition-all group relative overflow-hidden bg-zinc-950/50">
                {currentUrl ? (
                    <div className="relative">
                        <img src={currentUrl} alt={label} className="w-full h-32 object-cover rounded-lg" />
                        <button
                            type="button"
                            onClick={() => setValue(field, "")}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-lg"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ) : (
                    <>
                        <Upload className="mx-auto text-zinc-600 group-hover:text-green-500 transition-colors mb-3" size={28} />
                        <input
                            type="file"
                            onChange={(e) => handleImageUpload(e, field)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept="image/*"
                        />
                        <p className="text-sm text-zinc-500 text-center font-medium">
                            {uploading ? "Učitavanje..." : "Dodirni za prijenos"}
                        </p>
                        <p className="text-xs text-zinc-600 text-center mt-1.5">Ili ostavi prazno za automatski odabir</p>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="w-full pb-8 relative">
            {/* Loading Overlay */}
            {generating && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-green-500/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-green-500/10">
                        <div className="text-center mb-6">
                            <div className="relative inline-block">
                                <Loader2 className="w-16 h-16 animate-spin text-green-500 mx-auto mb-4" />
                                <div className="absolute inset-0 blur-xl bg-green-500/30 animate-pulse"></div>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">✨ AI stvara web stranicu</h3>
                            <p className="text-zinc-400 text-sm">Koristi Gemini 3 Flash - Ovo može potrajati 15-20 sekundi.</p>
                        </div>

                        <div className="space-y-3">
                            {generationSteps.map((step, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${index < generationStep
                                            ? 'bg-green-500/10 border border-green-500/30'
                                            : index === generationStep
                                                ? 'bg-zinc-800 border border-zinc-700 animate-pulse'
                                                : 'bg-zinc-900/50 border border-zinc-800/50'
                                        }`}
                                >
                                    <span className="text-2xl">{index < generationStep ? '✅' : index === generationStep ? '⏳' : '○'}</span>
                                    <span className={`text-sm font-medium ${index <= generationStep ? 'text-white' : 'text-zinc-600'
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Updating Overlay */}
            {updating && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-blue-500/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-blue-500/10">
                        <div className="text-center mb-6">
                            <div className="relative inline-block">
                                <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
                                <div className="absolute inset-0 blur-xl bg-blue-500/30 animate-pulse"></div>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">🔄 Ažuriranje sadržaja</h3>
                            <p className="text-zinc-400 text-sm">AI pametno ažurira samo promijenjene podatke...</p>
                        </div>

                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-zinc-300">Analiziranje promjena</span>
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-zinc-300">Kirurško ažuriranje HTML-a</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-zinc-300">Čuvanje AI editor izmjena</span>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-500 text-center mt-4">
                            💡 Sve izmjene iz editora ostaju sačuvane
                        </p>
                    </div>
                </div>
            )}


            {/* Error Messages */}
            {errorMessage && (
                <div className="mb-6 mx-4 sm:mx-0 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <span className="text-2xl sm:text-3xl">⚠️</span>
                    <div className="flex-1">
                        <h4 className="font-bold text-red-400 mb-1">Greška</h4>
                        <p className="text-red-300 text-sm leading-relaxed">{errorMessage}</p>
                    </div>
                </div>
            )}

            {uploadError && (
                <div className="mb-6 mx-4 sm:mx-0 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-xl sm:text-2xl">⚠️</span>
                    <p className="text-orange-300 text-sm flex-1">{uploadError}</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-4 sm:px-0">
                {/* Template Selection */}
                <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-zinc-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl flex-shrink-0">
                            🎨
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-white">Odaberi Predložak</h2>
                            <p className="text-zinc-400 text-xs sm:text-sm">Stil dizajna web stranice</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {templates.map((template) => (
                            <label key={template.id} className="cursor-pointer group">
                                <input
                                    type="radio"
                                    value={template.id}
                                    {...register("template")}
                                    className="sr-only"
                                />
                                <div className={`relative p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all ${selectedTemplate === template.id
                                        ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                                        : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                                    }`}>
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center text-xl sm:text-2xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                                        {template.icon}
                                    </div>
                                    <h3 className="font-bold text-white mb-1 text-sm sm:text-base">{template.name}</h3>
                                    <p className="text-xs text-zinc-500">{template.desc}</p>
                                    {selectedTemplate === template.id && (
                                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-green-500 rounded-full p-1">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Business Info */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-5 sm:space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                            1
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-white">Osnovne Informacije</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium">Naziv Biznisa</label>
                            <input
                                {...register("businessName")}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 transition-colors text-base"
                                placeholder="npr. Rent a Web"
                            />
                            {errors.businessName && <span className="text-red-400 text-xs">{errors.businessName.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium">Industrija</label>
                            <input
                                {...register("industry")}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 transition-colors text-base"
                                placeholder="npr. Web Dizajn"
                            />
                            {errors.industry && <span className="text-red-400 text-xs">{errors.industry.message}</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-zinc-300 text-sm font-medium">Opis Biznisa</label>
                        <textarea
                            {...register("description")}
                            rows={4}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 transition-colors resize-none text-base"
                            placeholder="Opišite što radite, vaše prednosti i ciljeve..."
                        />
                        {errors.description && <span className="text-red-400 text-xs">{errors.description.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-zinc-300 text-sm font-medium flex items-center gap-2">
                            <Palette size={16} className="text-green-500" />
                            Primarna Boja
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                value={watch("primaryColor")}
                                onChange={(e) => setValue("primaryColor", e.target.value)}
                                className="w-16 h-16 rounded-xl cursor-pointer bg-transparent border-2 border-zinc-800"
                            />
                            <input
                                type="text"
                                {...register("primaryColor")}
                                className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white w-32 focus:outline-none focus:border-green-500 text-base font-mono uppercase"
                                placeholder="#22c55e"
                            />
                        </div>
                    </div>
                </div>

                {/* Brand Assets & Section Images - Combined for better mobile flow */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-5 sm:space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                            2
                        </div>
                        <div className="flex-1">
                            <h2 className="text-base sm:text-lg font-bold text-white">Slike</h2>
                            <p className="text-zinc-500 text-xs sm:text-sm">Opcionalno - AI automatski odabire slike</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Brand</h3>
                        <div className="grid sm:grid-cols-2 gap-5">
                            <ImageUploadBox field="logoUrl" label="Logo" currentUrl={watch("logoUrl")} />
                            <ImageUploadBox field="heroImageUrl" label="Hero Slika" currentUrl={watch("heroImageUrl")} />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Sekcije</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <ImageUploadBox field="aboutImageUrl" label="O Nama" currentUrl={watch("aboutImageUrl")} />
                            <ImageUploadBox field="featuresImageUrl" label="Features" currentUrl={watch("featuresImageUrl")} />
                            <ImageUploadBox field="servicesBackgroundUrl" label="Usluge Pozadina" currentUrl={watch("servicesBackgroundUrl")} />
                        </div>
                    </div>
                </div>

                {/* SEO Section */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setSeoExpanded(!seoExpanded)}
                        className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-zinc-900/70 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-green-500 flex-shrink-0">
                                <Globe size={16} />
                            </div>
                            <div className="text-left">
                                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                    SEO Podešavanja
                                </h2>
                                <p className="text-zinc-500 text-xs sm:text-sm">Opcionalno - za bolju vidljivost</p>
                            </div>
                        </div>
                        {seoExpanded ? <ChevronUp className="text-zinc-500 flex-shrink-0" size={20} /> : <ChevronDown className="text-zinc-500 flex-shrink-0" size={20} />}
                    </button>

                    {seoExpanded && (
                        <div className="p-5 sm:p-6 pt-0 space-y-5 sm:space-y-6 animate-in slide-in-from-top-2 fade-in">
                            <div className="space-y-2">
                                <label className="text-zinc-300 text-sm font-medium flex items-center justify-between">
                                    <span>Meta Naslov</span>
                                    <span className={`text-xs ${metaTitle?.length > 60 ? 'text-red-400' : 'text-zinc-600'}`}>
                                        {metaTitle?.length || 0}/60
                                    </span>
                                </label>
                                <input
                                    {...register("metaTitle")}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 text-base"
                                    placeholder="npr. Profesionalne Vodoinstalaterske Usluge"
                                />
                                {errors.metaTitle && <span className="text-red-400 text-xs">{errors.metaTitle.message}</span>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-zinc-300 text-sm font-medium flex items-center justify-between">
                                    <span>Meta Opis</span>
                                    <span className={`text-xs ${metaDescription?.length > 160 ? 'text-red-400' : 'text-zinc-600'}`}>
                                        {metaDescription?.length || 0}/160
                                    </span>
                                </label>
                                <textarea
                                    {...register("metaDescription")}
                                    rows={3}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 resize-none text-base"
                                    placeholder="Kratak opis što radite..."
                                />
                                {errors.metaDescription && <span className="text-red-400 text-xs">{errors.metaDescription.message}</span>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Contact */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-5 sm:space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-green-500 flex-shrink-0">
                            📧
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-white">Kontakt</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium">Email</label>
                            <input
                                {...register("email")}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 text-base"
                                placeholder="info@mojbiznis.hr"
                            />
                            {errors.email && <span className="text-red-400 text-xs">{errors.email.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium">Telefon (Opcionalno)</label>
                            <input
                                {...register("phone")}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500 text-base"
                                placeholder="+385 91 123 4567"
                            />
                        </div>
                    </div>

                {/* Social Links */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-5 sm:space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-blue-500 flex-shrink-0">
                            🌐
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-white">Društvene Mreže</h2>
                            <p className="text-zinc-500 text-xs sm:text-sm">Opcionalno</p>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                Facebook
                            </label>
                            <input
                                {...register("socialLinks.facebook")}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 text-base"
                                placeholder="https://facebook.com/vasstranica"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium flex items-center gap-2">
                                <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                Instagram
                            </label>
                            <input
                                {...register("socialLinks.instagram")}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-pink-500 text-base"
                                placeholder="https://instagram.com/vasstranica"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                LinkedIn
                            </label>
                            <input
                                {...register("socialLinks.linkedin")}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-600 text-base"
                                placeholder="https://linkedin.com/company/vasstranica"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-zinc-300 text-sm font-medium flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                Twitter / X
                            </label>
                            <input
                                {...register("socialLinks.twitter")}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-zinc-400 text-base"
                                placeholder="https://twitter.com/vasstranica"
                            />
                        </div>
                    </div>
               </div>

                </div>

                {/* Services */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-5 sm:space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                3
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-white">Usluge / Proizvodi</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => append({ name: "", description: "", imageUrl: "" })}
                            className="text-green-500 font-bold flex items-center gap-2 hover:text-green-400 transition-colors px-3 sm:px-4 py-2 rounded-lg hover:bg-green-500/10"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Dodaj</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="bg-zinc-950/50 border border-zinc-700 rounded-xl p-4 sm:p-5 space-y-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-zinc-400 text-sm font-bold">Usluga #{index + 1}</span>
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="text-red-400 hover:text-red-300 transition-colors p-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <input
                                        {...register(`services.${index}.name`)}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-green-500 text-base"
                                        placeholder="Naziv usluge"
                                    />

                                    <textarea
                                        {...register(`services.${index}.description`)}
                                        rows={2}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-green-500 resize-none text-base"
                                        placeholder="Kratak opis (opcionalno)"
                                    />

                                    <ImageUploadBox
                                        field={`services.${index}.imageUrl`}
                                        label="Slika usluge (opcionalno)"
                                        currentUrl={watch(`services.${index}.imageUrl`)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    {errors.services && <span className="text-red-400 text-xs">{errors.services.message}</span>}
                </div>

                {/* Submit - Sticky on mobile */}
                <div className="sticky bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-zinc-800 p-4 sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-t-0 sm:pt-8 sm:p-0 -mx-4 sm:mx-0">
                    <div className="flex items-center justify-end gap-3 sm:gap-4">
                        {/* Save Button - Always visible */}
                        <button
                            type="button"
                            onClick={handleSubmit(onSave)}
                            disabled={uploading || generating || saving || updating}
                            className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 text-white px-6 sm:px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {(saving || updating) ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span className="hidden sm:inline">
                                        {updating ? 'Ažuriranje...' : 'Spremanje...'}
                                    </span>
                                    <span className="sm:hidden">...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    <span className="hidden sm:inline">
                                        {project.hasGenerated ? 'Ažuriraj Web Stranicu' : 'Spremi Podatke'}
                                    </span>
                                    <span className="sm:hidden">
                                        {project.hasGenerated ? 'Ažuriraj' : 'Spremi'}
                                    </span>
                                </>
                            )}
                        </button>

                        {/* Generate Button - Only if not already generated */}
                        {!project.hasGenerated && (
                            <button
                                type="submit"
                                disabled={uploading || generating || saving || updating}
                                className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-8 sm:px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span className="hidden sm:inline">Generiranje...</span>
                                        <span className="sm:hidden">...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        <span className="hidden sm:inline">Generiraj Web Stranicu</span>
                                        <span className="sm:hidden">Generiraj</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
