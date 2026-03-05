"use client";

import ThemeProvider from "./components/ThemeProvider";
import ToastProvider from "./components/ToastProvider";
import BetaReportPopup from "./components/BetaReportPopup";

export default function DashboardLayout({ children }) {
    return (
        <ThemeProvider>
            <ToastProvider>
                {children}
                <BetaReportPopup />
            </ToastProvider>
        </ThemeProvider>
    );
}
