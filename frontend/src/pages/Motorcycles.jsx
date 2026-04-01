/**
 * Componente: Motorcycles (Motocicletas / Garaje)
 * Descripción: Listado del parque móvil o motocicletas registradas en el sistema.
 * Permite buscar por matrícula, modelo y ver el estado de cada vehículo.
 */
import React, { useState, useEffect } from 'react';
import { Plus, Bike, User, Trash2, Search, ChevronRight, X, Calendar, Hash, Palette } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Motorcycles() {
    const [motorcycles, setMotorcycles] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const { theme } = useTheme();

    // Form state
    const [formData, setFormData] = useState({
        brand: '', model: '', plate: '', year: new Date().getFullYear(), color: '', client_id: '', vin: '', current_km: 0
    });
    const [searchTerm, setSearchTerm] = useState('');

    const [statusFilter, setStatusFilter] = useState('todos');

    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setError(null);
        try {
            const [motosRes, clientsRes] = await Promise.all([
                api.get('/motorcycles'),
                api.get('/clients')
            ]);
            setMotorcycles(motosRes.data);
            setClients(clientsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error.message || "Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/motorcycles', formData);
            setShowForm(false);
            setFormData({ brand: '', model: '', plate: '', year: new Date().getFullYear(), color: '', client_id: '', vin: '', current_km: 0 });
            fetchData();
        } catch (error) {
            console.error("Error creating motorcycle:", error);
            alert("Error al crear moto. Verifica que la matrícula no esté duplicada.");
        }
    };

    const filteredMotorcycles = motorcycles.filter(moto => {
        const client = clients.find(c => c.id === moto.client_id);
        const searchStr = `${moto.brand} ${moto.model} ${moto.plate} ${client ? client.name : ''}`.toLowerCase();
        const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'todos' || (moto.status || 'activa') === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'activa': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'vendida': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'inactiva': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        }
    };

    return (
        <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8 overflow-hidden">
                <div className="space-y-3 sm:space-y-4 min-w-0 flex-1">
                    <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Garaje', to: '/motorcycles' }]} />
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none truncate">Inventario</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-widest text-[9px] sm:text-xs">Gestión del parque móvil registrado</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all shrink-0"
                >
                    <Plus size={20} /> Registrar Vehículo
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                <div className="relative group flex-1">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar matrícula, marca, modelo..."
                        className="w-full pl-12 pr-6 py-4 rounded-xl sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white dark:bg-slate-900 dark:text-white font-bold shadow-sm transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 md:flex md:flex-row bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm gap-2 shrink-0">
                    {[
                        { id: 'todos', label: 'Todos' },
                        { id: 'activa', label: 'Activas' },
                        { id: 'vendida', label: 'Vendidas' },
                        { id: 'inactiva', label: 'Inactivas' }
                    ].map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setStatusFilter(filter.id)}
                            className={cn(
                                "w-full md:w-auto px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                                statusFilter === filter.id
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            )}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                {error ? (
                    <div className="col-span-full py-10 sm:py-20 text-center bg-red-50 dark:bg-red-900/10 rounded-2xl sm:rounded-[2.5rem] border border-red-100 dark:border-red-900/50 p-6 sm:p-10">
                        <div className="text-red-500 font-black uppercase text-lg sm:text-xl mb-3 sm:mb-4">Error de Conexión</div>
                        <p className="text-red-400 mb-6 text-sm">{error}</p>
                        <button onClick={fetchData} className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold uppercase text-xs">Reintentar</button>
                    </div>
                ) : loading ? (
                    <div className="col-span-full py-20 text-center text-slate-400 uppercase font-black text-[10px] tracking-[0.2em] animate-pulse">Sincronizando garaje...</div>
                ) : filteredMotorcycles.length === 0 ? (
                    <div className="col-span-full py-16 sm:py-32 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-[3rem] p-6">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bike size={24} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 uppercase font-black text-[10px] tracking-widest max-w-xs mx-auto leading-relaxed">
                            {searchTerm || statusFilter !== 'todos' ? `No hay resultados para los filtros seleccionados.` : "No hay vehículos registrados."}
                        </p>
                    </div>
                ) : (
                    filteredMotorcycles.map(moto => {
                        const clientName = clients.find(c => c.id === moto.client_id)?.name || "Desconocido";

                        return (
                            <Link
                                key={moto.id}
                                to={`/motorcycles/${moto.id}`}
                                className="group bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-all overflow-hidden p-2">
                                        <img
                                            src={`${api.defaults.baseURL}/logos/${moto.brand.toLowerCase().trim().replace(/\s+/g, '-')}.png`}
                                            alt={moto.brand}
                                            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                                            onError={(e) => {
                                                const normalized = moto.brand.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                                                if (!e.target.src.includes(normalized)) {
                                                    e.target.src = `${api.defaults.baseURL}/logos/${normalized}.png`;
                                                } else {
                                                    e.target.onerror = null;
                                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='18.5' cy='17.5' r='3.5'/%3E%3Ccircle cx='5.5' cy='17.5' r='3.5'/%3E%3Ccircle cx='15' cy='5' r='1'/%3E%3Cpath d='M12 17.5V14l-3-3 4-3 2 3h2'/%3E%3C/svg%3E";
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-[10px] font-black px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg uppercase tracking-widest">
                                            {moto.plate}
                                        </span>
                                        <span className={cn(
                                            "text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.2em] border",
                                            getStatusStyles(moto.status || 'activa')
                                        )}>
                                            {moto.status || 'activa'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic group-hover:text-blue-600 transition-colors leading-tight">
                                        {moto.brand}
                                        <br />
                                        <span className="text-slate-400 dark:text-slate-600">{moto.model}</span>
                                    </h3>
                                    <div className="flex gap-4 mt-4">
                                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <Calendar size={14} className="opacity-40" /> {moto.year}
                                        </div>
                                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <Palette size={14} className="opacity-40" /> {moto.color}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                            <User size={14} className="text-slate-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                            {clientName}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                )}
            </div>

            {/* Modal de Registro */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all">
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Registrar Nuevo Vehículo</h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5 block text-left">Propietario / Cliente</label>
                                    <select
                                        required
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold appearance-none uppercase"
                                        value={formData.client_id}
                                        onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                                    >
                                        <option value="">SELECCIONAR PROPIETARIO...</option>
                                        {clients
                                            .filter(c => c.status !== 'inactiva' && c.name.trim().toUpperCase() !== 'PÚBLICO GENERAL')
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5 block text-left">Matrícula</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="EJ: 1234ABC"
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-black uppercase tracking-widest"
                                        value={formData.plate}
                                        onChange={e => setFormData({ ...formData, plate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5 block text-left">Marca / Fabricante</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="EJ: YAMAHA"
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold uppercase"
                                        value={formData.brand}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5 block text-left">Modelo</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="EJ: MT-07 ABS"
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold uppercase"
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5 block text-left">Año de Fabricación</label>
                                    <input
                                        type="number"
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-black"
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5 block text-left">Color predominante</label>
                                    <input
                                        type="text"
                                        placeholder="EJ: NEGRO MATE"
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold uppercase"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5 block text-left">Número de Bastidor (VIN)</label>
                                    <input
                                        type="text"
                                        placeholder="EJ: JH2SC..."
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-mono uppercase tracking-wider"
                                        value={formData.vin}
                                        onChange={e => setFormData({ ...formData, vin: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5 block text-left">Kilometraje de Entrada</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                            <Hash size={16} className="text-slate-400 opacity-50" />
                                        </div>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-black italic"
                                            value={formData.current_km}
                                            onChange={e => setFormData({ ...formData, current_km: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
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
                                    Guardar Vehículo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
