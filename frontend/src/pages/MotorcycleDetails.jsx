/**
 * Componente: MotorcycleDetails (Ficha de Motocicleta)
 * Descripción: Muestra los datos técnicos de una motocicleta, su propietario, 
 * estado actual, y el historial de reparaciones y mantenimientos realizados.
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Wrench, Calendar, DollarSign, CheckCircle, ArrowLeft, User, Bike,
    Printer, Info, Gauge, Hash, Palette, UserCheck, ChevronRight,
    Edit2, Save, Camera, FileText, Plus, Trash2, Image as ImageIcon,
    AlertCircle, X, ExternalLink, Download, UploadCloud,
    History, Settings, ShieldCheck, MapPin
} from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

export default function MotorcycleDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();

    // Core State
    const [moto, setMoto] = useState(null);
    const [client, setClient] = useState(null);
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [clients, setClients] = useState([]);
    const [history, setHistory] = useState([]);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        brand: '', model: '', plate: '', year: '', color: '',
        client_id: '', vin: '', current_km: 0, specifications: '', status: ''
    });

    useEffect(() => {
        fetchData();
        fetchClients();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log(`[API] Solicitando detalles para moto ID: ${id}`);
            const res = await api.get(`/motorcycles/${id}`);
            const data = res.data;

            if (data) {
                setMoto(data);
                setEditForm({
                    ...data,
                    year: data.year || '',
                    vin: data.vin || '',
                    current_km: data.current_km || 0,
                    specifications: data.specifications || '',
                    status: data.status || 'activa'
                });

                // Fetch secondary data
                fetchExtraData(data);
            }
        } catch (error) {
            console.error("Critical error fetching motorcycle details:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExtraData = (motoData) => {
        // Repairs
        api.get(`/repairs/by-motorcycle/${id}`)
            .then(r => setRepairs(r.data))
            .catch(e => console.error("Error repairs:", e));

        // History
        api.get(`/motorcycles/${id}/history`)
            .then(r => setHistory(r.data))
            .catch(e => console.error("Error history:", e));

        // Client info
        if (motoData.client_id) {
            api.get('/clients')
                .then(r => {
                    const found = r.data.find(c => c.id === motoData.client_id);
                    setClient(found);
                })
                .catch(e => console.error("Error client:", e));
        }
    };

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } catch (error) {
            console.error("Error clients:", error);
        }
    };

    const handleSave = async () => {
        try {
            const res = await api.put(`/motorcycles/${id}`, editForm);
            setMoto(res.data);
            setIsEditing(false);

            // Re-fetch to ensure everything is in sync
            fetchData();
            alert('Vehículo actualizado correctamente');
        } catch (error) {
            console.error("Error updating:", error);
            alert("Error al actualizar la motocicleta");
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post(`/motorcycles/${id}/upload-photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMoto(res.data);
        } catch (e) { alert("Error al subir foto"); }
    };

    const handleDocumentUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post(`/motorcycles/${id}/upload-document`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMoto(res.data);
        } catch (e) { alert("Error al subir documento"); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-black uppercase text-xs tracking-[0.3em] animate-pulse">Sincronizando Sistema...</p>
        </div>
    );

    if (!moto) return (
        <div className="max-w-xl mx-auto my-20 p-12 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl text-center space-y-8">
            <div className="w-24 h-24 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={48} className="text-rose-500" />
            </div>
            <div className="space-y-4">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic">Vehículo no localizado</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No se ha encontrado ninguna ficha técnica vinculada al ID: <span className="text-blue-500 font-black">#{id}</span></p>
            </div>
            <Link to="/motorcycles" className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                <ArrowLeft size={18} /> Volver al Garaje
            </Link>
        </div>
    );

    const getStatusStyles = (status) => {
        switch (status) {
            case 'activa': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'vendida': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'inactiva': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 pb-20">
            {/* TOP BAR / NAVIGATION */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-6 w-full">
                <div className="flex flex-col items-center md:items-start w-full">
                    <div className="flex items-center gap-4 justify-center md:justify-start w-full">
                        <Link to="/motorcycles" className="hidden sm:flex w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all active:scale-95 shadow-sm">
                            <ArrowLeft size={18} />
                        </Link>
                        <div className="flex items-center gap-2 sm:gap-3 text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest flex-wrap justify-center md:justify-start">
                            <Link to="/" className="hover:text-blue-500">Inicio</Link>
                            <span>/</span>
                            <Link to="/motorcycles" className="hover:text-blue-500">Motos</Link>
                            <span>/</span>
                            <span className="text-blue-500 truncate max-w-[150px]">{isEditing ? 'Nueva' : moto.brand}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center md:items-start gap-4 mt-6 text-center md:text-left w-full">
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-tight break-words max-w-full">
                            {isEditing ? 'Configurar Vehículo' : (
                                <>
                                    {moto.brand} <span className="text-blue-600 font-black">{moto.model}</span>
                                </>
                            )}
                        </h1>
                        <span className={cn(
                            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
                            moto.status === 'activa' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20'
                        )}>
                            {moto.status || 'activa'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-center md:justify-end gap-3 w-full sm:w-auto mt-6 md:mt-0 flex-wrap">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 sm:flex-none px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                <Save size={18} /> Guardar
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => window.print()}
                                className="w-12 h-12 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                            >
                                <Printer size={20} />
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all whitespace-nowrap"
                            >
                                <Edit2 size={18} /> Editar Unidad
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-10">
                {/* FILA SUPERIOR: INFO TÉCNICA (2/3) Y GESTIÓN (1/3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* LEFT COLUMN - MAIN INFO */}
                    <div className="lg:col-span-2 min-w-0">
                        <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-8 relative overflow-hidden h-full">
                            <div className="flex items-center gap-4 text-blue-600 dark:text-blue-500 mb-2">
                                <Info size={24} strokeWidth={2.5} />
                                <h2 className="text-xl font-black uppercase tracking-tight italic">Información del Vehículo</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <Field
                                    label="Marca"
                                    value={isEditing ? editForm.brand : moto.brand}
                                    icon={Bike}
                                    isEditing={isEditing}
                                    onChange={v => setEditForm({ ...editForm, brand: v })}
                                    placeholder="EJ: YAMAHA"
                                />
                                <Field
                                    label="Modelo"
                                    value={isEditing ? editForm.model : moto.model}
                                    icon={Settings}
                                    isEditing={isEditing}
                                    onChange={v => setEditForm({ ...editForm, model: v })}
                                    placeholder="EJ: MT-07 ABS"
                                />
                                <Field
                                    label="Año"
                                    value={isEditing ? editForm.year : moto.year}
                                    icon={Calendar}
                                    isEditing={isEditing}
                                    onChange={v => setEditForm({ ...editForm, year: v })}
                                    placeholder="EJ: 2023"
                                    type="number"
                                />
                                <Field
                                    label="Matrícula"
                                    value={isEditing ? editForm.plate : moto.plate}
                                    icon={Hash}
                                    isEditing={isEditing}
                                    className="font-black tracking-widest"
                                    onChange={v => setEditForm({ ...editForm, plate: v })}
                                    placeholder="ABC-123"
                                />
                                <Field
                                    label="Kilometraje Actual"
                                    value={isEditing ? editForm.current_km : moto.current_km}
                                    icon={Gauge}
                                    isEditing={isEditing}
                                    onChange={v => setEditForm({ ...editForm, current_km: v })}
                                    placeholder="0"
                                    type="number"
                                    suffix="KM"
                                />
                                <Field
                                    label="Color"
                                    value={isEditing ? editForm.color : moto.color}
                                    icon={Palette}
                                    isEditing={isEditing}
                                    onChange={v => setEditForm({ ...editForm, color: v })}
                                    placeholder="EJ: AZUL ELÉCTRICO"
                                />
                            </div>

                            <div className="pt-4">
                                <Field
                                    label="Número de Serie (VIN)"
                                    value={isEditing ? editForm.vin : moto.vin}
                                    icon={ShieldCheck}
                                    isEditing={isEditing}
                                    className="font-mono text-[9px] uppercase tracking-widest"
                                    onChange={v => setEditForm({ ...editForm, vin: v })}
                                    placeholder="17 CARACTERES"
                                />
                            </div>

                            {/* SECTION: SPECIFICATIONS / NOTES (Key-Value Editor) */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notas Técnicas / Mantenimiento</label>
                                    {isEditing && (
                                        <button
                                            onClick={() => {
                                                const currentSpecs = parseSpecs(editForm.specifications);
                                                const newSpecs = [...currentSpecs, { key: "", value: "" }];
                                                setEditForm({ ...editForm, specifications: JSON.stringify(newSpecs) });
                                            }}
                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <Plus size={12} /> Añadir Línea
                                        </button>
                                    )}
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 min-h-[150px] space-y-4">
                                    {parseSpecs(isEditing ? editForm.specifications : moto.specifications).length === 0 ? (
                                        <p className="text-slate-300 dark:text-slate-700 italic text-sm text-center py-4">Sin especificaciones registradas.</p>
                                    ) : (
                                        parseSpecs(isEditing ? editForm.specifications : moto.specifications).map((item, idx) => (
                                            <div key={idx} className="flex flex-col md:flex-row items-start gap-4 group">
                                                {isEditing ? (
                                                    <>
                                                        <div className="w-full md:w-1/3">
                                                            <input
                                                                type="text"
                                                                placeholder="Concepto"
                                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-500 focus:border-blue-500 outline-none transition-all"
                                                                value={item.key}
                                                                onChange={(e) => {
                                                                    const newSpecs = parseSpecs(editForm.specifications);
                                                                    newSpecs[idx].key = e.target.value;
                                                                    setEditForm({ ...editForm, specifications: JSON.stringify(newSpecs) });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex-1 w-full">
                                                            <input
                                                                type="text"
                                                                placeholder="Valor / Referencia"
                                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:border-blue-500 outline-none transition-all"
                                                                value={item.value}
                                                                onChange={(e) => {
                                                                    const newSpecs = parseSpecs(editForm.specifications);
                                                                    newSpecs[idx].value = e.target.value;
                                                                    setEditForm({ ...editForm, specifications: JSON.stringify(newSpecs) });
                                                                }}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newSpecs = parseSpecs(editForm.specifications);
                                                                newSpecs.splice(idx, 1);
                                                                setEditForm({ ...editForm, specifications: JSON.stringify(newSpecs) });
                                                            }}
                                                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-full md:w-1/3 pt-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block break-words">{item.key || 'Nota'}</span>
                                                        </div>
                                                        <div className="flex-1 w-full border-l-2 border-slate-200 dark:border-slate-800 pl-4 py-1">
                                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-all">{item.value}</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 sm:space-y-10 min-w-0">
                        {/* OWNER */}
                        <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 sm:space-y-8">
                            <div className="flex items-center gap-4 text-emerald-600 dark:text-emerald-500 mb-2 justify-center sm:justify-start">
                                <UserCheck size={24} strokeWidth={2.5} className="sm:scale-110" />
                                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight italic">Propietario</h2>
                            </div>

                            {isEditing ? (
                                <div className="space-y-6">
                                    <div className="relative">
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 font-bold text-slate-800 dark:text-white appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm"
                                            value={editForm.client_id}
                                            onChange={e => setEditForm({ ...editForm, client_id: Number(e.target.value) })}
                                        >
                                            <option value="">Seleccionar cliente...</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                                        </select>
                                        <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
                                    </div>
                                    <Link
                                        to="/clients"
                                        className="flex items-center justify-center gap-3 w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-500/50 transition-all font-bold text-xs"
                                    >
                                        <Plus size={16} /> Registrar Cliente
                                    </Link>
                                </div>
                            ) : (
                                client ? (
                                    <Link to={`/clients/${client.id}`} className="flex flex-col items-center gap-4 p-6 sm:p-8 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-950 transition-all group border-2 border-transparent hover:border-slate-100 dark:hover:border-slate-800 text-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight size={16} className="text-blue-500" />
                                        </div>
                                        <h4 className="text-sm sm:text-lg font-black text-slate-800 dark:text-white uppercase italic group-hover:text-blue-500 transition-colors">{client.name}</h4>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-sm mb-1 group-hover:scale-110 transition-transform">
                                                <User size={24} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                                    {client.phone}
                                                </p>
                                                {client.email && (
                                                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium lowercase tracking-tight break-all">
                                                        {client.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="p-8 text-center space-y-4 opacity-50">
                                        <AlertCircle size={24} className="mx-auto text-slate-300" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-full">Sin propietario</p>
                                    </div>
                                )
                            )}
                        </div>

                        {/* STATUS */}
                        <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 sm:space-y-8">
                            <div className="flex items-center gap-4 text-blue-600 dark:text-blue-500 mb-2 justify-center sm:justify-start">
                                <History size={24} strokeWidth={2.5} className="sm:scale-110" />
                                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight italic">Estado Actual</h2>
                            </div>

                            <div className="space-y-3">
                                {['activa', 'vendida', 'inactiva'].map(st => (
                                    <button
                                        key={st}
                                        disabled={!isEditing}
                                        onClick={() => setEditForm({ ...editForm, status: st })}
                                        className={cn(
                                            "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                            (isEditing ? editForm.status : moto.status) === st
                                                ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                                                : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-500",
                                            !isEditing && (moto.status === st ? "" : "opacity-40 grayscale")
                                        )}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full flex-shrink-0",
                                                st === 'activa' ? 'bg-emerald-400' : st === 'vendida' ? 'bg-blue-400' : 'bg-rose-400'
                                            )} />
                                            <span className="font-black uppercase text-[9px] tracking-widest truncate">
                                                {st === 'activa' ? 'En Servicio' : st === 'vendida' ? 'Vendida' : 'Baja'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BLOQUES INFERIORES: A TODO ANCHO */}
                
                {/* 1. DOCUMENTATION */}
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 sm:space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-blue-600 dark:text-blue-500 justify-center sm:justify-start">
                            <FileText size={24} strokeWidth={2.5} className="sm:scale-110" />
                            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight italic">Documentación</h2>
                        </div>
                        <label className="flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-500/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-sm border border-blue-100 dark:border-blue-500/20 group">
                            <Plus size={16} className="group-hover:rotate-90 transition-transform" /> 
                            <span>Adjuntar Fichero</span>
                            <input type="file" className="hidden" onChange={handleDocumentUpload} />
                        </label>
                    </div>

                    <div className="space-y-4">
                        {(() => {
                            const docList = JSON.parse(moto.documents || '[]');
                            if (docList.length === 0) return (
                                <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] opacity-30 text-[10px] font-black uppercase tracking-widest">
                                    No hay documentos adjuntos
                                </div>
                            );
                            
                            return docList.map((doc, i) => {
                                const docUrl = typeof doc === 'string' ? doc : doc.url;
                                const fullUrl = `${api.defaults.baseURL}${docUrl}`;
                                const docName = typeof doc === 'string' ? doc.split('/').pop() : doc.name;

                                return (
                                    <div key={i} className="flex items-center gap-4 group/doc w-full">
                                        <a
                                            href={fullUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 min-w-0 flex items-center gap-6 p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-transparent hover:border-blue-500/30 transition-all"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                                                <FileText size={24} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase italic tracking-tight break-all" title={docName}>{docName}</p>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Descargar Fichero Completo</p>
                                            </div>
                                        </a>
                                        <button
                                            onClick={async () => {
                                                if (!confirm(`¿Borrar "${docName}"?`)) return;
                                                const newDocs = docList.filter((_, idx) => idx !== i);
                                                try {
                                                    const res = await api.put(`/motorcycles/${moto.id}`, {
                                                        ...editForm,
                                                        documents: JSON.stringify(newDocs)
                                                    });
                                                    setMoto(res.data);
                                                } catch (e) { alert("Error al borrar"); }
                                            }}
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover/doc:opacity-100 flex-shrink-0"
                                        >
                                            <Trash2 size={24} />
                                        </button>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* 2. PHOTO GALLERY */}
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 text-blue-600 dark:text-blue-500">
                            <ImageIcon size={24} strokeWidth={2.5} />
                            <h2 className="text-xl font-black uppercase tracking-tight italic">Galería de Fotos</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                        <label className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all cursor-pointer group">
                            <UploadCloud size={32} className="group-hover:-translate-y-1 transition-transform" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Subir</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        </label>

                        {(() => {
                            const photos = JSON.parse(moto.photos || '[]');
                            return photos.map((photoPath, i) => {
                                const src = typeof photoPath === 'string'
                                    ? `${api.defaults.baseURL}${photoPath}`
                                    : photoPath.url;

                                return (
                                    <div key={i} className="aspect-square rounded-[2rem] bg-slate-100 dark:bg-slate-950 relative group overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <img
                                            src={src}
                                            alt={`Moto ${i}`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error" }}
                                        />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <a href={src} target="_blank" rel="noopener noreferrer" className="p-2 bg-white text-slate-900 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg">
                                                <ExternalLink size={16} />
                                            </a>
                                            <button
                                                onClick={async () => {
                                                    if (!confirm("¿Borrar esta foto?")) return;
                                                    const newPhotos = photos.filter((_, idx) => idx !== i);
                                                    try {
                                                        const res = await api.put(`/motorcycles/${moto.id}`, {
                                                            ...editForm,
                                                            photos: JSON.stringify(newPhotos)
                                                        });
                                                        setMoto(res.data);
                                                    } catch (e) { alert("Error al borrar la foto"); }
                                                }}
                                                className="p-2 bg-white text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* 3. REPAIR SUMMARY */}
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-blue-600 dark:text-blue-500">
                            <History size={24} strokeWidth={2.5} />
                            <h2 className="text-xl font-black uppercase tracking-tight italic">Historial de Mantenimientos</h2>
                        </div>
                        <Link to={`/repairs?motorcycle_id=${moto.id}`} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">Ver Historial Completo</Link>
                    </div>

                    <div className="flex flex-col gap-3 sm:gap-4">
                        {repairs.length > 0 ? repairs.sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date)).slice(0, 3).map((repair) => {
                            const statusStyles = {
                                pendiente: "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-500/50",
                                terminado: "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-500/50",
                                entregado: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30 hover:border-emerald-300 dark:hover:border-emerald-500/50"
                            };
                            const defaultStyle = "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-500/50";
                            const currentStyle = statusStyles[repair.status?.toLowerCase()] || defaultStyle;

                            return (
                                <Link
                                    key={repair.id}
                                    to={`/repairs/${repair.id}`}
                                    className={cn(
                                        "group p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-sm border transition-all flex flex-col md:flex-row gap-4 items-center",
                                        currentStyle
                                    )}
                                >
                                    <div className="flex-1 w-full text-left min-w-0 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1 opacity-70">
                                                <Calendar size={10} /> {new Date(repair.entry_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase italic mb-3 break-words leading-tight">
                                            {repair.description}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest border border-black/10 dark:border-white/10 px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5">
                                                {repair.status}
                                            </span>
                                            <span className={cn(
                                                "text-[9px] sm:text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-lg flex items-center gap-1",
                                                repair.paid 
                                                    ? "bg-emerald-100/50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" 
                                                    : "bg-rose-100/50 text-rose-700 border-rose-200/50 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30"
                                            )}>
                                                {repair.paid ? 'PAGADO' : 'SIN PAGAR'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-black/5 dark:border-white/5 shrink-0 gap-4">
                                        <div className="text-left md:text-right">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">Costo</p>
                                            <p className="text-sm sm:text-lg font-black text-slate-900 dark:text-white italic tabular-nums leading-none">
                                                €{repair.total_cost?.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 rounded-xl bg-white/50 dark:bg-black/20 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </Link>
                            );
                        }) : (
                            <div className="w-full p-10 text-center text-slate-400 uppercase font-black text-[10px] tracking-widest opacity-40 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                                Sin servicios registrados.
                            </div>
                        )}
                        
                        {repairs.length > 3 && (
                            <Link 
                                to={`/repairs?motorcycle_id=${moto.id}`} 
                                className="mt-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-3 rounded-2xl transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-800/30"
                            >
                                Ver historial completo ({repairs.length} órdenes)
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}



// Helper to safely parse specifications (supports JSON or plain text legacy)
function parseSpecs(specsString) {
    if (!specsString) return [];
    try {
        const parsed = JSON.parse(specsString);
        if (Array.isArray(parsed)) return parsed;
        return [{ key: "Notas Generales", value: specsString }];
    } catch (e) {
        // Fallback for old plain text data
        return [{ key: "Notas Generales", value: specsString }];
    }
}

function Field({ label, value, icon: Icon, isEditing, onChange, placeholder, type = "text", suffix, className }) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Icon size={12} className="opacity-50" /> {label}
            </label>
            {isEditing ? (
                <div className="relative group">
                    <input
                        type={type}
                        className={cn(
                            "w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all",
                            className
                        )}
                        value={value}
                        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                        placeholder={placeholder}
                    />
                    {suffix && <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">{suffix}</span>}
                </div>
            ) : (
                <div className="flex items-baseline gap-2">
                    <p className={cn("text-lg font-black text-slate-800 dark:text-white italic uppercase truncate", className)} title={value}>
                        {value || '---'}
                    </p>
                    {suffix && value && <span className="text-[10px] font-black text-slate-400">{suffix}</span>}
                </div>
            )}
        </div>
    );
}
