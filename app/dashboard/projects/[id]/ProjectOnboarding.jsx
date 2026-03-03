"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Pencil, Settings, FileText, Inbox, X, ArrowRight, CheckCircle2 } from "lucide-react";

const ONBOARDING_STEPS = [
    {
        id: "intro",
        title: "Dobrodošli u vaš novi projekt! 🎉",
        description: "Prije nego što krenete s izradom stranice, kratko ćemo vas provesti kroz osnovne mogućnosti Webica platforme.",
        icon: Sparkles,
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.1)"
    },
    {
        id: "sadrzaj",
        title: "Sadržaj (AI generator)",
        description: "Ovdje unosite osnovne informacije o svom biznisu, kontakt podatke, odabirete boje i slike. Kada sve ispunite, klikom na gumb AI automatski generira cijelu web stranicu za vas.",
        icon: Sparkles,
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.1)"
    },
    {
        id: "editor",
        title: "AI Editor",
        description: "Ovdje se događa čarolija! Ne morate znati programirati — samo objasnite našem AI asistentu što želite promijeniti (npr. 'Promijeni pozadinu u plavo' ili 'Dodaj novu sekciju za usluge') i on će to napraviti umjesto vas.",
        icon: Pencil,
        color: "#3b82f6",
        bg: "rgba(59, 130, 246, 0.1)"
    },
    {
        id: "upiti",
        title: "Upiti (Inbox)",
        description: "Kada god Vam netko pošalje poruku preko kontakt forme na vašoj novoj web stranici, ta poruka će se pojaviti ovdje, a obavijest ćete dobiti i na email.",
        icon: Inbox,
        color: "#8b5cf6",
        bg: "rgba(139, 92, 246, 0.1)"
    },
    {
        id: "blog",
        title: "Blog",
        description: "Ako imate Growth plan, ovdje možete pisati i objavljivati članke. Pisanje bloga je najbolji način da vas novi klijenti besplatno pronađu putem Googlea.",
        icon: FileText,
        color: "#ec4899",
        bg: "rgba(236, 72, 153, 0.1)"
    },
    {
        id: "postavke",
        title: "Postavke",
        description: "Ovdje upravljate naprednim opcijama poput spajanja vlastite domene (npr. www.moj-biznis.hr), brisanja projekta i upravljanja pretplatom.",
        icon: Settings,
        color: "#64748b",
        bg: "rgba(100, 116, 139, 0.1)"
    }
];

export default function ProjectOnboarding({ projectId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Provjeri je li korisnik već vidio onboarding za ovaj projekt ili općenito
        const seen = localStorage.getItem(`webica_onboarding_seen`);
        if (!seen) {
            // Mali delay da se stranica učita prije nego modal iskoči
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem(`webica_onboarding_seen`, "true");
    };

    const nextStep = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    if (!isOpen) return null;

    const stepInfo = ONBOARDING_STEPS[currentStep];
    const Icon = stepInfo.icon;
    const isFirst = currentStep === 0;
    const isLast = currentStep === ONBOARDING_STEPS.length - 1;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                style={{ background: 'var(--lp-bg-alt)', border: '1px solid var(--lp-border)' }}
            >
                {/* Close Button */}
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
                    style={{ color: 'var(--lp-text-muted)' }}
                >
                    <X size={18} />
                </button>

                {/* Content */}
                <div className="p-8 pt-10 text-center flex-1">
                    <motion.div
                        key={stepInfo.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center"
                    >
                        <div 
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                            style={{ background: stepInfo.bg, color: stepInfo.color, border: `1px solid ${stepInfo.color}40` }}
                        >
                            <Icon size={32} />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: 'var(--lp-heading)' }}>
                            {stepInfo.title}
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-text-secondary)' }}>
                            {stepInfo.description}
                        </p>
                    </motion.div>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-1.5 mb-6">
                    {ONBOARDING_STEPS.map((_, i) => (
                        <div 
                            key={i} 
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{ 
                                width: i === currentStep ? '24px' : '6px',
                                background: i === currentStep ? 'var(--lp-heading)' : 'var(--lp-border)'
                            }}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    {!isFirst && (
                        <button 
                            onClick={prevStep}
                            className="px-5 py-3 rounded-xl font-bold text-sm transition-all hover:bg-white/5"
                            style={{ color: 'var(--lp-text-secondary)', border: '1px solid var(--lp-border)' }}
                        >
                            Natrag
                        </button>
                    )}
                    
                    <button 
                        onClick={nextStep}
                        className="flex-1 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                        style={{ 
                            background: isLast ? '#10b981' : 'var(--lp-heading)', 
                            color: isLast ? '#fff' : 'var(--lp-bg)' 
                        }}
                    >
                        {isLast ? (
                            <><CheckCircle2 size={18} /> Započni rad</>
                        ) : (
                            <>Dalje <ArrowRight size={18} /></>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
