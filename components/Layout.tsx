
import React, { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">ImporTrack <span className="text-blue-600">Pro</span></h1>
                <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest leading-none">Tracking Cadena Logistica</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
              <button className="hover:text-blue-600 transition-colors">Dashboard</button>
              <button className="hover:text-blue-600 transition-colors">Embarques</button>
              <button className="hover:text-blue-600 transition-colors">Alertas</button>
            </nav>
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-4 focus:outline-none hover:opacity-80 transition-opacity"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium text-slate-900">{user?.nombre || user?.name || 'Admin Logística'}</p>
                  <p className="text-[10px] text-slate-500">Premium Account</p>
                </div>
                <img className="h-9 w-9 rounded-full bg-slate-200 border border-slate-300" src="https://picsum.photos/seed/admin/100/100" alt="Profile" />
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-20">
                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.nombre || user?.name || 'Usuario'}</p>
                      <p className="text-[10px] text-slate-400">Sesión activa</p>
                    </div>
                    <button 
                      onClick={() => { setIsMenuOpen(false); if (onLogout) onLogout(); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors uppercase tracking-wider flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} ParionaSoft. ImporTrack Pro. Optimización de tiempos y costos logísticos.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
