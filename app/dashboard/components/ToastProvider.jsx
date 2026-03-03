"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";

const ToastContext = createContext(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}

let toastIdCounter = 0;

export default function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const removeToast = useCallback((id) => {
        // Mark as exiting for animation
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            if (timersRef.current[id]) {
                clearTimeout(timersRef.current[id]);
                delete timersRef.current[id];
            }
        }, 300);
    }, []);

    const addToast = useCallback((type, text) => {
        const id = ++toastIdCounter;
        setToasts(prev => [{ id, type, text, exiting: false }, ...prev]);
        timersRef.current[id] = setTimeout(() => removeToast(id), 15000);
        return id;
    }, [removeToast]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            Object.values(timersRef.current).forEach(clearTimeout);
        };
    }, []);

    const toast = {
        error: (text) => addToast("error", text),
        success: (text) => addToast("success", text),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast container — fixed bottom-right, stacking */}
            <div className="toast-container">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`toast-item toast-${t.type} ${t.exiting ? "toast-exit" : "toast-enter"}`}
                    >
                        <div className="toast-icon">
                            {t.type === "error" ? (
                                <AlertTriangle size={16} />
                            ) : (
                                <CheckCircle2 size={16} />
                            )}
                        </div>
                        <p className="toast-text">{t.text}</p>
                        <button
                            className="toast-close"
                            onClick={() => removeToast(t.id)}
                            aria-label="Zatvori"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
