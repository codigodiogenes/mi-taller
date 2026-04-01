/**
 * Componente: ClientDetails (Ficha de Cliente)
 * Descripción: Muestra toda la información de un cliente en particular,
 * incluyendo las motocicletas que posee y su historial completo de reparaciones.
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Wrench, Calendar, DollarSign, CheckCircle, ArrowLeft, Bike, Printer, Phone, Mail, MapPin, ChevronRight, Edit2, Save, X, User, History } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

export default function ClientDetails() {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [motorcycles, setMotorcycles] = useState([]);
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        status: ''
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [clientRes, motosRes, repairsRes] = await Promise.all([
                api.get(`/clients/${id}`),
                api.get(`/motorcycles/by-client/${id}`),
                api.get(`/repairs/by-client/${id}`)
            ]);
            setClient(clientRes.data);
            setEditForm(clientRes.data);
            setMotorcycles(motosRes.data);
            setRepairs(repairsRes.data);
        } catch (error) {
            console.error("Error fetching client details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const res = await api.put(`/clients/${id}`, editForm);
            setClient(res.data);
            setIsEditing(false);
            alert('Cliente actualizado con éxito');
        } catch (error) {
            console.error("Error updating client:", error);
            alert("Error al actualizar los datos del cliente");
        }
    };

    if (loading) return <div className="px-10 py-20 text-center text-slate-400 uppercase font-black text-[10px] tracking-[0.2em] animate-pulse">Sincronizando ficha...</div>;
    if (!client) return (
        <div className="px-10 py-32 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
            <p className="text-slate-400 uppercase font-black text-[10px] tracking-widest max-w-xs mx-auto leading-relaxed">CLIENTE NO IDENTIFICADO</p>
        </div>
    );

    const getRepairStatusStyles = (status) => {
        switch (status) {
            case 'terminado': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'entregado': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        }
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Top Navigation */}
            {/* Top Navigation */}
            <div className="flex justify-between items-center">
                <Breadcrumbs
                    items={[
                        { label: 'Inicio', to: '/' },
                        { label: 'Clientes', to: '/clients' },
                        { label: client.name || 'Detalle', to: '#' }
                    ]}
                />

                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 hover:text-blue-500 transition-all shadow-sm"
                    >
                        <Edit2 size={14} /> Editar Datos
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 text-slate-500 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
                        >
                            <X size={14} /> Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-3 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                        >
                            <Save size={14} /> Guardar
                        </button>
                    </div>
                )}
            </div>

            {/* Client Header Card */}
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
                {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre y Apellidos</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold uppercase"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Teléfono de Contacto</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Correo Electrónico</label>
                                <input
                                    type="email"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                                    value={editForm.email || ''}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Dirección / Localidad</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                                    value={editForm.address || ''}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                        <div className="space-y-4">
                            <p className="text-blue-500 font-black uppercase tracking-[0.3em] text-[10px]">Expediente de Cliente</p>
                            <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">{client.name}</h1>
                            <div className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border inline-block italic mt-2",
                                client.status === 'activa'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50'
                                    : 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                {client.status === 'activa' ? 'CLIENTE ACTIVO' : 'CLIENTE DE BAJA'}
                            </div>
                            <div className="flex flex-wrap gap-8 pt-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contacto</p>
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{client.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{client.email || 'NO REGISTRADO'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Residencia</p>
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate max-w-[250px]">{client.address || 'PENDIENTE'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-slate-50 dark:bg-slate-950 px-8 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center min-w-[140px]">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Motos</p>
                                <p className="text-2xl font-black dark:text-white italic">{motorcycles.length}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Motorcycles Column */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] flex items-center gap-3 px-2">
                        <Bike size={18} /> FLOTA ASOCIADA ({motorcycles.length})
                    </h2>
                    <div className="space-y-4">
                        {motorcycles.length === 0 ? (
                            <div className="px-6 py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                SIN VEHÍCULOS
                            </div>
                        ) : (
                            motorcycles.map(moto => {
                                const getMotoStatusStyles = (status) => {
                                    switch (status) {
                                        case 'activa': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                                        case 'vendida': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
                                        case 'inactiva': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
                                        default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                                    }
                                };

                                return (
                                    <Link key={moto.id} to={`/motorcycles/${moto.id}`} className="group block bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 group-hover:text-blue-500 overflow-hidden p-2 transition-all shadow-sm">
                                                <img
                                                    src={`${api.defaults.baseURL}/logos/${moto.brand.toLowerCase().trim().replace(/\s+/g, '-')}.png`}
                                                    alt={moto.brand}
                                                    className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                                                    onError={(e) => {
                                                        const normalized = moto.brand.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                                                        if (!e.target.src.includes(normalized)) {
                                                            e.target.src = `${api.defaults.baseURL}/logos/${normalized}.png`;
                                                        } else {
                                                            e.target.style.display = 'none';
                                                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                                        }
                                                    }}
                                                />
                                                <Bike size={20} style={{ display: 'none' }} />
                                            </div>
                                            <span className={cn(
                                                "text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border",
                                                getMotoStatusStyles(moto.status || 'activa')
                                            )}>
                                                {moto.status || 'activa'}
                                            </span>
                                        </div>
                                        <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight italic group-hover:text-blue-600 transition-colors leading-tight">{moto.brand} {moto.model}</h3>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg tracking-widest">{moto.plate}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{moto.year}</span>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Repairs History Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Global History Header & Filters */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <Link
                                to={`/repairs?client_id=${client.id}`}
                                className="flex items-center gap-3 text-xs font-black text-slate-400 dark:text-slate-600 hover:text-blue-500 uppercase tracking-[0.2em] transition-colors group"
                            >
                                <Wrench size={18} /> HISTORIAL GLOBAL ({repairs.length})
                                <div className="text-[9px] text-slate-300 group-hover:text-blue-500 flex items-center">
                                    VER TODO <ChevronRight size={12} />
                                </div>
                            </Link>

                            <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                                {(() => {
                                    const gPending = repairs.filter(r => r.status === 'pendiente').length;
                                    const gUnpaid = repairs.filter(r => r.status === 'terminado').length;
                                    const gPaid = repairs.filter(r => r.status === 'entregado').length;

                                    return (
                                        <>
                                            {gPending > 0 && (
                                                <Link to={`/repairs?client_id=${client.id}&status=pendiente`} className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100 hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1">
                                                    <Wrench size={10} /> {gPending} Pendientes
                                                </Link>
                                            )}
                                            {gUnpaid > 0 && (
                                                <Link to={`/repairs?client_id=${client.id}&status=terminado`} className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1">
                                                    <DollarSign size={10} /> {gUnpaid} Sin Pagar
                                                </Link>
                                            )}
                                            {gPaid > 0 && (
                                                <Link to={`/repairs?client_id=${client.id}&status=entregado`} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1">
                                                    <CheckCircle size={10} /> {gPaid} Pagados
                                                </Link>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10">
                        {repairs.length === 0 ? (
                            <div className="px-6 py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-slate-400 font-black text-[10px] uppercase tracking-widest leading-relaxed">
                                NO HAY REGISTROS DE SERVICIOS ANTERIORES PARA ESTE CLIENTE.
                            </div>
                        ) : (
                            <>
                                {/* Group repairs by Motorcycle */}
                                {motorcycles.map(moto => {
                                    const motoRepairs = repairs
                                        .filter(r => r.motorcycle_id === moto.id)
                                        .sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));

                                    const pendingCount = motoRepairs.filter(r => r.status === 'pendiente').length;
                                    const unpaidCount = motoRepairs.filter(r => r.status === 'terminado').length;
                                    const paidCount = motoRepairs.filter(r => r.status === 'entregado').length;

                                    if (motoRepairs.length === 0) return null;

                                    return (
                                        <div key={moto.id} className="space-y-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                                                <div className="flex items-center gap-3 group">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all overflow-hidden p-1">
                                                        <img
                                                            src={`${api.defaults.baseURL}/logos/${moto.brand.toLowerCase().trim().replace(/\s+/g, '-')}.png`}
                                                            alt={moto.brand}
                                                            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                                                            onError={(e) => {
                                                                const normalized = moto.brand.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                                                                if (!e.target.src.includes(normalized)) {
                                                                    e.target.src = `${api.defaults.baseURL}/logos/${normalized}.png`;
                                                                } else {
                                                                    e.target.style.display = 'none';
                                                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                                                }
                                                            }}
                                                        />
                                                        <Bike size={16} style={{ display: 'none' }} />
                                                    </div>
                                                    <div>
                                                        <Link
                                                            to={`/repairs?client_id=${client.id}&motorcycle_id=${moto.id}`}
                                                            className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tighter italic group-hover:text-blue-500 transition-colors block"
                                                        >
                                                            {moto.brand} {moto.model} <span className="text-blue-500 text-sm ml-2 tracking-widest not-italic border border-blue-500/20 px-2 py-0.5 rounded-lg group-hover:text-blue-200 group-hover:border-blue-200/50">{moto.plate}</span>
                                                        </Link>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {pendingCount > 0 && (
                                                        <Link
                                                            to={`/repairs?client_id=${client.id}&motorcycle_id=${moto.id}&status=pendiente`}
                                                            className="text-[9px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-xl border border-amber-500/20 uppercase tracking-widest flex items-center gap-1 hover:bg-amber-500 hover:text-white transition-all"
                                                            title="Ver Pendientes"
                                                        >
                                                            <Wrench size={12} /> {pendingCount}
                                                        </Link>
                                                    )}
                                                    {unpaidCount > 0 && (
                                                        <Link
                                                            to={`/repairs?client_id=${client.id}&motorcycle_id=${moto.id}&status=terminado`}
                                                            className="text-[9px] font-black text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-xl border border-rose-500/20 uppercase tracking-widest flex items-center gap-1 hover:bg-rose-500 hover:text-white transition-all"
                                                            title="Ver Terminados (Sin Pagar)"
                                                        >
                                                            <DollarSign size={12} /> {unpaidCount}
                                                        </Link>
                                                    )}
                                                    {paidCount > 0 && (
                                                        <Link
                                                            to={`/repairs?client_id=${client.id}&motorcycle_id=${moto.id}&status=entregado`}
                                                            className="text-[9px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-xl border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1 hover:bg-emerald-500 hover:text-white transition-all"
                                                            title="Ver Entregados (Pagados)"
                                                        >
                                                            <CheckCircle size={12} /> {paidCount}
                                                        </Link>
                                                    )}

                                                    <Link
                                                        to={`/repairs?client_id=${client.id}&motorcycle_id=${moto.id}`}
                                                        className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-500 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ml-2"
                                                    >
                                                        <History size={12} /> ({motoRepairs.length})
                                                    </Link>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                                {motoRepairs.map((repair) => {
                                                    const statusStyles = {
                                                        pendiente: "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-500/50",
                                                        terminado: "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-500/50",
                                                        entregado: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30 hover:border-emerald-300 dark:hover:border-emerald-500/50"
                                                    };
                                                    const currentStyle = statusStyles[repair.status.toLowerCase()] || "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-500/20";

                                                    return (
                                                        <div
                                                            key={repair.id}
                                                            onClick={() => navigate(`/repairs/${repair.id}`)}
                                                            className={cn(
                                                                "group cursor-pointer p-5 rounded-[1.5rem] border transition-all flex flex-col justify-between h-full min-h-[140px]",
                                                                currentStyle
                                                            )}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1 opacity-70">
                                                                    <Calendar size={10} /> {new Date(repair.entry_date).toLocaleDateString()}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        window.open(`/invoice/${repair.id}`, '_blank');
                                                                    }}
                                                                    className="w-8 h-8 rounded-lg bg-white/60 dark:bg-black/20 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all"
                                                                    title="Ver Factura"
                                                                >
                                                                    <Printer size={14} />
                                                                </button>
                                                            </div>

                                                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight italic mb-4 line-clamp-3 leading-tight group-hover:text-blue-600 transition-colors">
                                                                {repair.description}
                                                            </h3>

                                                            <div className="flex justify-between items-end pt-3 border-t border-black/5 dark:border-white/5 mt-auto">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className={cn(
                                                                        "w-1.5 h-1.5 rounded-full",
                                                                        repair.paid ? 'bg-emerald-500' : 'bg-rose-500'
                                                                    )} />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                                        {repair.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-lg font-black text-slate-900 dark:text-white italic tabular-nums leading-none">
                                                                    €{repair.total_cost.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* General / Direct Sales Section (Repairs without moto or moto deleted) */}
                                {(() => {
                                    const otherRepairs = repairs
                                        .filter(r => !r.motorcycle_id || !motorcycles.find(m => m.id === r.motorcycle_id))
                                        .sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));

                                    if (otherRepairs.length === 0) return null;

                                    return (
                                        <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-900">
                                            <div className="flex items-center gap-3 px-2">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                    <DollarSign size={16} />
                                                </div>
                                                <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tighter italic">Ventas Directas / Otros</h3>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                {otherRepairs.map((repair) => (
                                                    <div
                                                        key={repair.id}
                                                        onClick={() => navigate(`/repairs/${repair.id}`)}
                                                        className="group cursor-pointer bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-amber-500/20 transition-all flex justify-between items-center gap-4"
                                                    >
                                                        <div>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">{new Date(repair.entry_date).toLocaleDateString()}</span>
                                                            <h4 className="font-bold text-slate-800 dark:text-white uppercase text-sm group-hover:text-amber-500 transition-colors">{repair.description}</h4>
                                                        </div>
                                                        <span className="text-lg font-black text-slate-900 dark:text-white italic">€{repair.total_cost.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })()}
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
