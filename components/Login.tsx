
import React, { useState } from 'react';
import { Lock, Recycle, Languages } from 'lucide-react';
import { Translation, Lang } from '../translations';

interface LoginProps {
  onLogin: () => void;
  t: Translation;
  lang: Lang;
  setLang: (lang: Lang) => void;
  themeColor: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin, t, lang, setLang, themeColor }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'admin') {
      onLogin();
    } else {
      setError(t.loginError);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 relative`}>
      <button 
        onClick={() => setLang(lang === 'ru' ? 'tj' : 'ru')}
        className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
        title="Switch Language / Иваз кардани забон"
      >
        <Languages size={24} />
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wider opacity-80">{lang}</span>
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-${themeColor}-100 text-${themeColor}-600 rounded-full mb-4`}>
            <Recycle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">EcoRecycle CRM</h1>
          <p className="text-slate-500 text-sm">{t.loginSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.loginLabel}</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className={`w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500 outline-none transition-all`}
              placeholder="admin"
              style={{ colorScheme: 'light' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.passLabel}</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className={`w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500 outline-none transition-all`}
              placeholder="•••••"
              style={{ colorScheme: 'light' }}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className={`w-full bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2`}
          >
            <Lock size={18} />
            {t.loginBtn}
          </button>
        </form>
      </div>
    </div>
  );
};
