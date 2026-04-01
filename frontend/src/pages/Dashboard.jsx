/**
 * Componente: Dashboard
 * Descripción: Pantalla de inicio de la aplicación. Muestra un resumen general 
 * del estado del taller, número de clientes, motos, stock, y un listado de las
 * últimas reparaciones o movimientos recientes.
 */
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Bike, Wrench, AlertCircle, Eye, EyeOff, Package, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

function StatCard({ icon: Icon, label, value, colorClass, to, isSensitive }) {
    const [isVisible, setIsVisible] = useState(!isSensitive);
    const { theme } = useTheme();

    const toggleVisibility = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsVisible(!isVisible);
    };

    const content = (
        <div className={cn(
            "p-6 rounded-3xl shadow-sm border flex items-center gap-5 relative h-full transition-all duration-300",
            theme === 'dark'
                ? "bg-slate-900 border-slate-800 shadow-slate-950/50"
                : "bg-white border-slate-100 shadow-slate-200/50",
            to ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : ''
        )}>
            <div className={`p-4 rounded-2xl ${colorClass} shadow-lg shadow-${colorClass.split('-')[1]}-500/20`}>
                <Icon size={24} className="text-white" />
            </div>
            <div className="flex-1">
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">
                        {isVisible ? value : '••••••'}
                    </h3>
                    {isSensitive && (
                        <button
                            onClick={toggleVisibility}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    )}
                </div>
            </div>
            {to && (
                <div className="absolute top-4 right-4 text-slate-200 dark:text-slate-800 group-hover:text-blue-500 transition-colors">
                    <ChevronRight size={16} />
                </div>
            )}
        </div>
    );

    if (to) {
        return <Link to={to} className="block group">{content}</Link>;
    }
    return content;
}

export default function Dashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [stats, setStats] = useState({
        clients: 0,
        motorcycles: 0,
        activeRepairs: 0,
        pendingRevenue: 0,
        stockItems: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [location]);

    const fetchStats = async () => {
        try {
            const [clientsRes, motosRes, repairsRes, stockRes] = await Promise.all([
                api.get('/clients'),
                api.get('/motorcycles'),
                api.get('/repairs'),
                api.get('/stock')
            ]);

            const activeRepairsCount = repairsRes.data.filter(r => r.status !== 'entregado').length;
            const pendingRevenueCalc = repairsRes.data
                .filter(r => !r.paid)
                .reduce((acc, curr) => acc + curr.total_cost, 0);

            // Filter out 'inactiva' clients and 'PÚBLICO GENERAL'
            const activeClientsCount = clientsRes.data.filter(c =>
                c.status !== 'inactiva' && c.name.trim().toUpperCase() !== 'PÚBLICO GENERAL'
            ).length;

            // Filter out 'vendida' or 'inactiva' motorcycles
            const activeMotosCount = motosRes.data.filter(m =>
                (m.status || 'activa') === 'activa'
            ).length;

            setStats({
                clients: activeClientsCount,
                motorcycles: activeMotosCount,
                activeRepairs: activeRepairsCount,
                pendingRevenue: pendingRevenueCalc,
                stockItems: stockRes.data.length,
                recentRepairs: repairsRes.data.slice(0, 10)
            });
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 overflow-hidden">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic truncate">Resumen del Taller</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-widest text-[9px] sm:text-xs">Estado actual de la actividad y activos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <StatCard
                    icon={Users}
                    label="Clientes"
                    value={loading ? "..." : stats.clients}
                    colorClass="bg-blue-600"
                    to="/clients"
                />
                <StatCard
                    icon={Bike}
                    label="Garaje"
                    value={loading ? "..." : stats.motorcycles}
                    colorClass="bg-red-600"
                    to="/motorcycles"
                />
                <StatCard
                    icon={Wrench}
                    label="Taller"
                    value={loading ? "..." : stats.activeRepairs}
                    colorClass="bg-amber-500"
                    to="/repairs"
                />
                <StatCard
                    icon={Package}
                    label="Almacén"
                    value={loading ? "..." : stats.stockItems}
                    colorClass="bg-emerald-600"
                    to="/stock"
                />
                <StatCard
                    icon={AlertCircle}
                    label="Cuentas"
                    value={loading ? "..." : `€${stats.pendingRevenue.toFixed(2)}`}
                    colorClass="bg-rose-600"
                    to="/capital"
                    isSensitive={true}
                />
            </div>

            <div className={cn(
                "rounded-2xl sm:rounded-[2.5rem] shadow-sm border overflow-hidden transition-all duration-300",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
            )}>
                <div className="p-5 sm:p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic">Últimos Movimientos</h2>
                    <Link to="/repairs" className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline whitespace-nowrap">Ver todo</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
                                <th className="px-8 py-4 font-black">Descripción Taller</th>
                                <th className="px-8 py-4 font-black">Estado</th>
                                <th className="px-8 py-4 font-black">Importe</th>
                                <th className="px-8 py-4 font-black text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="4" className="px-8 py-10 text-center text-slate-400 uppercase font-black text-[10px] tracking-widest animate-pulse">Sincronizando datos...</td></tr>
                            ) : stats.recentRepairs?.length === 0 ? (
                                <tr><td colSpan="4" className="px-8 py-10 text-center text-slate-400">No hay reparaciones registradas.</td></tr>
                            ) : (
                                stats.recentRepairs?.map(repair => {
                                    const statusStyles = {
                                        pendiente: "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 border-amber-100 dark:border-amber-900/30",
                                        terminado: "bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 border-blue-100 dark:border-blue-900/30",
                                        entregado: "bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30"
                                    };
                                    const rowClass = statusStyles[repair.status] || "hover:bg-slate-50 dark:hover:bg-slate-950/50";

                                    // Badge Colors
                                    const badgeStyles = {
                                        pendiente: "bg-amber-100/50 text-amber-700 border-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
                                        terminado: "bg-blue-100/50 text-blue-700 border-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
                                        entregado: "bg-emerald-100/50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                                    };
                                    const badgeClass = badgeStyles[repair.status] || "bg-slate-100 text-slate-500";

                                    return (
                                        <tr
                                            key={repair.id}
                                            onClick={() => navigate(`/repairs/${repair.id}`)}
                                            className={cn(
                                                "transition-all group cursor-pointer border-b last:border-0 border-transparent",
                                                rowClass
                                            )}
                                        >
                                            <td className="px-8 py-5 text-slate-800 dark:text-slate-300 font-bold uppercase text-sm tracking-tight">{repair.description}</td>
                                            <td className="px-8 py-5">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                                    badgeClass
                                                )}>
                                                    {repair.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-slate-900 dark:text-white font-black">€{repair.total_cost.toFixed(2)}</td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="p-2 inline-flex items-center justify-center bg-white/50 dark:bg-black/20 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 rounded-xl transition-all shadow-sm">
                                                    <ChevronRight size={18} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
