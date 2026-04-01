/**
 * Componente: CapitalSummary (Resumen de Capital)
 * Descripción: Vista financiera que muestra los ingresos, gastos, facturas 
 * pendientes de cobro y métricas económicas del taller.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Clock, CheckCircle, Package, ChevronRight, TrendingUp, AlertCircle } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

export default function CapitalSummary() {
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/repairs');
            setRepairs(res.data);
        } catch (error) {
            console.error("Error fetching repairs for capital summary:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filtros lógicos
    const pendingPayment = repairs.filter(r => r.status === 'terminado' && !r.paid);
    const inProgress = repairs.filter(r => r.status === 'pendiente');
    const delivered = repairs.filter(r => r.status === 'entregado');

    const totalPendingPayment = pendingPayment.reduce((acc, curr) => acc + curr.total_cost, 0);
    const totalInProgress = inProgress.reduce((acc, curr) => acc + curr.total_cost, 0);
    const totalDelivered = delivered.reduce((acc, curr) => acc + curr.total_cost, 0);

    const SectionHeader = ({ icon: Icon, title, subtitle, count, total, colorClass, status, payment }) => (
        <div
            onClick={() => navigate(`/repairs?status=${status}${payment ? `&payment=${payment}` : ''}`)}
            className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-blue-500/50 cursor-pointer group"
        >
            <div className="flex items-center gap-4">
                <div className={cn("p-4 rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110", colorClass)}>
                    <Icon size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic">{title}</h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1">{subtitle} • {count} Órdenes</p>
                </div>
            </div>
            <div className="text-center md:text-right">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">Volumen Total (Click para filtrar)</p>
                <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums italic group-hover:text-blue-600 transition-colors">€{total.toFixed(2)}</span>
            </div>
        </div>
    );

    const RepairList = ({ list }) => (
        <div className="max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-slate-400 uppercase font-black text-[10px] tracking-widest border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem]">
                        No hay registros en esta categoría
                    </div>
                ) : (
                    list.map(repair => (
                        <div
                            key={repair.id}
                            onClick={() => navigate(`/repairs/${repair.id}`)}
                            className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest bg-slate-50 dark:bg-slate-950 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-800">#{repair.id.toString().padStart(4, '0')}</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white italic">€{repair.total_cost.toFixed(2)}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-300 uppercase tracking-tight text-sm line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">{repair.description}</h4>
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate flex-1">
                                    {repair.motorcycle ? `${repair.motorcycle.plate} • ${repair.motorcycle.brand}` : (repair.client?.name || "VENTA DIRECTA")}
                                </p>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase text-xs tracking-widest">Calculando balances y activos...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex items-center justify-between">
                <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Cuentas', to: '/capital' }]} />
                <div className="text-right">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">Capital & Cuentas</h1>
                    <p className="text-slate-400 dark:text-slate-500 mt-2 font-black uppercase tracking-widest text-[9px]">Análisis global de facturación y pendientes</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    onClick={() => navigate('/repairs?status=terminado&payment=unpaid')}
                    className="p-8 bg-rose-600 rounded-[2.5rem] text-white shadow-2xl shadow-rose-500/20 relative overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <AlertCircle className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Por Cobrar (Terminados)</p>
                    <h3 className="text-4xl font-black italic tabular-nums leading-none">€{totalPendingPayment.toFixed(2)}</h3>
                </div>
                <div
                    onClick={() => navigate('/repairs?status=pendiente')}
                    className="p-8 bg-amber-500 rounded-[2.5rem] text-white shadow-2xl shadow-amber-500/20 relative overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <Clock className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">En Taller (Aperturadas)</p>
                    <h3 className="text-4xl font-black italic tabular-nums leading-none">€{totalInProgress.toFixed(2)}</h3>
                </div>
                <div
                    onClick={() => navigate('/repairs?status=entregado')}
                    className="p-8 bg-emerald-600 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Facturación (Entregados)</p>
                    <h3 className="text-4xl font-black italic tabular-nums leading-none">€{totalDelivered.toFixed(2)}</h3>
                </div>
            </div>

            <div className="mt-16">
                <SectionHeader
                    icon={Wallet}
                    title="Pendiente de Cobro"
                    subtitle="Vehículos terminados esperando retirada"
                    count={pendingPayment.length}
                    total={totalPendingPayment}
                    colorClass="bg-rose-600"
                    status="terminado"
                    payment="unpaid"
                />
                <RepairList list={pendingPayment} />

                <SectionHeader
                    icon={Clock}
                    title="Órdenes Pendientes"
                    subtitle="Trabajos actualmente en ejecución"
                    count={inProgress.length}
                    total={totalInProgress}
                    colorClass="bg-amber-500"
                    status="pendiente"
                />
                <RepairList list={inProgress} />

                <SectionHeader
                    icon={CheckCircle}
                    title="Historial Entregados"
                    subtitle="Resumen de facturación cerrada"
                    count={delivered.length}
                    total={totalDelivered}
                    colorClass="bg-emerald-600"
                    status="entregado"
                />
                <RepairList list={delivered} />
            </div>
        </div>
    );
}

