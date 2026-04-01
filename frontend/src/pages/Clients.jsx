/**
 * Componente: Clients (Clientes)
 * Descripción: Gestiona el listado completo de clientes del taller.
 * Permite crear nuevos clientes, buscar, filtrar y acceder a la ficha de cada uno.
 */
import React, { useState, useEffect } from 'react';
import { Plus, Search, UserX, Phone, Mail, MapPin, FolderOpen, UserCheck, Users, Eye } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { cn } from '../lib/utils';

export default function Clients() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [statusFilter, setStatusFilter] = useState('activas'); // activas, inactivas, todas

    // Form state
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/clients', formData);
            setShowForm(false);
            setFormData({ name: '', phone: '', email: '', address: '' });
            fetchClients();
        } catch (error) {
            console.error("Error creating client:", error);
        }
    };

    const handleDeactivate = async (e, id) => {
        e.stopPropagation(); // Evitar navegar al expediente
        if (!window.confirm("¿Estás seguro de dar de baja a este cliente? Se mantendrá en el historial pero no aparecerá en la lista activa.")) return;
        try {
            await api.delete(`/clients/${id}`);
            fetchClients();
        } catch (error) {
            console.error("Error deactivating client", error);
        }
    }

    const handleActivate = async (e, id) => {
        e.stopPropagation();
        try {
            await api.put(`/clients/${id}`, { status: 'activa' });
            fetchClients();
        } catch (error) {
            console.error("Error activating client", error);
        }
    }

    const filteredClients = clients.filter(client => {
        const matchesSearch =
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const status = client.status || 'activa';
        const matchesStatus =
            statusFilter === 'todas' ? true :
                statusFilter === 'activas' ? status === 'activa' :
                    status === 'inactiva';

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-10">
            <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Clientes', to: '/clients' }]} />
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">Clientes</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium uppercase tracking-widest text-xs">Base de Datos y Expedientes del Taller</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                    <Plus size={20} /> Registrar Nuevo Cliente
                </button>
            </div>

            {/* Status Filters */}
            <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl w-fit">
                {[
                    { id: 'activas', label: 'Clientes Activos', icon: UserCheck },
                    { id: 'inactivas', label: 'Bajas / Inactivos', icon: UserX },
                    { id: 'todas', label: 'Ver Todos', icon: Users }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id)}
                        className={cn(
                            "flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            statusFilter === tab.id
                                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm"
                                : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                        )}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic mb-8">Alta de Cliente</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2 block">Nombre Completo / Razón Social</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold uppercase"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="EJ: JUAN PÉREZ GARCÍA"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2 block">Teléfono Principal</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+34 000 000 000"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2 block">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="EJEMPLO@EMAIL.COM"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2 block">Dirección Postal / Notas de Envío</label>
                                    <textarea
                                        rows="3"
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold uppercase"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="CALLE, CIUDAD..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 justify-end mt-10">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                    Guardar Registro
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Search size={20} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Búsqueda rápida por nombre, teléfono o identificación..."
                    className="w-full pl-14 pr-8 py-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white dark:bg-slate-900 dark:text-white font-bold shadow-sm transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 font-black">
                        <tr className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
                            <th className="px-10 py-6">Razón Social / Identidad</th>
                            <th className="px-10 py-6">Estado</th>
                            <th className="px-10 py-6">Medios de Contacto</th>
                            <th className="px-10 py-6 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="4" className="px-10 py-24 text-center text-slate-400 uppercase font-black text-[10px] tracking-[0.2em] animate-pulse">Consultando el registro...</td></tr>
                        ) : filteredClients.length === 0 ? (
                            <tr><td colSpan="4" className="px-10 py-24 text-center text-slate-400 uppercase font-black text-[10px] tracking-[0.2em]">No hay clientes que coincidan con la búsqueda.</td></tr>
                        ) : (
                            filteredClients.map(client => (
                                <tr
                                    key={client.id}
                                    onClick={() => navigate(`/clients/${client.id}`)}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-all group cursor-pointer"
                                >
                                    <td className="px-10 py-8">
                                        <div className="font-black text-slate-900 dark:text-slate-200 uppercase tracking-tight italic text-xl leading-tight group-hover:text-blue-600 transition-colors">{client.name}</div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-600 flex items-center gap-2 mt-2 font-black uppercase tracking-[0.1em]">
                                            <MapPin size={12} className="text-slate-300 dark:text-slate-800" /> {client.address || "DIRECCIÓN NO REGISTRADA"}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className={cn(
                                            "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border inline-block italic",
                                            (client.status || 'activa') === 'activa'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50'
                                                : 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-800'
                                        )}>
                                            {(client.status || 'activa') === 'activa' ? 'ACTIVO' : 'BAJA'}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="text-sm text-slate-700 dark:text-slate-300 font-bold flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shadow-sm">
                                                <Phone size={14} />
                                            </div>
                                            {client.phone}
                                        </div>
                                        {client.email && (
                                            <div className="text-[11px] text-slate-500 dark:text-slate-500 font-medium flex items-center gap-3 mt-2">
                                                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 dark:text-slate-600 border border-slate-100 dark:border-slate-800/50 shadow-sm">
                                                    <Mail size={14} />
                                                </div>
                                                {client.email.toLowerCase()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}
                                                    className="p-3 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-sm"
                                                    title="Ver Expediente Completo"
                                                >
                                                    <FolderOpen size={18} />
                                                </button>
                                                {(client.status || 'activa') === 'activa' ? (
                                                    <button
                                                        onClick={(e) => handleDeactivate(e, client.id)}
                                                        className="p-3 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all"
                                                        title="Dar de Baja a Cliente"
                                                    >
                                                        <UserX size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => handleActivate(e, client.id)}
                                                        className="p-3 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-all"
                                                        title="Activar Cliente"
                                                    >
                                                        <UserCheck size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
