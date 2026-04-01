import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiStatus, setApiStatus] = useState('checking'); // 'checking', 'online', 'offline'
    const { login } = useAuth();

    React.useEffect(() => {
        const checkStatus = async () => {
            try {
                const start = Date.now();
                const res = await fetch('https://apitaller.codigodiogenes.es/health');
                const end = Date.now();
                if (res.ok) {
                    setApiStatus('online');
                    console.log(`[DIAGNOSTICO] API Online (${end - start}ms)`);
                } else {
                    setApiStatus('offline');
                }
            } catch (e) {
                console.error("[DIAGNOSTICO] Error conectando a la API:", e);
                setApiStatus('offline');
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);
        if (!result.success) {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                    <div className="bg-blue-600 p-8 text-white text-center pb-12 relative overflow-hidden">
                        {/* Decorative items */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-lg"></div>
                        
                        <div className="relative inline-block p-4 bg-white rounded-3xl shadow-xl mb-6 transform hover:rotate-6 transition-transform">
                            <img src="./app_logo.ico" alt="Logo" className="w-16 h-16 object-contain" />
                        </div>
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Acceso Taller</h1>
                        <p className="text-blue-100 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Sistema v2.5 Management Platform</p>
                    </div>

                    <div className="p-10 -mt-6 bg-white dark:bg-slate-900 rounded-t-[2.5rem] relative">
                        {error && (
                            <div className="mb-6 p-5 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-4 rounded-r-2xl animate-shake">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase italic tracking-tight">Acceso Denegado</p>
                                    <p className="text-[10px] font-bold opacity-80 uppercase">{error}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 ml-4 italic tracking-widest">
                                    Nombre de Usuario
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        className="block w-full pl-12 pr-5 py-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all uppercase placeholder:italic placeholder:text-[10px]"
                                        placeholder="usuario..."
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 ml-4 italic tracking-widest">
                                    Contraseña de Acceso
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="block w-full pl-12 pr-14 py-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:italic placeholder:text-[10px]"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-blue-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-5 px-6 bg-slate-950 dark:bg-blue-600 hover:bg-slate-900 dark:hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed saturate-0' : ''}`}
                            >
                                {loading ? 'Validando...' : 'Iniciar Sesión'}
                            </button>
                        </form>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-10">
                        <div className="flex items-center gap-3 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                            <img src="./diogenes_logo.ico" alt="CodigoDiogenes" className="w-5 h-5 object-contain" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">SDK v2</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                                apiStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                apiStatus === 'offline' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
                                'bg-slate-400'
                            }`}></div>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${
                                apiStatus === 'online' ? 'text-emerald-600' : 
                                apiStatus === 'offline' ? 'text-rose-600' : 
                                'text-slate-400'
                            }`}>
                                {apiStatus === 'online' ? 'Servidor Online' : 
                                 apiStatus === 'offline' ? 'Error Conexión' : 
                                 'Verificando...'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
