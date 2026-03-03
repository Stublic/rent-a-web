'use client';

import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { HelpCircle } from 'lucide-react';

const TOUR_DONE_KEY = 'rentaweb-tour-done';

export default function OnboardingTour() {
    const [showHelp, setShowHelp] = useState(false);

    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            smoothScroll: true,
            stagePadding: 6,
            stageRadius: 12,
            popoverClass: 'rentaweb-tour-popover',
            nextBtnText: 'Dalje →',
            prevBtnText: '← Natrag',
            doneBtnText: 'Završi ✓',
            progressText: '{{current}} / {{total}}',
            onDestroyStarted: () => {
                localStorage.setItem(TOUR_DONE_KEY, 'true');
                driverObj.destroy();
            },
            steps: [
                {
                    element: '#tour-welcome',
                    popover: {
                        title: '👋 Dobrodošli u Rent a webica!',
                        description: 'Ovo je vaša kontrolna ploča. Odavde upravljate svim aspektima vaše web prisutnosti — od pretplate do vaših web stranica. Dozvolite nam da vam pokažemo osnove!',
                        side: 'bottom',
                        align: 'center',
                    }
                },
                {
                    element: '#tour-subscription',
                    popover: {
                        title: '📊 Pregled pretplate i tokena',
                        description: 'Ovdje vidite status vaše pretplate, plan koji koristite i koliko AI tokena imate na raspolaganju. Tokeni se koriste za AI izmjene na vašoj web stranici.',
                        side: 'right',
                        align: 'start',
                    }
                },
                {
                    element: '#tour-projects',
                    popover: {
                        title: '📁 Vaši projekti',
                        description: 'Ovdje se nalaze svi vaši web projekti. Kliknite na bilo koji projekt da ga otvorite — tamo unosite sadržaj, koristite AI editor i upravljate postavkama.',
                        side: 'right',
                        align: 'start',
                    }
                },
                {
                    element: '#tour-new-project',
                    popover: {
                        title: '✨ Kreirajte novi projekt',
                        description: 'Želite novu web stranicu? Kliknite ovdje! Odaberite paket i u par minuta AI će vam generirati profesionalnu web stranicu.',
                        side: 'bottom',
                        align: 'end',
                    },
                    onHighlightStarted: () => {
                        // Switch to Projects tab if not already there
                        const projectsTab = document.getElementById('tour-projects');
                        if (projectsTab) projectsTab.click();
                        // Wait for the tab content to render
                        return new Promise(resolve => setTimeout(resolve, 400));
                    },
                },
                {
                    element: '#tour-support',
                    popover: {
                        title: '🎫 Podrška',
                        description: 'Trebate pomoć ili imate pitanje? Ovdje možete otvoriti ticket za podršku i pratiti njegov status. Tu smo za vas!',
                        side: 'right',
                        align: 'start',
                    }
                },
                {
                    element: '#tour-user-menu',
                    popover: {
                        title: '👤 Vaš profil',
                        description: 'Kliknite na vaše ime za pristup postavkama računa, promjenu lozinke ili odjavu iz sustava.',
                        side: 'bottom',
                        align: 'end',
                    }
                },
            ],
        });

        driverObj.drive();
    };

    useEffect(() => {
        const tourDone = localStorage.getItem(TOUR_DONE_KEY);
        if (!tourDone) {
            // Small delay to let the dashboard render first
            const timer = setTimeout(() => {
                startTour();
            }, 800);
            return () => clearTimeout(timer);
        } else {
            setShowHelp(true);
        }
    }, []);

    // Show help button only after tour has been completed once
    return (
        <>
            {/* Custom styles for driver.js to match dark theme */}
            <style jsx global>{`
                .driver-popover.rentaweb-tour-popover {
                    background: #18181b !important;
                    border: 1px solid #3f3f46 !important;
                    border-radius: 16px !important;
                    color: #fff !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
                }
                .driver-popover.rentaweb-tour-popover .driver-popover-title {
                    color: #fff !important;
                    font-size: 16px !important;
                    font-weight: 700 !important;
                }
                .driver-popover.rentaweb-tour-popover .driver-popover-description {
                    color: #a1a1aa !important;
                    font-size: 14px !important;
                    line-height: 1.6 !important;
                }
                .driver-popover.rentaweb-tour-popover .driver-popover-progress-text {
                    color: #71717a !important;
                }
                .driver-popover.rentaweb-tour-popover .driver-popover-prev-btn {
                    background: transparent !important;
                    border: 1px solid #3f3f46 !important;
                    color: #a1a1aa !important;
                    border-radius: 8px !important;
                    padding: 6px 16px !important;
                    font-weight: 500 !important;
                }
                .driver-popover.rentaweb-tour-popover .driver-popover-prev-btn:hover {
                    background: #27272a !important;
                    color: #fff !important;
                }
                .driver-popover.rentaweb-tour-popover .driver-popover-next-btn,
                .driver-popover.rentaweb-tour-popover .driver-popover-close-btn-text {
                    background: #22c55e !important;
                    color: #fff !important;
                    border: none !important;
                    border-radius: 8px !important;
                    padding: 6px 16px !important;
                    font-weight: 600 !important;
                    text-shadow: none !important;
                }
                .driver-popover.rentaweb-tour-popover .driver-popover-next-btn:hover {
                    background: #16a34a !important;
                }
                .driver-popover.rentaweb-tour-popover .driver-popover-arrow-side-left.driver-popover-arrow,
                .driver-popover.rentaweb-tour-popover .driver-popover-arrow-side-right.driver-popover-arrow,
                .driver-popover.rentaweb-tour-popover .driver-popover-arrow-side-top.driver-popover-arrow,
                .driver-popover.rentaweb-tour-popover .driver-popover-arrow-side-bottom.driver-popover-arrow {
                    border-color: #3f3f46 !important;
                }
                .driver-overlay {
                    background: rgba(0, 0, 0, 0.7) !important;
                }
                .driver-popover.rentaweb-tour-popover .driver-popover-close-btn {
                    color: #71717a !important;
                }
                .driver-popover.rentaweb-tour-popover .driver-popover-close-btn:hover {
                    color: #fff !important;
                }
                .driver-popover.rentaweb-tour-popover .driver-popover-footer {
                    border-top: 1px solid #27272a !important;
                    margin-top: 12px !important;
                    padding-top: 12px !important;
                }
            `}</style>

            {/* Help button to re-trigger tour */}
            {showHelp && (
                <button
                    onClick={() => {
                        localStorage.removeItem(TOUR_DONE_KEY);
                        startTour();
                    }}
                    className="fixed bottom-6 right-6 z-50 p-3 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-400 hover:text-green-400 hover:border-green-500/30 transition-all shadow-lg hover:shadow-green-500/10 group"
                    title="Pokreni vodič"
                >
                    <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
                </button>
            )}
        </>
    );
}
