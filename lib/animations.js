'use client';

import React, { useState, useEffect, useRef } from 'react';

// Intersection Observer Hook for Scroll Animations
export const useOnScreen = (options) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, options);

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, [options]);

    return [ref, isVisible];
};

// Wrapper for animated sections
export const FadeIn = ({ children, delay = 0, className = "" }) => {
    const [ref, isVisible] = useOnScreen({ threshold: 0.1 });

    return (
        <div
            ref={ref}
            className={`transform-gpu will-change-transform transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                } ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};
