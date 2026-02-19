'use client';

export default function Footer() {
  return (
    <footer className="py-12" style={{ background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border)' }}>
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3 font-bold text-lg" style={{ color: 'var(--lp-heading)' }}>
          <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
            <img src="https://framerusercontent.com/images/fbLxHSQG15wQ5GLsHXeLv64Nvlo.png" alt="Rent a Web Logo" className="w-full h-full object-cover" />
          </div>
          <span>Rent a Web</span>
        </div>
        <div className="flex gap-6 text-sm font-medium" style={{ color: 'var(--lp-text-muted)' }}>
          <a href="/auth/login" className="transition-colors hover:opacity-80">Korisnici</a>
          <a href="/politika-privatnosti" className="transition-colors hover:opacity-80">Politika privatnosti</a>
          <a href="/uvjeti-koristenja" className="transition-colors hover:opacity-80">Uvjeti korištenja</a>
          <a href="#contact" className="transition-colors hover:opacity-80">Kontakt</a>
        </div>
        <div className="text-sm" style={{ color: 'var(--lp-text-muted)' }}>
          © {new Date().getFullYear()} Rent a Web. Sva prava pridržana.
        </div>
      </div>
    </footer>
  );
}
