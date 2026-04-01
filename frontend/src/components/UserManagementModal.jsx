import React, { useState, useEffect } from 'react';
import { User, Shield, Trash2, X, Plus, AlertCircle, Key, CheckCircle, Edit2 } from 'lucide-react';
import api from '../lib/api';

const UserManagementModal = ({ isOpen, onClose }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'mechanic'
    });

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/auth/users');
            setUsers(res.data);
        } catch (err) {
            setError('No se pudieron cargar los usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingUser(null);
        setFormData({ username: '', password: '', full_name: '', role: 'mechanic' });
        setShowForm(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '', // Password optional on edit
            full_name: user.full_name || '',
            role: user.role
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            if (editingUser) {
                // Update
                const updatePayload = { ...formData };
                if (!updatePayload.password) delete updatePayload.password;
                await api.put(`/auth/users/${editingUser.id}`, updatePayload);
                setSuccess('Usuario actualizado correctamente');
            } else {
                // Create
                await api.post('/auth/users', formData);
                setSuccess('Usuario creado correctamente');
            }
            setShowForm(false);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.detail || 'Error en la operación');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;
        try {
            await api.delete(`/auth/users/${userId}`);
            setSuccess('Usuario eliminado');
            fetchUsers();
        } catch (err) {
            setError('Error al eliminar usuario');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white">
                    <div>
                        <h2 className="text-xl font-black uppercase italic tracking-tight">Personal del Taller</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión administrativa de accesos</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 border border-red-100 animate-in slide-in-from-top-2">
                            <AlertCircle size={18} />
                            <p className="text-xs font-bold uppercase">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 border border-emerald-100 animate-in slide-in-from-top-2">
                            <CheckCircle size={18} />
                            <p className="text-xs font-bold uppercase">{success}</p>
                        </div>
                    )}

                    {!showForm ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">EQUIPO REGISTRADO</h3>
                                <button 
                                    onClick={handleOpenCreate}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                                >
                                    <Plus size={14} /> Nuevo Acceso
                                </button>
                            </div>

                            <div className="grid gap-3">
                                {loading ? (
                                    <div className="py-10 text-center text-[10px] font-black text-slate-300 uppercase animate-pulse italic">Cargando credenciales...</div>
                                ) : users.map(u => (
                                    <div key={u.id} className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:border-blue-500/30">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white border transition-all shadow-sm ${
                                                u.role === 'admin' ? 'bg-amber-500 border-amber-400 shadow-amber-500/30' : 'bg-slate-400 border-slate-300 shadow-slate-400/20'
                                            }`}>
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase italic">{u.username}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{u.full_name || 'Personal'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="hidden md:flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mr-2">
                                                <span className={`text-[9px] font-black px-4 py-2.5 uppercase tracking-widest ${
                                                    u.role === 'admin' ? 'text-amber-600' : 'text-slate-500'
                                                }`}>
                                                    {u.role === 'admin' ? 'ADMINISTRADOR' : 'PERSONAL'}
                                                </span>
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleOpenEdit(u)}
                                                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                title="Editar usuario"
                                            >
                                                <Edit2 size={16} />
                                            </button>

                                            {u.username !== 'admin' && (
                                                <button 
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                    title="Eliminar permanentemente"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <button type="button" onClick={() => setShowForm(false)} className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 italic">← Volver al listado</button>
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">{editingUser ? 'MODO EDICIÓN' : 'NUEVO REGISTRO'}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic tracking-widest">Nombre de Usuario</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full px-6 py-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-black uppercase italic"
                                        placeholder="PEDRO_VZ"
                                        value={formData.username}
                                        onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic tracking-widest">
                                        {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial'}
                                    </label>
                                    <input 
                                        type="text" 
                                        required={!editingUser}
                                        className="w-full px-6 py-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-black italic"
                                        placeholder={editingUser ? 'Dejar en blanco para no cambiar' : 'PIN 1234'}
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic tracking-widest">Nombre Completo / Titular</label>
                                <input 
                                    type="text" 
                                    className="w-full px-6 py-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-black uppercase italic"
                                    placeholder="PEDRO VAZQUEZ"
                                    value={formData.full_name}
                                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic tracking-widest">Atribuciones / Nivel de Acceso</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, role: 'admin'})}
                                        className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all flex flex-col items-center gap-1 ${
                                            formData.role === 'admin' 
                                            ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' 
                                            : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400'
                                        }`}
                                    >
                                        <Shield size={16} /> ADMINISTRADOR
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, role: 'mechanic'})}
                                        className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all flex flex-col items-center gap-1 ${
                                            formData.role === 'mechanic' 
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                            : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400'
                                        }`}
                                    >
                                        <User size={16} /> PERSONAL OPERATIVO
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button 
                                    type="submit"
                                    className={`w-full py-5 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all italic ${
                                        editingUser ? 'bg-amber-600' : 'bg-slate-950 dark:bg-blue-600'
                                    }`}
                                >
                                    {editingUser ? 'GUARDAR CAMBIOS EN PERFIL' : 'REGISTRAR NUEVO ACCESO'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagementModal;
