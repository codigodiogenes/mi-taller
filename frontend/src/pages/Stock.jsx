/**
 * Componente: Stock (Inventario)
 * Descripción: Gestión del inventario de piezas, recambios y consumibles.
 * Permite dar de alta nuevos productos, controlar las cantidades y los precios.
 */
import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import api from '../lib/api';
import { cn } from '../lib/utils';

export default function Stock() {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', quantity: 1 });

    useEffect(() => {
        fetchStock();
    }, []);

    const fetchStock = async () => {
        try {
            const res = await api.get('/stock');
            setItems(res.data);
        } catch (error) {
            console.error("Error fetching stock:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            await api.post('/stock', newItem);
            setNewItem({ name: '', quantity: 1 });
            setShowAddForm(false);
            fetchStock();
        } catch (error) {
            console.error("Error adding stock item:", error);
            alert("Error al añadir artículo");
        }
    };

    const updateQuantity = async (id, currentQty, amount) => {
        const newQty = Math.max(0, currentQty + amount);
        try {
            await api.put(`/stock/${id}`, { quantity: newQty });
            fetchStock();
        } catch (error) {
            console.error("Error updating quantity:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este artículo del almacén?")) return;
        try {
            await api.delete(`/stock/${id}`);
            fetchStock();
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10">
            <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Almacén', to: '/stock' }]} />
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">Almacén</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium uppercase tracking-widest text-xs">Gestión de inventario y recambios</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                    <Plus size={20} /> Registrar Artículo
                </button>
            </div>

            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Search size={20} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Filtrar por nombre de recambio o SKU..."
                    className="w-full pl-14 pr-8 py-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white dark:bg-slate-900 dark:text-white font-bold shadow-sm transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="px-10 py-20 text-center text-slate-400 uppercase font-black text-[10px] tracking-[0.2em] animate-pulse">Sincronizando inventario...</div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                            <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
                                <th className="px-10 py-5">Recambio / Categoría</th>
                                <th className="px-10 py-5">Stock Disponible</th>
                                <th className="px-10 py-5 text-right w-32">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-10 py-20 text-center text-slate-400 uppercase font-black text-[10px] tracking-widest">
                                        No se localizaron registros para "{searchQuery}".
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all shadow-inner">
                                                    <Package size={22} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 dark:text-slate-200 uppercase tracking-tight italic text-lg leading-tight">{item.name}</div>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest mt-1">ID Almacén: #{item.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-6">
                                                <span className={cn(
                                                    "text-2xl font-black italic tabular-nums leading-none",
                                                    item.quantity <= 2 ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                                                )}>
                                                    {item.quantity} <span className="text-[10px] not-italic text-slate-400 uppercase tracking-widest font-black">UDS</span>
                                                </span>
                                                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity, -1)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                                    >
                                                        <ChevronDown size={18} />
                                                    </button>
                                                    <div className="w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity, 1)}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
                                                    >
                                                        <ChevronUp size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                title="Retirar del inventario"
                                            >
                                                <Trash2 size={22} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de Añadir */}
            {showAddForm && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Alta de Recambio</h2>
                        </div>
                        <form onSubmit={handleAddItem} className="p-10 space-y-8">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5 block">Nombre del Artículo / Referencia</label>
                                <input
                                    type="text"
                                    placeholder="EJ: ACEITE MOTUL 10W40 4L"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold uppercase"
                                    required
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5 block">Stock Inicial en Almacén</label>
                                <input
                                    type="number"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-black"
                                    required
                                    min="0"
                                    value={newItem.quantity}
                                    onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    Descartar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                    Guardar Artículo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
