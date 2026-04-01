import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Bike, Wrench, Package, Settings, Sun, Moon, LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    // isSidebarOpen SOLO controla el overlay móvil — en PC siempre son iconos
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
    const [workshopName, setWorkshopName] = React.useState('TALLER');
    const [logoUrl, setLogoUrl] = React.useState(null);
    const { theme, toggleTheme } = useTheme();
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Cerrar sidebar al navegar en móviles
    React.useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [location.pathname]);

    React.useEffect(() => {
        api.get('/settings').then(res => {
            const settings = res.data;
            const nameSetting = settings.find(s => s.key === 'workshop_name');
            if (nameSetting && nameSetting.value) setWorkshopName(nameSetting.value);
            const logoSetting = settings.find(s => s.key === 'logo_url');
            if (logoSetting && logoSetting.value) setLogoUrl(logoSetting.value);
        }).catch(err => console.error("Error fetching settings:", err));
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Inicio', to: '/', colorText: 'text-indigo-500 dark:text-indigo-400', colorActive: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 dark:bg-indigo-500 hover:bg-indigo-500' },
        { icon: Wrench, label: 'Trabajos', to: '/repairs', colorText: 'text-amber-500 dark:text-amber-400', colorActive: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 dark:bg-amber-500 hover:bg-amber-400' },
        { icon: Bike, label: 'Motos', to: '/motorcycles', colorText: 'text-red-600 dark:text-red-500', colorActive: 'bg-red-600 text-white shadow-lg shadow-red-600/20 dark:bg-red-600 hover:bg-red-500' },
        { icon: Users, label: 'Clientes', to: '/clients', colorText: 'text-blue-600 dark:text-blue-500', colorActive: 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 dark:bg-blue-600 hover:bg-blue-500' },
        { icon: Package, label: 'Almacén', to: '/stock', colorText: 'text-emerald-600 dark:text-emerald-500', colorActive: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 dark:bg-emerald-600 hover:bg-emerald-500' },
        ...(isAdmin() || user?.role === 'admin' ? [{ icon: Users, label: 'Cuentas', to: '/capital', colorText: 'text-rose-600 dark:text-rose-500', colorActive: 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 dark:bg-rose-600 hover:bg-rose-500' }] : []),
        { icon: Settings, label: 'Ajustes', to: '/settings', colorText: 'text-slate-500 dark:text-slate-400', colorActive: 'bg-slate-600 text-white shadow-lg shadow-slate-600/20 dark:bg-slate-500 hover:bg-slate-500' },
    ];

    const logoSrc = logoUrl
        ? (logoUrl.startsWith('http') ? logoUrl : `${api.defaults.baseURL}${logoUrl}`)
        : null;

    return (
        <div className={cn(
            "flex h-screen transition-colors duration-300 overflow-hidden",
            theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
        )}>

            {/* ═══════════════════════════════════════════
                MOBILE HEADER (solo en pantallas <md)
            ═══════════════════════════════════════════ */}
            <header className={cn(
                "md:hidden fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-[80] border-b backdrop-blur-md",
                theme === 'dark' ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"
            )}>
                <div className="flex items-center gap-1 flex-1 min-w-0 pr-2">
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="p-2 text-slate-500 hover:text-red-600 transition-colors shrink-0"
                    >
                        <Menu size={22} />
                    </button>
                    {/* Accesos rápidos móvil (scroll horizontal, full width) */}
                    <div className="flex items-center justify-between gap-2 flex-1 overflow-x-auto shrink whitespace-nowrap scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {navItems.map(item => (
                            <NavLink 
                                key={item.to} 
                                to={item.to} 
                                end={item.to === '/'} 
                                className={({ isActive }) => cn(
                                    "p-1.5 rounded-full transition-all shrink-0", 
                                    isActive 
                                        ? item.colorActive 
                                        : "hover:bg-slate-200 dark:hover:bg-slate-700"
                                )} 
                                title={item.label}
                            >
                                {({ isActive }) => (
                                    <item.icon size={18} className={cn(!isActive && item.colorText)} />
                                )}
                            </NavLink>
                        ))}
                    </div>
                </div>
                <div className="flex items-center shrink-0 pl-1">
                    {/* Ocultado el nombre de la empresa para maximizar espacio para los iconos nativos */}
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                        {logoSrc ? <img src={logoSrc} alt="Logo" className="w-[20px] h-[20px] object-contain" /> : <Bike size={18} className="text-red-600" />}
                    </div>
                </div>
            </header>

            {/* ═══════════════════════════════════════════
                MOBILE OVERLAY (solo en <md)
            ═══════════════════════════════════════════ */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* ═══════════════════════════════════════════
                SIDEBAR
                • PC (≥md): siempre visible, w-20 por defecto,
                  w-72 al hacer hover (CSS puro, group-hover)
                • Móvil (<md): overlay flotante, controlado por isMobileSidebarOpen
            ═══════════════════════════════════════════ */}
            <aside className={cn(
                // Base: columna flex, transición suave
                "flex flex-col border-r z-[120] shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden",
                theme === 'dark' ? "bg-slate-900 border-slate-800 shadow-slate-950/50" : "bg-white border-slate-200",
                // PC: relativo, siempre visible, ancho cambia con hover del CSS
                "md:relative md:translate-x-0 md:opacity-100 md:pointer-events-auto md:w-20 md:hover:w-72 shadow-none md:shadow-2xl group/sidebar",
                // Móvil: fijo, slide desde la izquierda según estado
                isMobileSidebarOpen
                    ? "fixed inset-y-0 left-0 w-72 translate-x-0 opacity-100"
                    : "fixed inset-y-0 left-0 w-72 -translate-x-full opacity-0 pointer-events-none md:pointer-events-auto"
            )}>

                {/* — Logo / Nombre taller — */}
                <div className={cn(
                    "h-20 flex items-center border-b shrink-0 overflow-hidden transition-all duration-300",
                    "pl-[19px]", // Fixed padding to perfectly center the logo box in the 80px sidebar
                    theme === 'dark' ? "border-slate-800 bg-slate-900/50" : "border-slate-100"
                )}>
                    <NavLink to="/" className="flex items-center min-w-0 transition-all duration-300 gap-3">
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 w-[42px] h-[42px] flex items-center justify-center">
                            {logoSrc ? <img src={logoSrc} alt="Logo" className="w-[26px] h-[26px] object-contain" /> : <Bike size={22} className="text-red-600" />}
                        </div>
                        {/* Nombre: oculto por defecto, visible on hover (PC) o cuando overlay abierto (móvil) */}
                        <h1 className={cn(
                            "text-base font-black tracking-tighter uppercase italic text-red-600 whitespace-nowrap overflow-hidden transition-all duration-300",
                            // PC: se muestra al hover del aside (group/sidebar)
                            "max-w-0 opacity-0 md:group-hover/sidebar:max-w-[200px] md:group-hover/sidebar:opacity-100",
                            // Móvil overlay abierto: siempre visible
                            isMobileSidebarOpen && "max-w-[200px] opacity-100"
                        )}>
                            {workshopName}
                        </h1>
                    </NavLink>
                    {/* Botón cerrar en móvil */}
                    <button className="md:hidden ml-auto text-slate-400 p-1 hover:text-red-600" onClick={() => setIsMobileSidebarOpen(false)}>
                        <X size={22} />
                    </button>
                </div>

                {/* — Navegación — */}
                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            title={item.label}
                            className={({ isActive }) => cn(
                                "flex items-center h-12 rounded-2xl transition-all duration-300 overflow-hidden whitespace-nowrap gap-4",
                                "pl-5", // Fixed padding: 8px from nav + 20px here = 28px left from screen edge. Icon is 22px. Center = 39px.
                                isActive
                                    ? item.colorActive
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={22} className={cn("shrink-0 transition-colors", !isActive && item.colorText)} />
                                    <span className={cn(
                                        "text-xs font-bold uppercase tracking-widest transition-all duration-300",
                                        !isActive ? "text-slate-900 dark:text-slate-100" : "text-white",
                                        // PC hover
                                        "max-w-0 opacity-0 md:group-hover/sidebar:max-w-[180px] md:group-hover/sidebar:opacity-100",
                                        // Móvil overlay abierto
                                        isMobileSidebarOpen && "max-w-[180px] opacity-100"
                                    )}>
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* — Footer: usuario + tema — */}
                <div className={cn(
                    "border-t p-3 space-y-2 shrink-0 overflow-hidden",
                    theme === 'dark' ? "border-slate-800" : "border-slate-100"
                )}>
                    {/* Usuario */}
                    <div className="flex items-center overflow-hidden transition-all duration-300 gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm ml-2">
                            <UserIcon size={20} />
                        </div>
                        <span className={cn(
                            "text-[10px] font-black uppercase italic truncate transition-all duration-300",
                            "max-w-0 opacity-0 md:group-hover/sidebar:max-w-[120px] md:group-hover/sidebar:opacity-100",
                            isMobileSidebarOpen && "max-w-[120px] opacity-100"
                        )}>
                            {user?.username}
                        </span>
                        <button
                            onClick={handleLogout}
                            title="Cerrar sesión"
                            className={cn(
                                "ml-auto p-1.5 text-slate-400 hover:text-red-600 transition-all shrink-0",
                                "opacity-0 pointer-events-none w-0 md:group-hover/sidebar:w-auto md:group-hover/sidebar:opacity-100 md:group-hover/sidebar:pointer-events-auto",
                                isMobileSidebarOpen && "opacity-100 pointer-events-auto w-auto"
                            )}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>

                    {/* Modo claro/oscuro */}
                    <button
                        onClick={toggleTheme}
                        className={cn(
                            "flex items-center w-full rounded-2xl py-2.5 pr-3 pl-[18px] transition-all duration-300 border overflow-hidden gap-3",
                            theme === 'dark'
                                ? "text-yellow-400 border-slate-700 hover:bg-slate-800 bg-slate-900/50"
                                : "text-slate-500 border-slate-200 hover:bg-slate-100 bg-slate-50"
                        )}
                    >
                        {theme === 'dark' ? <Sun size={20} className="shrink-0" /> : <Moon size={20} className="shrink-0" />}
                        <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300",
                            "max-w-0 opacity-0 md:group-hover/sidebar:max-w-[100px] md:group-hover/sidebar:opacity-100",
                            isMobileSidebarOpen && "max-w-[100px] opacity-100"
                        )}>
                            {theme === 'dark' ? 'CLARO' : 'OSCURO'}
                        </span>
                    </button>

                    {/* Cerrar menú (solo móvil) */}
                    <button
                        className="md:hidden w-full text-slate-400 py-1 text-[9px] font-black uppercase tracking-widest"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    >
                        CERRAR MENÚ
                    </button>
                </div>
            </aside>

            {/* ═══════════════════════════════════════════
                CONTENIDO PRINCIPAL
            ═══════════════════════════════════════════ */}
            <main className="flex-1 overflow-auto flex flex-col bg-slate-50 dark:bg-slate-950 pt-16 md:pt-0 overflow-x-hidden">
                <div className="p-4 md:p-10 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
