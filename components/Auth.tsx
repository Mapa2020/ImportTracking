import React, { useState, useEffect } from 'react';

interface AuthProps {
  onLogin: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);
  
  // Para reset password
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    // Detectar si venimos de un link de email
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setView('reset');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const API_URL = 'http://localhost:3001';

    let url = '';
    let body = {};

    if (view === 'login') {
      url = `${API_URL}/api/auth/login`;
      body = { email, password };
    } else if (view === 'register') {
      url = `${API_URL}/api/auth/register`;
      body = { nombre, email, password };
    } else if (view === 'forgot') {
      url = `${API_URL}/api/auth/forgot-password`;
      body = { email };
    } else if (view === 'reset') {
      url = `${API_URL}/api/auth/reset-password`;
      body = { token: resetToken, newPassword: password };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error en la solicitud');

      if (view === 'login') {
        localStorage.setItem('token', data.token);
        onLogin(data.user);
      } else if (view === 'register') {
        setMessage({ type: 'success', text: 'Usuario creado. Por favor inicia sesión.' });
        setView('login');
      } else if (view === 'forgot') {
        setMessage({ type: 'success', text: 'Si el correo existe, recibirás un enlace.' });
      } else if (view === 'reset') {
        setMessage({ type: 'success', text: 'Contraseña actualizada. Inicia sesión.' });
        setTimeout(() => {
            window.location.href = '/'; // Limpiar URL
            setView('login');
        }, 2000);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {view === 'login' && 'Iniciar Sesión'}
            {view === 'register' && 'Crear Cuenta'}
            {view === 'forgot' && 'Recuperar Acceso'}
            {view === 'reset' && 'Nueva Contraseña'}
          </h2>
          <p className="text-slate-500 text-sm mt-2">ImporTrack Pro - Gestión Logística</p>
        </div>

        {message && (
          <div className={`mb-6 p-3 rounded-lg text-sm font-bold text-center ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </div>
          )}

          {view !== 'reset' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          )}

          {(view === 'login' || view === 'register' || view === 'reset') && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {view === 'reset' ? 'Nueva Contraseña' : 'Contraseña'}
              </label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition-all shadow-lg mt-4"
          >
            {view === 'login' && 'Ingresar al Sistema'}
            {view === 'register' && 'Registrar Usuario'}
            {view === 'forgot' && 'Enviar Enlace'}
            {view === 'reset' && 'Cambiar Contraseña'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {view === 'login' && (
            <>
              <p className="text-xs text-slate-400 font-medium cursor-pointer hover:text-blue-600" onClick={() => setView('forgot')}>
                ¿Olvidaste tu contraseña?
              </p>
              <p className="text-xs text-slate-400 font-medium cursor-pointer hover:text-blue-600" onClick={() => setView('register')}>
                ¿No tienes cuenta? Regístrate
              </p>
            </>
          )}
          {(view === 'register' || view === 'forgot') && (
            <p className="text-xs text-slate-400 font-medium cursor-pointer hover:text-blue-600" onClick={() => setView('login')}>
              Volver al inicio de sesión
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
