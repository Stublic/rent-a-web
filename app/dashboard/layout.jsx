"use client";

import ToastProvider from "./components/ToastProvider";

export default function DashboardLayout({ children }) {
    return (
        <ToastProvider>
            {children}
        </ToastProvider>
    );
}
