"use client";

import ThemeProvider from "./components/ThemeProvider";
import ToastProvider from "./components/ToastProvider";
import SupportChatPopup from "./components/SupportChatPopup";

export default function DashboardLayout({ children }) {
    return (
        <ThemeProvider>
            <ToastProvider>
                {children}
                <SupportChatPopup />
            </ToastProvider>
        </ThemeProvider>
    );
}
