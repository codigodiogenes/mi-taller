/**
 * Componente: RepairDetails (Detalle de Reparación)
 * Descripción: La vista más importante para los mecánicos. Aquí se detalla 
 * el trabajo a realizar en una moto, se añaden piezas/recambios del stock, 
 * se registra la mano de obra, y se calculan los costes totales.
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle, DollarSign, Printer, Save, Wrench, Edit2, X, Check, Package, Bike, Mail } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

export default function RepairDetails() {
    const { id } = useParams();
    const [repair, setRepair] = useState(null);
    const [newItem, setNewItem] = useState({ description: '', cost: '', quantity: 1 });
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState(null); // { id, description, cost, quantity }
    const [sendingEmail, setSendingEmail] = useState(false);
    const [addingItem, setAddingItem] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null); // ID del ítem a borrar (para el modal nuevo)
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailConfig, setEmailConfig] = useState({
        manualEmail: '',
        useClient: true,
        useManual: false
    });
    const navigate = useNavigate();

    // Metadata Edit States
    const [isEditingMetadata, setIsEditingMetadata] = useState(false);
    const [metadataForm, setMetadataForm] = useState({ description: '', entry_km: '', motorcycle_id: '' });
    const [motorcycles, setMotorcycles] = useState([]);
    const [clients, setClients] = useState([]);

    const { theme } = useTheme();
    // Stock Integration States
    const [stockItems, setStockItems] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedStockItem, setSelectedStockItem] = useState(null);
    const [decrementStock, setDecrementStock] = useState(false);

    // WhatsApp Preference States
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [pendingWhatsApp, setPendingWhatsApp] = useState(null); // { phone, message }

    useEffect(() => {
        fetchData();
        fetchStock();
    }, [id]);

    const fetchData = async () => {
        try {
            // Cada vez que refrescamos datos, nos aseguramos de que no haya bloqueos "fantasma"
            setAddingItem(false);
            
            const [repairRes, motosRes, clientsRes] = await Promise.all([
                api.get(`/repairs/${id}`),
                api.get('/motorcycles'),
                api.get('/clients')
            ]);
            setRepair(repairRes.data);
            setMetadataForm({
                description: repairRes.data.description,
                entry_km: repairRes.data.entry_km || '',
                motorcycle_id: repairRes.data.motorcycle_id || '',
                client_id: repairRes.data.client_id || ''
            });

            // Sync email config default when repair changes
            const clientEmail = repairRes.data?.client?.email || repairRes.data?.motorcycle?.owner?.email;
            setEmailConfig(prev => ({
                ...prev,
                useClient: !!clientEmail
            }));

            setMotorcycles(motosRes.data);
            setClients(clientsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMetadata = async () => {
        try {
            await api.put(`/repairs/${id}`, {
                description: metadataForm.description,
                entry_km: metadataForm.entry_km ? parseInt(metadataForm.entry_km) : null,
                motorcycle_id: metadataForm.motorcycle_id ? parseInt(metadataForm.motorcycle_id) : null,
                client_id: metadataForm.client_id ? parseInt(metadataForm.client_id) : null
            });
            setIsEditingMetadata(false);
            fetchData();
        } catch (error) {
            console.error("Error updating metadata:", error);
            alert("Error al actualizar la información");
        }
    };

    const fetchStock = async () => {
        try {
            const res = await api.get('/stock');
            setStockItems(res.data);
        } catch (error) {
            console.error("Error fetching stock:", error);
        }
    };

    const handleDescriptionChange = (e) => {
        const val = e.target.value;
        setNewItem({ ...newItem, description: val });

        if (val.trim().length > 1) {
            const filtered = stockItems.filter(item =>
                item.name.toLowerCase().includes(val.toLowerCase())
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }

        // If we change text, we reset the selected stock item
        if (selectedStockItem && val !== selectedStockItem.name) {
            setSelectedStockItem(null);
            setDecrementStock(false);
        }
    };

    const selectStockItem = (item) => {
        setNewItem({ ...newItem, description: item.name, quantity: 1 });
        setSelectedStockItem(item);
        setDecrementStock(true); // Default to true if selected from stock
        setSuggestions([]);
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        const costValue = parseFloat(newItem.cost);
        const qtyValue = parseInt(newItem.quantity) || 1;
        if (isNaN(costValue)) {
            alert("Por favor, introduce un coste válido.");
            return;
        }

        if (addingItem) return; // Prevent multiple submissions
        setAddingItem(true); // Set addingItem true when starting to add an item
        try {
            console.log("Adding Item Payload:", {
                description: newItem.description,
                cost: costValue,
                quantity: qtyValue,
                stock_item_id: selectedStockItem ? selectedStockItem.id : null,
                decrement_stock: decrementStock
            });
            await api.post(`/repairs/${id}/items`, {
                description: newItem.description,
                cost: costValue,
                quantity: qtyValue,
                stock_item_id: selectedStockItem ? selectedStockItem.id : null,
                decrement_stock: decrementStock
            });
            setNewItem({ description: '', cost: '', quantity: 1 });
            setSelectedStockItem(null);
            setDecrementStock(false);
            fetchData();
            fetchStock(); // Refresh stock units
        } catch (error) {
            console.error("Error adding item:", error);
            alert("Error al añadir ítem: " + (error.response?.data?.detail || error.message));
        } finally {
            setAddingItem(false); // Set addingItem false after item addition attempt
        }
    };

    const handleDeleteItem = async (itemId) => {
        // En lugar de confirm(), usamos un estado para mostrar el modal de React
        setDeletingItem(itemId);
    };

    const confirmDeleteItem = async () => {
        if (!deletingItem) return;
        try {
            await api.delete(`/repairs/${id}/items/${deletingItem}`);
            setDeletingItem(null);
            fetchData();
            fetchStock();
        } catch (error) {
            console.error("Error deleting item:", error);
            setDeletingItem(null);
            alert("Error al eliminar ítem");
        }
    };

    const startEditing = (item) => {
        setEditingItem({ ...item });
    };

    const cancelEditing = () => {
        setEditingItem(null);
    };

    const handleUpdateItem = async () => {
        if (!editingItem) return;
        const costValue = parseFloat(editingItem.cost);
        const qtyValue = parseInt(editingItem.quantity) || 1;
        if (isNaN(costValue)) {
            alert("Coste inválido");
            return;
        }

        try {
            await api.put(`/repairs/${id}/items/${editingItem.id}`, {
                description: editingItem.description,
                cost: costValue,
                quantity: qtyValue
            });
            setEditingItem(null);
            fetchData();
            fetchStock(); // Refresh stock after edit
        } catch (error) {
            console.error("Error updating item:", error);
            alert("Error al actualizar ítem");
        }
    };

    const updateStatus = async (newStatus, paidStatus = null) => {
        if (!window.confirm(`¿Cambiar estado a ${newStatus}?`)) return;
        try {
            const payload = { status: newStatus };
            if (paidStatus !== null) payload.paid = paidStatus;

            await api.put(`/repairs/${id}`, payload);
            fetchData();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleSendEmail = () => {
        setShowEmailModal(true);
    };

    const confirmSendEmail = async () => {
        const recipients = [];
        const clientEmail = repair?.client?.email || repair?.motorcycle?.owner?.email;

        if (emailConfig.useClient && clientEmail) recipients.push(clientEmail);
        if (emailConfig.useManual && emailConfig.manualEmail) recipients.push(emailConfig.manualEmail);

        if (recipients.length === 0) {
            alert("Selecciona al menos un destinatario válido.");
            return;
        }

        setSendingEmail(true);
        try {
            const res = await api.post(`/repairs/${id}/send-invoice`, { emails: recipients });
            alert(res.data.message);
            setShowEmailModal(false);
        } catch (error) {
            console.error("Error sending email:", error);
            alert("Error al enviar email: " + (error.response?.data?.detail || error.message));
        } finally {
            setSendingEmail(false);
        }
    };

    const handleWhatsApp = () => {
        const client = repair?.client || repair?.motorcycle?.owner;
        const phone = client?.phone;

        if (!phone) {
            alert("Este cliente no tiene número de teléfono.");
            return;
        }

        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 9) {
            cleanPhone = '34' + cleanPhone;
        }

        const clientName = client?.name || "Cliente";
        const bikeName = repair?.motorcycle ? `${repair.motorcycle.brand} ${repair.motorcycle.model}` : "su vehículo";

        let message = "";
        if (repair.status === 'terminado' || repair.status === 'entregado') {
            message = `Hola ${clientName}, le informamos de que su ${bikeName} ya está LISTA para recoger. \n\nTotal: €${(repair.total_cost * 1.21).toFixed(2)} (IVA incl.)\nPuede pasar a buscarla cuando desee.\n\nUn saludo.`;
        } else {
            message = `Hola ${clientName}, le escribimos referente a su ${bikeName} que está actualmente en nuestro taller.\n\n`;
        }

        // 1. Check Session Preference (resets when app closes)
        const savedPref = sessionStorage.getItem('whatsapp_pref'); // 'web' or 'app'

        if (savedPref) {
            executeWhatsApp(savedPref, cleanPhone, message);
        } else {
            // Ask user
            setPendingWhatsApp({ phone: cleanPhone, message });
            setShowWhatsAppModal(true);
        }
    };

    const executeWhatsApp = (mode, phone, msg) => {
        let url = "";
        if (mode === 'web') {
            // Web Force
            url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
        } else {
            // App Protocol (Desktop App)
            url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}`;
        }
        window.open(url, '_blank');
    };

    const confirmWhatsAppPref = (mode) => {
        sessionStorage.setItem('whatsapp_pref', mode);

        if (pendingWhatsApp) {
            executeWhatsApp(mode, pendingWhatsApp.phone, pendingWhatsApp.message);
        }

        setShowWhatsAppModal(false);
        setPendingWhatsApp(null);
    };

    const handleDeleteRepairTotal = async () => {
        if (!window.confirm("¿ESTÁS COMPLETAMENTE SEGURO? Esta acción eliminará la orden de trabajo COMPLETA, incluyendo todas sus partidas y el historial asociado. Esta acción NO se puede deshacer.")) return;
        try {
            await api.delete(`/repairs/${id}`);
            alert("Orden eliminada con éxito.");
            navigate('/repairs');
        } catch (error) {
            console.error("Error deleting total repair:", error);
            alert("Ocurrió un error al intentar eliminar la orden de trabajo.");
        }
    };

    if (loading && !repair) return <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Sincronizando expediente...</div>; // Only show full loading if repair data isn't loaded yet
    if (!repair) return <div className="p-8 text-center">Reparación no encontrada.</div>;

    const isFinished = repair.status === 'terminado' || repair.status === 'entregado';
    const isPaid = repair.paid;

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <div className="flex justify-between items-center">
                <Link to="/repairs" className="flex items-center gap-3 text-slate-500 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 group transition-all">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="font-black uppercase text-[10px] tracking-[0.2em]">Listado de Reparaciones</span>
                </Link>

                {repair.motorcycle_id ? (
                    <Link
                        to={`/motorcycles/${repair.motorcycle_id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all font-black text-[10px] uppercase tracking-widest border border-transparent dark:border-slate-700"
                    >
                        <Bike size={16} /> Ver Ficha del Vehículo
                    </Link>
                ) : repair.client_id && (
                    <Link
                        to={`/clients/${repair.client_id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all font-black text-[10px] uppercase tracking-widest border border-transparent dark:border-slate-700"
                    >
                        <Package size={16} /> Ver Ficha del Cliente
                    </Link>
                )}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="space-y-6 flex-1 w-full">
                    {isEditingMetadata ? (
                        <div className="bg-blue-50/50 dark:bg-blue-950/20 p-8 rounded-[2rem] border border-blue-100 dark:border-blue-900/50 space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] italic">Editando Información de la Orden</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditingMetadata(false)} className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">Cancelar</button>
                                    <button onClick={handleSaveMetadata} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Guardar Cambios</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Asociar a Vehículo</label>
                                    <select
                                        className="w-full px-5 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold text-sm uppercase outline-none"
                                        value={metadataForm.motorcycle_id}
                                        onChange={e => setMetadataForm({ ...metadataForm, motorcycle_id: e.target.value, client_id: '' })}
                                    >
                                        <option value="">NINGUNO (VENTA DIRECTA)</option>
                                        {motorcycles.map(m => {
                                            const owner = clients.find(c => c.id === m.client_id)?.name || "?";
                                            return <option key={m.id} value={m.id}>{m.plate} - {m.brand} {m.model} ({owner})</option>
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Asociar a Cliente (Solo si no hay vehículo)</label>
                                    <select
                                        className="w-full px-5 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold text-sm uppercase outline-none"
                                        value={metadataForm.client_id}
                                        disabled={!!metadataForm.motorcycle_id}
                                        onChange={e => setMetadataForm({ ...metadataForm, client_id: e.target.value })}
                                    >
                                        <option value="">SELECCIONAR CLIENTE...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Kilometraje de Entrada</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold outline-none"
                                        value={metadataForm.entry_km}
                                        onChange={e => setMetadataForm({ ...metadataForm, entry_km: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Descripción / Motivo de Entrada</label>
                                    <textarea
                                        className="w-full px-5 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold uppercase outline-none"
                                        rows="2"
                                        value={metadataForm.description}
                                        onChange={e => setMetadataForm({ ...metadataForm, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="group relative">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-950 dark:bg-blue-600 flex items-center justify-center text-white shadow-xl">
                                    <Wrench size={28} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-4">
                                        <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">Orden #{repair.id}</h1>
                                        <div className="flex gap-1 items-center">
                                            <button
                                                onClick={() => setIsEditingMetadata(true)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                                                title="Editar Información Básica"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={fetchData}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                                                title="Sincronizar"
                                            >
                                                <Plus size={18} className="rotate-45" /> 
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-[0.2em] text-[10px] mt-2">Expediente de Reparación Digital</p>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-2">
                                <h2 className="text-2xl font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight italic leading-tight">{repair.description}</h2>
                                {repair.entry_km && (
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                        <Wrench size={12} className="opacity-40" /> Kilómetros al ingreso: {repair.entry_km} KM
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <span className={cn(
                                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border",
                                    repair.status === 'terminado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50' :
                                        repair.status === 'entregado' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-900/50' :
                                            'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50'
                                )}>
                                    {repair.status}
                                </span>
                                {repair.paid && (
                                    <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                                        <CheckCircle size={12} /> Liquidado
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {!isFinished && (
                        <button
                            onClick={() => updateStatus('terminado')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <CheckCircle size={18} /> Finalizar Orden
                        </button>
                    )}
                    {isFinished && !isPaid && (
                        <button
                            onClick={() => updateStatus('entregado', true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <DollarSign size={18} /> Cobrar y Entregar
                        </button>
                    )}
                    {isFinished && !isPaid && (
                        <button
                            onClick={() => updateStatus('pendiente')}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <Wrench size={18} /> Reabrir
                        </button>
                    )}
                    <Link
                        to={`/invoice/${repair.id}`}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white p-4 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
                        title="Imprimir Factura"
                    >
                        <Printer size={20} />
                    </Link>
                    <button
                        onClick={handleWhatsApp}
                        className="bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-green-500/20 active:scale-95"
                        title="Contactar por WhatsApp"
                    >
                        {/* Simple WhatsApp Icon Path since Lucide might not have 'MessageCircle' exactly like WhatsApp, using MessageCircle is fine or SVG */}
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                    </button>
                    <button
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        className={cn(
                            "bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50",
                            sendingEmail && "animate-pulse"
                        )}
                        title="Enviar Factura por Email"
                    >
                        <Mail size={20} />
                    </button>
                    <button
                        onClick={handleDeleteRepairTotal}
                        className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-900/50 text-rose-500 p-4 rounded-2xl flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all shadow-sm"
                        title="Eliminar Orden Definitivamente"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="p-10 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Partidas y Materiales</h2>
                        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest mt-1">Desglose detallado de la intervención</p>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest mb-1">Resumen Económico</p>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex gap-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                <span>Base Imponible:</span>
                                <span>€{repair.total_cost.toFixed(2)}</span>
                            </div>
                            <div className="flex gap-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                <span>I.V.A (21%):</span>
                                <span>€{(repair.total_cost * 0.21).toFixed(2)}</span>
                            </div>
                            <div className="flex gap-4 items-baseline mt-1">
                                <span className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">TOTAL</span>
                                <span className="text-5xl font-black text-slate-900 dark:text-white tabular-nums italic">€{(repair.total_cost * 1.21).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
                            <th className="px-10 py-5">Concepto / Referencia</th>
                            <th className="px-6 py-5 text-center w-24">Uds.</th>
                            <th className="px-6 py-5 text-right w-32">P. Unit</th>
                            <th className="px-6 py-5 text-right w-32">Subtotal</th>
                            {!isFinished && <th className="px-10 py-5 text-right w-24"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {repair.items.length === 0 ? (
                            <tr><td colSpan="5" className="p-20 text-center text-slate-400 uppercase font-black text-[10px] tracking-widest">No hay conceptos registrados en esta orden.</td></tr>
                        ) : (
                            repair.items.map(item => {
                                const linkedStock = stockItems.find(s => s.id === item.stock_item_id);
                                const isOverStock = linkedStock && linkedStock.quantity < 0;

                                return (
                                    <tr key={item.id} className={cn(
                                        "group transition-colors",
                                        isOverStock ? "bg-rose-50/50 hover:bg-rose-100/50 dark:bg-rose-900/10 dark:hover:bg-rose-900/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-950/50"
                                    )}>
                                        {editingItem && editingItem.id === item.id ? (
                                            <>
                                                <td className="px-10 py-4">
                                                    <input
                                                        type="text"
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold uppercase dark:text-white"
                                                        value={editingItem.description}
                                                        onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-900 rounded-xl text-center font-bold dark:text-white"
                                                        value={editingItem.quantity}
                                                        onChange={e => setEditingItem({ ...editingItem, quantity: e.target.value })}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-900 rounded-xl text-right font-bold dark:text-white"
                                                        value={editingItem.cost}
                                                        onChange={e => setEditingItem({ ...editingItem, cost: e.target.value })}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-900 dark:text-white font-black italic">
                                                    €{(editingItem.cost * editingItem.quantity).toFixed(2)}
                                                </td>
                                                <td className="px-10 py-4 text-right">
                                                    <div className="flex justify-end gap-2 text-white">
                                                        <button onClick={handleUpdateItem} className="bg-emerald-600 p-2 rounded-lg"><Check size={18} /></button>
                                                        <button onClick={cancelEditing} className="bg-slate-400 p-2 rounded-lg"><X size={18} /></button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-10 py-5">
                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            "text-sm font-bold uppercase tracking-tight italic",
                                                            isOverStock ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-200"
                                                        )}>
                                                            {item.description}
                                                        </span>
                                                        <div className="flex gap-2 items-center mt-1">
                                                            {item.stock_item_id && (
                                                                <span className="text-[10px] text-blue-600 dark:text-blue-500 font-black uppercase tracking-widest flex items-center gap-1">
                                                                    <Package size={10} /> Recambio
                                                                </span>
                                                            )}
                                                            {isOverStock && (
                                                                <span className="text-[9px] bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-black uppercase tracking-widest border border-rose-200 dark:border-rose-800">
                                                                    ¡Stock: {linkedStock.quantity}!
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={cn(
                                                    "px-6 py-5 text-center font-black tabular-nums",
                                                    isOverStock ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"
                                                )}>
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-5 text-right text-slate-500 dark:text-slate-500 font-bold tabular-nums">€{item.cost.toFixed(2)}</td>
                                                <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white italic tabular-nums">
                                                    €{(item.cost * (item.quantity || 1)).toFixed(2)}
                                                </td>
                                                {!isFinished && (
                                                    <td className="px-10 py-5 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={(e) => { e.stopPropagation(); startEditing(item); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all"><Edit2 size={16} /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                )}
                                            </>
                                        )}
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>

                {!isFinished && (
                    <div className="p-10 bg-slate-50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Añadir Nueva Partida</h3>
                            {selectedStockItem ? (() => {
                                const qty = parseInt(newItem.quantity) || 0;
                                const stock = selectedStockItem.quantity;
                                const isInsufficient = qty > stock || stock <= 0;
                                const isExhausted = stock <= 0;

                                return (
                                    <div className={cn(
                                        "flex items-center gap-3 px-4 py-2 rounded-2xl border transition-colors",
                                        isInsufficient
                                            ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
                                            : "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-900/50"
                                    )}>
                                        <Package size={14} className={cn(isInsufficient ? "text-rose-600" : "text-blue-600")} />
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest",
                                            isInsufficient ? "text-rose-700 dark:text-rose-400" : "text-blue-700 dark:text-blue-400"
                                        )}>
                                            Disponible: {stock} Uds. {isExhausted ? "(AGOTADO)" : (isInsufficient && "(INSUFICIENTE)")}
                                        </span>
                                    </div>
                                );
                            })() : <div></div>}
                        </div>
                        <form onSubmit={handleAddItem} className="flex flex-col lg:flex-row gap-4 items-end">
                            <div className="flex-1 w-full relative">
                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1.5 block ml-1">Descripción del Ítem</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none dark:text-white font-bold uppercase transition-all"
                                    placeholder="EJ: KIT DE TRANSMISIÓN DID"
                                    required
                                    value={newItem.description}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewItem({ ...newItem, description: val });

                                        // Auto-match exact name
                                        const exactMatch = stockItems.find(s => s.name.toLowerCase() === val.trim().toLowerCase());
                                        if (exactMatch) {
                                            setSelectedStockItem(exactMatch);
                                            setDecrementStock(true);
                                        } else {
                                            // Only clear if we deviate and weren't already holding a valid item (or maybe we should always clear if no match? NO, user might edit name)
                                            // Sticking to: if it's not exact match, check suggestions. 
                                            // If we are typing, suggestions appear.
                                            if (selectedStockItem && selectedStockItem.name.toLowerCase() !== val.trim().toLowerCase()) {
                                                setSelectedStockItem(null);
                                                setDecrementStock(false);
                                            }
                                        }

                                        if (val.trim().length > 1) {
                                            const filtered = stockItems.filter(item =>
                                                item.name.toLowerCase().includes(val.toLowerCase())
                                            );
                                            setSuggestions(filtered);
                                        } else {
                                            setSuggestions([]);
                                        }
                                    }}
                                    onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                                />
                                {suggestions.length > 0 && (
                                    <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl mb-2 z-[200] overflow-hidden max-h-60 overflow-y-auto">
                                        {suggestions.map(item => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => selectStockItem(item)}
                                                className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                                            >
                                                <div>
                                                    <p className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-tight italic">{item.name}</p>
                                                    <p className="text-[9px] text-slate-400 dark:text-slate-600 uppercase tracking-widest font-black mt-1">Ref: {item.reference || '---'}</p>
                                                </div>
                                                <span className={cn(
                                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none",
                                                    item.quantity <= 0 ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" : "bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-400"
                                                )}>
                                                    Stock: {item.quantity}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="w-full lg:w-32">
                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1.5 block ml-1">Cant.</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className={cn(
                                            "w-full px-5 py-3.5 bg-white dark:bg-slate-950 border rounded-[1.25rem] focus:ring-4 focus:outline-none dark:text-white font-black text-center transition-all",
                                            selectedStockItem && (parseInt(newItem.quantity) > selectedStockItem.quantity || selectedStockItem.quantity <= 0)
                                                ? "border-rose-500 text-rose-500 focus:ring-rose-500/10 focus:border-rose-500"
                                                : "border-slate-200 dark:border-slate-800 focus:ring-blue-500/10 focus:border-blue-500"
                                        )}
                                        required
                                        min="1"
                                        value={newItem.quantity}
                                        onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="w-full lg:w-44">
                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1.5 block ml-1">P. Unitario (€)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full px-8 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none dark:text-white font-black text-right transition-all"
                                        required
                                        value={newItem.cost}
                                        onChange={e => setNewItem({ ...newItem, cost: e.target.value })}
                                    />
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 font-black">€</span>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={addingItem}
                                className="w-full lg:w-auto bg-slate-950 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white px-8 py-4 rounded-[1.25rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                            >
                                {addingItem ? 'Añadiendo...' : <><Plus size={18} /> Insertar</>}
                            </button>
                        </form>
                    </div>
                )}
                {/* Modal de Borrado de Ítem (No bloqueante) */}
                {deletingItem && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center scale-100 animate-in zoom-in-95 duration-200">
                            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">¿Eliminar Partida?</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto leading-relaxed">
                                Esta acción eliminará el artículo y devolverá el stock correspondiente.
                            </p>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button
                                    onClick={() => setDeletingItem(null)}
                                    className="py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all font-black"
                                >
                                    No, Volver
                                </button>
                                <button
                                    onClick={confirmDeleteItem}
                                    className="py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                                >
                                    Sí, Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* WhatsApp Preference Modal */}
                {showWhatsAppModal && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 scale-100 animate-in zoom-in-95 duration-200">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-[#25D366]/10 text-[#25D366] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">¿Cómo quieres contactar hoy?</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto leading-relaxed">
                                    Selecciona tu método preferido.<br />No te volveremos a preguntar hasta mañana.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button
                                    onClick={() => confirmWhatsAppPref('web')}
                                    className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-200/50 dark:to-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-3xl relative z-10 group-hover:scale-110 transition-transform duration-300">🌍</span>
                                    <div className="text-center relative z-10">
                                        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 group-hover:text-[#25D366]">WhatsApp Web</span>
                                        <span className="text-[8px] text-slate-400 font-medium">Desde el navegador</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => confirmWhatsAppPref('app')}
                                    className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-200/50 dark:to-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-3xl relative z-10 group-hover:scale-110 transition-transform duration-300">💻</span>
                                    <div className="text-center relative z-10">
                                        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 group-hover:text-[#25D366]">App Escritorio</span>
                                        <span className="text-[8px] text-slate-400 font-medium">Programa instalado</span>
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={() => { setShowWhatsAppModal(false); setPendingWhatsApp(null); }}
                                className="w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                            >
                                Cancelar Operación
                            </button>
                        </div>
                    </div>
                )}

            </div>
            {/* Modal de Envío de Email */}
            {
                showEmailModal && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                            <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center text-center">
                                <div className="mx-auto">
                                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <Mail size={32} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Enviar Factura Digital</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 px-10">Confirma los destinatarios de la orden #{repair.id}</p>
                                </div>
                            </div>

                            <div className="p-10 space-y-8">
                                {/* RECIPENT OPTIONS */}
                                <div className="space-y-4">
                                    {repair?.client?.email || repair?.motorcycle?.owner?.email ? (
                                        <label className={cn(
                                            "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer",
                                            emailConfig.useClient ? "border-purple-500 bg-purple-50/50 dark:bg-purple-900/10" : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                        )}>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-lg border-2 border-slate-300 text-purple-600 focus:ring-purple-500"
                                                checked={emailConfig.useClient}
                                                onChange={e => setEmailConfig({ ...emailConfig, useClient: e.target.checked })}
                                            />
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email del Cliente</p>
                                                <p className="font-bold text-slate-900 dark:text-white">{repair?.client?.email || repair?.motorcycle?.owner?.email}</p>
                                            </div>
                                        </label>
                                    ) : (
                                        <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">El cliente no tiene un email configurado en su ficha técnica.</p>
                                        </div>
                                    )}

                                    <div className={cn(
                                        "p-5 rounded-2xl border-2 transition-all space-y-4",
                                        emailConfig.useManual ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : "border-slate-100 dark:border-slate-800"
                                    )}>
                                        <label className="flex items-center gap-4 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={emailConfig.useManual}
                                                onChange={e => setEmailConfig({ ...emailConfig, useManual: e.target.checked })}
                                            />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enviar a otro Email manual</span>
                                        </label>

                                        {emailConfig.useManual && (
                                            <input
                                                type="text"
                                                placeholder="Introduce email manual..."
                                                className="w-full px-5 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-sm dark:text-white"
                                                value={emailConfig.manualEmail}
                                                onChange={e => setEmailConfig(prev => ({ ...prev, manualEmail: e.target.value }))}
                                                autoFocus
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* PREVIEW SUMMARY */}
                                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resumen Factura (IVA Incl.)</span>
                                        <span className="text-xs font-black text-slate-900 dark:text-white italic">€{(repair.total_cost * 1.21).toFixed(2)}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase leading-relaxed line-clamp-2">{repair.description}</p>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowEmailModal(false)}
                                        className="flex-1 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        Descartar
                                    </button>
                                    <button
                                        onClick={confirmSendEmail}
                                        disabled={sendingEmail}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        {sendingEmail ? 'Enviando...' : <><Mail size={18} /> ENVIAR AHORA</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
