"use client";

import ToastProvider from "./components/ToastProvider";
import SupportChatPopup from "./components/SupportChatPopup";

export default function DashboardLayout({ children }) {
    return (
        <ToastProvider>
            {children}
            <SupportChatPopup />
        </ToastProvider>
    );
}
