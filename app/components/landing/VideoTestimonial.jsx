'use client';
import { Play, Star } from 'lucide-react';
import { useState } from 'react';

export default function VideoTestimonial({ 
  name, 
  role, 
  company, 
  image, 
  quote, 
  videoThumbnail, 
  align = 'left' 
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className={`flex flex-col md:flex-row items-center gap-8 py-12 md:py-24 ${align === 'right' ? 'md:flex-row-reverse' : ''}`}>
      
      {/* Video Side */}
      <div className="w-full md:w-1/2 relative group">
        <div 
          className="aspect-video rounded-2xl overflow-hidden relative shadow-2xl border"
          style={{ 
            borderColor: 'var(--lp-border)',
            background: 'var(--lp-surface)'
          }}
        >
          {!isPlaying ? (
            <>
              {videoThumbnail ? (
                <img src={videoThumbnail} alt={`Testimonial from ${name}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                  <span className="text-zinc-500 text-sm">Video nije dostupan</span>
                </div>
              )}
              
              <button 
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ 
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Play fill="white" className="ml-1 text-white" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <p className="text-white">Video player placeholder</p>
            </div>
          )}
        </div>
        
        {/* Decorative elements behind */}
        <div 
          className="absolute -z-10 top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-tr from-green-500/10 to-blue-500/10 rounded-full blur-3xl opacity-50" 
        />
      </div>

      {/* Text Side */}
      <div className="w-full md:w-1/2 text-center md:text-left">
        <div className="flex justify-center md:justify-start gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={20} fill="#f59e0b" className="text-amber-500" />
          ))}
        </div>
        
        <blockquote 
          className="text-xl md:text-2xl font-medium leading-relaxed mb-6"
          style={{ color: 'var(--lp-heading)' }}
        >
          "{quote}"
        </blockquote>
        
        <div>
          <div className="font-bold text-lg" style={{ color: 'var(--lp-heading)' }}>{name}</div>
          <div className="text-sm" style={{ color: 'var(--lp-text-muted)' }}>{role}, {company}</div>
        </div>
      </div>
    </div>
  );
}
