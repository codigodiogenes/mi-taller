/**
 * Componente: Repairs (Reparaciones / Órdenes de Trabajo)
 * Descripción: Pantalla principal para gestionar los trabajos del taller.
 * Muestra las reparaciones divididas por estado (Pendiente, Completado, etc.)
 * y permite crear nuevas órdenes de trabajo.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Plus, Wrench, Calendar, DollarSign, CheckCircle, Search, ChevronRight, Filter, X, ShoppingBag, Trash2, Printer, Check } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

export default function Repairs() {
    const [repairs, setRepairs] = useState([]);
    const [motorcycles, setMotorcycles] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const motorcycleIdParam = searchParams.get('motorcycle_id');
    const clientIdParam = searchParams.get('client_id');

    const clientMotorcycles = clientIdParam
        ? motorcycles.filter(m => m.client_id && m.client_id.toString() === clientIdParam)
        : [];

    // Form state
    const [formData, setFormData] = useState({
        motorcycle_id: '',
        client_id: '',
        description: '',
        status: 'pendiente',
        paid: false,
        items: [],
        entry_km: ''
    });
    const [associationType, setAssociationType] = useState('motorcycle'); // 'motorcycle' or 'client'
    const [searchTerm, setSearchTerm] = useState(''); // For the form search

    // List filtering states
    const [listSearch, setListSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'pendiente');
    const [paymentFilter, setPaymentFilter] = useState(searchParams.get('payment') || 'all'); // 'all', 'paid', 'unpaid'
    const [dateFilter, setDateFilter] = useState(''); // YYYY-MM

    useEffect(() => {
        fetchData();
    }, []);

    // Sync filters with URL when they change (optional but good for UX, though user didn't explicitly ask for 2-way sync, just linking TO it)
    // For now, we just initialize FROM URL.

    const fetchData = async () => {
        try {
            const [repairsRes, motosRes, clientsRes] = await Promise.all([
                api.get('/repairs'),
                api.get('/motorcycles'),
                api.get('/clients')
            ]);
            setRepairs(repairsRes.data);
            setMotorcycles(motosRes.data);
            setClients(clientsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let finalClientId = formData.client_id;
            let finalDescription = formData.description;

            if (associationType === 'quick_sale') {
                const genericClient = clients.find(c =>
                    c.name && c.name.trim().toUpperCase() === 'PÚBLICO GENERAL'
                );
                if (!genericClient) {
                    alert("Error: No se encontró el cliente 'PÚBLICO GENERAL'. Por favor, ve a la sección de Clientes y crea un cliente con ese nombre exacto.");
                    return;
                }
                finalClientId = genericClient.id;
                finalDescription = "VENTA DIRECTA DE MOSTRADOR";
            }

            const payload = {
                ...formData,
                description: finalDescription,
                motorcycle_id: associationType === 'motorcycle' && formData.motorcycle_id ? parseInt(formData.motorcycle_id) : null,
                client_id: (associationType === 'client' || associationType === 'quick_sale') && finalClientId ? parseInt(finalClientId) : null,
                entry_km: formData.entry_km ? parseInt(formData.entry_km) : null
            };

            if (!payload.motorcycle_id && !payload.client_id) {
                alert("Debe seleccionar un vehículo, un cliente o elegir Venta Directa.");
                return;
            }

            if (!payload.description || payload.description.trim() === "") {
                alert("Debe ingresar una descripción (ej: Reparación, Venta de Aceite, etc.)");
                return;
            }

            const res = await api.post('/repairs', payload);
            setShowForm(false);
            setFormData({ motorcycle_id: '', client_id: '', description: '', status: 'pendiente', paid: false, items: [], entry_km: '' });
            setSearchTerm('');
            // Redirigir directamente a la nueva reparación para meter datos
            if (res.data && res.data.id) {
                navigate(`/repairs/${res.data.id}`);
            } else {
                fetchData();
            }
        } catch (error) {
            console.error("Error creating repair:", error);
            const detail = error.response?.data?.detail;
            const errorMsg = typeof detail === 'string' ? detail : (typeof detail === 'object' ? JSON.stringify(detail) : error.message);
            alert("Error al crear intervención: " + errorMsg);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'terminado': return 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-500/50';
            case 'entregado': return 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30 hover:border-emerald-300 dark:hover:border-emerald-500/50';
            default: return 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-500/50';
        }
    };

    const filteredRepairs = React.useMemo(() => repairs.filter(repair => {
        const moto = motorcycles.find(m => m.id === repair.motorcycle_id);
        const client = repair.client_id
            ? clients.find(c => c.id === repair.client_id)
            : (moto ? clients.find(c => c.id === moto.client_id) : null);

        const matchesSearch = !listSearch ||
            repair.description.toLowerCase().includes(listSearch.toLowerCase()) ||
            (moto && (
                moto.brand.toLowerCase().includes(listSearch.toLowerCase()) ||
                moto.model.toLowerCase().includes(listSearch.toLowerCase()) ||
                moto.plate.toLowerCase().includes(listSearch.toLowerCase())
            )) ||
            (client && client.name.toLowerCase().includes(listSearch.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || repair.status === statusFilter;

        let matchesPayment = true;
        if (paymentFilter === 'paid') matchesPayment = repair.paid === true;
        if (paymentFilter === 'unpaid') matchesPayment = repair.paid === false;

        const repairDate = new Date(repair.entry_date).toISOString().slice(0, 7);
        const matchesDate = !dateFilter || repairDate === dateFilter;
        const matchesMotorcycle = !motorcycleIdParam || (repair.motorcycle_id && repair.motorcycle_id.toString() === motorcycleIdParam);
        const matchesClient = !clientIdParam ||
            (repair.client_id && repair.client_id.toString() === clientIdParam) ||
            (moto && moto.client_id && moto.client_id.toString() === clientIdParam);

        return matchesSearch && matchesStatus && matchesPayment && matchesDate && matchesMotorcycle && matchesClient;
    }), [repairs, motorcycles, clients, listSearch, statusFilter, paymentFilter, dateFilter, motorcycleIdParam, clientIdParam]);

    const filteredMotos = React.useMemo(() => motorcycles.filter(m => {
        if (m.status === 'vendida' || m.status === 'inactiva') return false;
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const client = clients.find(c => c.id === m.client_id);
        const searchString = `${m.brand} ${m.model} ${m.plate} ${client ? client.name : ''}`.toLowerCase();
        return searchString.includes(term);
    }), [motorcycles, searchTerm, clients]);

    const filteredClients = React.useMemo(() => clients.filter(c => {
        if (c.status === 'inactiva') return false;
        if (c.name.trim().toUpperCase() === 'PÚBLICO GENERAL') return false;
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const searchString = `${c.name} ${c.phone} ${c.email || ''}`.toLowerCase();
        return searchString.includes(term);
    }), [clients, searchTerm]);

    const handleDeleteRepair = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm("¿ESTÁS COMPLETAMENTE SEGURO? Se eliminará la orden y todo su historial de forma DEFINITIVA.")) return;
        try {
            await api.delete(`/repairs/${id}`);
            fetchData();
        } catch (error) {
            console.error("Error deleting repair:", error);
            alert("No se pudo eliminar la orden. Verifique si tiene ítems asociados que impidan el borrado.");
        }
    };

    return (
        <div className="space-y-10">
            <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Taller', to: '/repairs' }]} />
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">Ordenes de Trabajo</h1>
                    <div className="flex items-center gap-3">
                        {motorcycleIdParam && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800 flex items-center gap-2">
                                <Filter size={14} />
                                Filtrado por Moto #{motorcycleIdParam}
                                <Link to="/repairs" className="hover:text-rose-500"><X size={14} /></Link>
                            </div>
                        )}
                        {clientIdParam && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800 flex items-center gap-2">
                                <Filter size={14} />
                                Filtrado por Cliente #{clientIdParam}
                                <Link to="/repairs" className="hover:text-rose-500"><X size={14} /></Link>
                            </div>
                        )}
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium uppercase tracking-widest text-xs">Gestión de reparaciones y mantenimientos</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                    <Plus size={20} /> Nueva Orden
                </button>
            </div>

            {/* FILTERS BAR */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-2 transition-colors">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por descripción, matrícula..."
                        className="w-full pl-14 pr-4 py-4 rounded-3xl bg-transparent border-none focus:outline-none focus:ring-0 dark:text-white font-bold"
                        value={listSearch}
                        onChange={e => setListSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-col md:flex-row gap-2 p-1">
                    <select
                        className="w-full md:w-auto px-6 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none dark:text-slate-300 text-xs font-black uppercase tracking-widest"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">TODOS LOS ESTADOS</option>
                        <option value="pendiente">PENDIENTES</option>
                        <option value="terminado">TERMINADOS</option>
                        <option value="entregado">ENTREGADOS</option>
                    </select>

                    <select
                        className="w-full md:w-auto px-6 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none dark:text-slate-300 text-xs font-black uppercase tracking-widest"
                        value={paymentFilter}
                        onChange={e => setPaymentFilter(e.target.value)}
                    >
                        <option value="all">PAGO: TODOS</option>
                        <option value="paid">PAGADOS</option>
                        <option value="unpaid">SIN PAGAR</option>
                    </select>

                    {clientIdParam && clientMotorcycles.length > 0 && (
                        <select
                            className="w-full md:w-auto px-6 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none dark:text-slate-300 text-xs font-black uppercase tracking-widest truncate"
                            value={motorcycleIdParam || ''}
                            onChange={e => {
                                const newParams = new URLSearchParams(searchParams);
                                if (e.target.value) {
                                    newParams.set('motorcycle_id', e.target.value);
                                } else {
                                    newParams.delete('motorcycle_id');
                                }
                                setSearchParams(newParams);
                            }}
                        >
                            <option value="">TODAS LAS MOTOS</option>
                            {clientMotorcycles.map(m => (
                                <option key={m.id} value={m.id}>{m.brand} {m.model} - {m.plate}</option>
                            ))}
                        </select>
                    )}

                    <input
                        type="month"
                        className="w-full md:w-auto px-6 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none dark:text-slate-300 text-xs font-black uppercase tracking-widest"
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                    />

                    {(listSearch || statusFilter !== 'all' || paymentFilter !== 'all' || dateFilter || motorcycleIdParam || clientIdParam) && (
                        <button
                            onClick={() => {
                                setListSearch('');
                                setStatusFilter('all');
                                setPaymentFilter('all');
                                setDateFilter('');
                                navigate('/repairs'); // Clear URL params
                            }}
                            className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* REPAIRS LIST */}
            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="px-10 py-20 text-center text-slate-400 uppercase font-black text-[10px] tracking-[0.2em] animate-pulse">Sincronizando órdenes...</div>
                ) : filteredRepairs.length === 0 ? (
                    <div className="px-10 py-32 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] transition-colors">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Wrench size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 uppercase font-black text-[10px] tracking-widest max-w-xs mx-auto leading-relaxed">
                            {listSearch || statusFilter !== 'all' || dateFilter || motorcycleIdParam || clientIdParam
                                ? "No se localizaron órdenes con los criterios especificados."
                                : "No hay órdenes de trabajo activas en este momento."}
                        </p>
                    </div>
                ) : (
                    filteredRepairs.map(repair => {
                        const moto = motorcycles.find(m => m.id === repair.motorcycle_id);
                        const client = repair.client_id
                            ? clients.find(c => c.id === repair.client_id)
                            : (moto ? clients.find(c => c.id === moto.client_id) : null);

                        return (
                            <Link
                                to={`/repairs/${repair.id}`}
                                key={repair.id}
                                className={cn(
                                    "group p-8 rounded-[2.5rem] shadow-sm border transition-all flex flex-col md:flex-row gap-8 items-center",
                                    getStatusStyles(repair.status)
                                )}
                            >
                                <div className="w-16 h-16 rounded-3xl bg-white/50 dark:bg-black/20 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-all">
                                    <Wrench size={28} />
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                                        <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <Calendar size={14} className="opacity-50" /> {new Date(repair.entry_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic group-hover:text-blue-600 transition-colors">{repair.description}</h3>

                                    <div className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        {moto ? (
                                            <>
                                                <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-slate-600 dark:text-slate-300 uppercase tracking-tighter italic">{moto.brand} {moto.model}</span>
                                                <span className="text-blue-500 font-black tracking-widest bg-blue-500/10 px-3 py-1 rounded-lg">{moto.plate}</span>
                                            </>
                                        ) : (
                                            <span className="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 px-3 py-1 rounded-lg uppercase tracking-[0.1em] text-[10px] font-black italic border border-amber-500/20">Venta / Servicio Directo</span>
                                        )}
                                        {client && <span className="opacity-40 font-medium">| {client.name.toUpperCase()}</span>}
                                    </div>
                                </div>

                                <div className="flex flex-wrap w-full md:w-auto items-center justify-center md:justify-end gap-6 sm:gap-10">
                                    <div className="text-center md:text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Presupuesto</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white italic tabular-nums">
                                            €{repair.total_cost.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado Pago</p>
                                        <div className={cn(
                                            "flex items-center justify-center md:justify-end gap-2 text-[10px] font-black uppercase tracking-widest",
                                            repair.paid ? 'text-emerald-500' : 'text-rose-500'
                                        )}>
                                            {repair.paid ? 'LIQUIDADO' : 'PENDIENTE'}
                                            {repair.paid && <CheckCircle size={14} />}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto justify-center md:justify-end">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDeleteRepair(e, repair.id);
                                            }}
                                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all"
                                            title="Eliminar Orden Definitivamente"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-black/20 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <ChevronRight size={24} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                )}
            </div>

            {/* Modal de Nueva Orden */}
            {
                showForm && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 my-8">
                                <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 rounded-t-[2.5rem] sticky top-0 z-10">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Nueva Orden de Trabajo</h2>
                                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-4 block">Asociar Intervención a:</label>
                                        <div className="grid grid-cols-3 gap-2 mb-8">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAssociationType('motorcycle');
                                                    setFormData(prev => ({ ...prev, client_id: '', motorcycle_id: '', description: '' }));
                                                    setSearchTerm('');
                                                }}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 group relative overflow-hidden",
                                                    associationType === 'motorcycle'
                                                        ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                                                        : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                                                )}
                                            >
                                                {associationType === 'motorcycle' && <div className="absolute top-2 right-2"><CheckCircle size={12} /></div>}
                                                <Wrench size={20} className={cn(associationType === 'motorcycle' ? "text-white" : "text-slate-300 group-hover:text-slate-500")} />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-center">Moto</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAssociationType('client');
                                                    setFormData(prev => ({ ...prev, motorcycle_id: '', client_id: '', description: '' }));
                                                    setSearchTerm('');
                                                }}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 group relative overflow-hidden",
                                                    associationType === 'client'
                                                        ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                                                        : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                                                )}
                                            >
                                                {associationType === 'client' && <div className="absolute top-2 right-2"><CheckCircle size={12} /></div>}
                                                <Plus size={20} className={cn(associationType === 'client' ? "text-white" : "text-slate-300 group-hover:text-slate-500")} />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-center">Cliente</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAssociationType('quick_sale');
                                                    setFormData(prev => ({ ...prev, motorcycle_id: '', client_id: '', description: 'VENTA DIRECTA DE MOSTRADOR' }));
                                                    setSearchTerm('');
                                                }}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 group relative overflow-hidden",
                                                    associationType === 'quick_sale'
                                                        ? "bg-emerald-600 border-emerald-600 text-white shadow-lg"
                                                        : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-emerald-500/30"
                                                )}
                                            >
                                                {associationType === 'quick_sale' && <div className="absolute top-2 right-2"><CheckCircle size={12} /></div>}
                                                <ShoppingBag size={20} className={cn(associationType === 'quick_sale' ? "text-white" : "text-slate-300 group-hover:text-emerald-500")} />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-center">Venta Directa</span>
                                            </button>
                                        </div>

                                        {associationType === 'motorcycle' ? (
                                            <>
                                                <div className="relative group mb-4">
                                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                        <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        placeholder="FILTRAR POR MATRÍCULA, MODELO O CLIENTE..."
                                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold text-sm uppercase"
                                                        value={searchTerm}
                                                        onChange={e => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                {filteredMotos.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 ml-2">Seleccionar Vehículo:</label>
                                                        <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 space-y-1">
                                                            {filteredMotos.map(m => {
                                                                const owner = clients.find(c => c.id === m.client_id)?.name || "?";
                                                                const isSelected = formData.motorcycle_id === m.id.toString(); // Ensure type string comparison if needed
                                                                // Or maintain strict type if ids are numbers. Let's assume loose or string match.
                                                                // Actually m.id is typically number, formData.motorcycle_id might be string from input.
                                                                // Using == for safety or flexible match.
                                                                const active = formData.motorcycle_id == m.id;

                                                                return (
                                                                    <button
                                                                        key={m.id}
                                                                        type="button"
                                                                        onClick={() => setFormData({ ...formData, motorcycle_id: m.id })}
                                                                        className={cn(
                                                                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                                                                            active
                                                                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                                                                : "hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
                                                                        )}
                                                                    >
                                                                        <div className={cn(
                                                                            "w-5 h-5 rounded-full flex items-center justify-center border",
                                                                            active ? "border-white bg-white/20" : "border-slate-300 dark:border-slate-600"
                                                                        )}>
                                                                            {active && <Check size={12} strokeWidth={4} />}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <span className="font-black text-sm uppercase italic block tracking-tight">
                                                                                {m.plate} - {m.brand} {m.model}
                                                                            </span>
                                                                            <span className={cn(
                                                                                "text-[9px] font-bold uppercase tracking-widest block",
                                                                                active ? "text-blue-100" : "text-slate-400 dark:text-slate-500"
                                                                            )}>
                                                                                Prop.: {owner}
                                                                            </span>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                                        No se encontraron vehículos
                                                    </div>
                                                )}
                                            </>
                                        ) : associationType === 'client' ? (
                                            <>
                                                <div className="relative group mb-4">
                                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                        <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        placeholder="FILTRAR POR NOMBRE, TELÉFONO..."
                                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold text-sm uppercase"
                                                        value={searchTerm}
                                                        onChange={e => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                {filteredClients.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 space-y-1">
                                                            {filteredClients.map(c => {
                                                                const active = formData.client_id == c.id;
                                                                return (
                                                                    <button
                                                                        key={c.id}
                                                                        type="button"
                                                                        onClick={() => setFormData({ ...formData, client_id: c.id })}
                                                                        className={cn(
                                                                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                                                                            active
                                                                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                                                                : "hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
                                                                        )}
                                                                    >
                                                                        <div className={cn(
                                                                            "w-5 h-5 rounded-full flex items-center justify-center border",
                                                                            active ? "border-white bg-white/20" : "border-slate-300 dark:border-slate-600"
                                                                        )}>
                                                                            {active && <Check size={12} strokeWidth={4} />}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <span className="font-black text-sm uppercase italic block tracking-tight">
                                                                                {c.name}
                                                                            </span>
                                                                            <span className={cn(
                                                                                "text-[9px] font-bold uppercase tracking-widest block",
                                                                                active ? "text-blue-100" : "text-slate-400 dark:text-slate-500"
                                                                            )}>
                                                                                Telf: {c.phone}
                                                                            </span>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                                        No se encontraron clientes
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="p-10 text-center bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl border border-emerald-500/20 animate-in zoom-in duration-300">
                                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <ShoppingBag size={28} className="text-emerald-500" />
                                                </div>
                                                <h4 className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-xs">Venta Directa a Público</h4>
                                                <p className="text-[10px] text-slate-500 mt-2 uppercase font-medium">Se registrará bajo el cliente "PÚBLICO GENERAL"</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5 block italic">Control Odómetro (Km)</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                    <Wrench size={18} className="text-slate-400 opacity-50" />
                                                </div>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-black italic"
                                                    value={formData.entry_km}
                                                    onChange={e => setFormData({ ...formData, entry_km: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5 block italic">Fecha de Ingreso</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                    <Calendar size={18} className="text-slate-400 opacity-50" />
                                                </div>
                                                <input
                                                    type="date"
                                                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-black uppercase text-xs"
                                                    defaultValue={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5 block italic">Descripción de la Intervención</label>
                                        <textarea
                                            required
                                            rows="4"
                                            placeholder="DETALLE EL PROBLEMA O EL MANTENIMIENTO A REALIZAR..."
                                            className="w-full px-8 py-6 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold uppercase tracking-tight"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="flex-1 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            Descartar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                        >
                                            Registrar Orden
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
