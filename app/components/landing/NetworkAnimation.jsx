'use client';
import { useEffect, useState } from 'react';
import { Server, Zap, Palette, Wrench, BarChart3, ShieldCheck } from 'lucide-react';

export default function NetworkAnimation() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Delay activation slightly for entrance effect
    const timeout = setTimeout(() => setActive(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  // Coordinates are relative to a 100x100 grid centered at 50,50
  // Monochrome colors: using CSS variables (via currentcolor or filtered) or static grays that work on both themes
  // We'll use 'currentColor' for strokes and let the parent container set the color
  const nodes = [
    { icon: Server, label: 'Hosting', x: 15, y: 20, delay: 0 },
    { icon: Zap, label: 'Brzina', x: 85, y: 20, delay: 0.2 },
    { icon: Palette, label: 'Dizajn', x: 15, y: 80, delay: 0.4 },
    { icon: BarChart3, label: 'SEO', x: 85, y: 80, delay: 0.6 },
    { icon: Wrench, label: 'Održavanje', x: 50, y: 90, delay: 0.8 },
    { icon: ShieldCheck, label: 'Sigurnost', x: 50, y: 10, delay: 1.0 },
  ];

  return (
    <div className="relative w-full aspect-square max-w-[500px] mx-auto p-4 md:p-12 select-none" style={{ color: 'var(--lp-heading)' }}>
      
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, var(--lp-border) 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }} 
      />

      {/* Connection Lines (SVG Layer) */}
      <svg className="absolute inset-0 w-full h-full z-0 overflow-visible" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--lp-text)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Hub Glow */}
        <circle cx="50" cy="50" r="40" fill="url(#hubGlow)" className="animate-pulse" />

        {nodes.map((node, i) => (
          <g key={i}>
            {/* Connection Line */}
            <line
              x1="50"
              y1="50"
              x2={node.x}
              y2={node.y}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="100"
              strokeDashoffset={active ? '0' : '100'}
              className="transition-all duration-[1500ms] ease-out"
              style={{ transitionDelay: `${node.delay}s`, opacity: 0.2 }}
            />
            
            {/* Moving Particle along the line */}
            {active && (
              <circle r="1" fill="currentColor">
                <animateMotion 
                  dur="3s" 
                  repeatCount="indefinite"
                  // Move from center to node and back
                  path={`M 50 50 L ${node.x} ${node.y} L 50 50`}
                  begin={`${node.delay}s`}
                  keyPoints="0;1;0"
                  keyTimes="0;0.5;1"
                />
              </circle>
            )}
          </g>
        ))}
      </svg>

      {/* Central Hub (DOM Layer) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 rounded-full z-20 flex flex-col items-center justify-center shadow-2xl transition-all duration-700 hover:scale-105"
        style={{ 
          background: 'var(--lp-surface)',
          border: '1px solid var(--lp-border)',
          boxShadow: '0 0 40px -10px rgba(0,0,0,0.1)',
          opacity: active ? 1 : 0,
          transform: active ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.5)'
        }}
      >
        <div className="font-bold text-lg md:text-xl" style={{ color: 'var(--lp-heading)' }}>Rent a Web</div>
        <div 
          className="text-[10px] md:text-xs mt-1 px-2 py-0.5 rounded-full font-medium"
          style={{ background: 'var(--lp-bg-alt)', color: 'var(--lp-text-muted)' }}
        >
          All-in-One
        </div>
      </div>

      {/* Satellite Nodes (DOM Layer) */}
      {nodes.map((node, i) => (
        <div
          key={i}
          className="absolute w-12 h-12 md:w-14 md:h-14 rounded-xl flex flex-col items-center justify-center shadow-lg transition-all duration-500 z-10 hover:scale-110 hover:z-30 cursor-default"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            background: 'var(--lp-surface)',
            border: '1px solid var(--lp-border)',
            transform: 'translate(-50%, -50%)',
            opacity: active ? 1 : 0,
            transitionDelay: `${node.delay + 0.5}s`
          }}
        >
          <node.icon size={20} className="mb-0.5" style={{ color: 'var(--lp-heading)' }} />
          <span className="text-[9px] font-medium hidden md:block" style={{ color: 'var(--lp-text-muted)' }}>{node.label}</span>
        </div>
      ))}
    </div>
  );
}
