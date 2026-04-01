/**
 * Componente: Settings (Configuración)
 * Descripción: Ajustes generales del taller, como la configuración del correo 
 * electrónico (SMTP) para enviar facturas, el logo de la empresa y otros 
 * parámetros de la aplicación.
 */
import React, { useState, useEffect } from 'react';
import { Save, Shield, Globe, Info, Image as ImageIcon, Mail, Eye, EyeOff, Users as UsersIcon } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import UserManagementModal from '../components/UserManagementModal';

export default function Settings() {
    const [settings, setSettings] = useState({
        workshop_name: '',
        workshop_address: '',
        workshop_phone: '',
        workshop_email: '',
        logo_url: '',
        // Email configuration
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_password: '',
        smtp_from_name: '',
        smtp_enabled: 'false'
    });
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    
    const { theme } = useTheme();
    const { user, isAdmin } = useAuth();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            const settingsObj = {};
            response.data.forEach(s => settingsObj[s.key] = s.value);

            setSettings({
                workshop_name: settingsObj.workshop_name || '',
                workshop_address: settingsObj.workshop_address || '',
                workshop_phone: settingsObj.workshop_phone || '',
                workshop_email: settingsObj.workshop_email || '',
                logo_url: settingsObj.logo_url || '',
                enable_auto_backup: settingsObj.enable_auto_backup || 'false',
                backup_frequency: settingsObj.backup_frequency || 'siempre',
                smtp_host: settingsObj.smtp_host || '',
                smtp_port: settingsObj.smtp_port || '587',
                smtp_user: settingsObj.smtp_user || '',
                smtp_password: settingsObj.smtp_password || '',
                smtp_from_name: settingsObj.smtp_from_name || '',
                smtp_enabled: settingsObj.smtp_enabled || 'false'
            });
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await Promise.all([
                api.post('/settings', { key: 'workshop_name', value: settings.workshop_name }),
                api.post('/settings', { key: 'workshop_address', value: settings.workshop_address }),
                api.post('/settings', { key: 'workshop_phone', value: settings.workshop_phone }),
                api.post('/settings', { key: 'workshop_email', value: settings.workshop_email }),
                api.post('/settings', { key: 'logo_url', value: settings.logo_url })
            ]);
            alert("Configuración maestros actualizada correctamente");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Error al actualizar la configuración");
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/settings/upload-logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSettings({ ...settings, logo_url: res.data.url });
            alert("Logo subido correctamente");
        } catch (error) {
            console.error("Error uploading logo:", error);
            alert("Error al subir el logo");
        }
    };

    const handleSaveEmail = async (e) => {
        e.preventDefault();
        try {
            await Promise.all([
                api.post('/settings', { key: 'smtp_host', value: settings.smtp_host }),
                api.post('/settings', { key: 'smtp_port', value: settings.smtp_port }),
                api.post('/settings', { key: 'smtp_user', value: settings.smtp_user }),
                api.post('/settings', { key: 'smtp_password', value: settings.smtp_password }),
                api.post('/settings', { key: 'smtp_from_name', value: settings.smtp_from_name }),
                api.post('/settings', { key: 'smtp_enabled', value: settings.smtp_enabled })
            ]);
            alert("Configuración de email actualizada correctamente");
        } catch (error) {
            console.error("Error saving email settings:", error);
            alert("Error al actualizar la configuración de email");
        }
    };

    if (loading) return <div className="px-10 py-20 text-center text-slate-400 uppercase font-black text-[10px] tracking-[0.2em] animate-pulse">Cargando base de datos...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">Ajustes del Sistema</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium uppercase tracking-widest text-xs">Identidad y parámetros técnicos del taller</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                            <Info size={18} />
                        </div>
                        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">IDENTIDAD CORPORATIVA</h2>
                    </div>
                </div>

                <form onSubmit={handleSave} className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 ml-2 block italic">Razón Social / Nombre Comercial</label>
                            <input
                                type="text"
                                className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-black uppercase tracking-tight"
                                value={settings.workshop_name}
                                onChange={e => setSettings({ ...settings, workshop_name: e.target.value })}
                                placeholder="NOMBRE DEL TALLER"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 ml-2 block italic">Teléfono de Atención</label>
                            <input
                                type="text"
                                className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-black"
                                value={settings.workshop_phone}
                                onChange={e => setSettings({ ...settings, workshop_phone: e.target.value })}
                                placeholder="+34 600 000 000"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 ml-2 block italic">Sede / Dirección Física</label>
                        <textarea
                            className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold uppercase"
                            value={settings.workshop_address}
                            onChange={e => setSettings({ ...settings, workshop_address: e.target.value })}
                            placeholder="DIRECCIÓN COMPLETA..."
                            rows={2}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 ml-2 block italic">Email de Correspondencia</label>
                        <input
                            type="email"
                            className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white font-bold"
                            value={settings.workshop_email}
                            onChange={e => setSettings({ ...settings, workshop_email: e.target.value })}
                            placeholder="contacto@taller.com"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 ml-2 block italic">Recursos Visuales (Logo del Taller)</label>
                        <div className="flex gap-6 items-start">
                            <div className="flex-1 space-y-4">
                                <label className="flex items-center gap-4 w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all">
                                    <ImageIcon size={20} className="text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seleccionar nuevo logo de los archivos</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-8 py-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100/50 dark:border-slate-800/50 focus:outline-none dark:text-slate-400 font-medium text-[10px] italic"
                                    value={settings.logo_url}
                                    onChange={e => setSettings({ ...settings, logo_url: e.target.value })}
                                    placeholder="O introduce una URL externa..."
                                />
                            </div>
                            <div className="w-32 h-32 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                                {settings.logo_url ? (
                                    <img
                                        src={settings.logo_url.startsWith('http') ? settings.logo_url : `${api.defaults.baseURL}${settings.logo_url}`}
                                        alt="Vista previa"
                                        className="max-w-full max-h-full object-contain drop-shadow-lg"
                                    />
                                ) : (
                                    <ImageIcon size={40} className="text-slate-200 dark:text-slate-800" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                            type="submit"
                            className="flex items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all group"
                        >
                            <Save size={20} className="group-hover:rotate-12 transition-transform" /> GUARDAR PARÁMETROS
                        </button>
                    </div>
                </form>
            </div>

            {/* BACKUP SECTION */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                            <Shield size={18} />
                        </div>
                        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">SEGURIDAD Y RESPALDOS</h2>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-slate-50 dark:border-slate-800/50">
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Copia de Seguridad Manual</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                Genera un archivo .ZIP completo con toda tu base de datos, fotos y documentos.<br />
                                Se guardará en la carpeta <span className="text-blue-500 font-bold">copias_de_seguridad</span> de tu sistema.
                            </p>
                        </div>
                        <button
                            onClick={async () => {
                                const btn = document.getElementById('btn-backup');
                                btn.disabled = true;
                                btn.innerText = "PROCESANDO ARCHIVO...";
                                try {
                                    const res = await api.post('/settings/backup');
                                    alert(res.data.message);
                                } catch (e) {
                                    alert("Error al generar la copia de seguridad");
                                } finally {
                                    btn.disabled = false;
                                    btn.innerText = "GENERAR COPIA AHORA";
                                }
                            }}
                            id="btn-backup"
                            className="bg-slate-950 dark:bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0"
                        >
                            GENERAR COPIA AHORA
                        </button>
                    </div>

                    {/* RESTORE SECTION */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-slate-50 dark:border-slate-800/50">
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-lg font-black text-rose-500 dark:text-rose-400 uppercase italic tracking-tight">Restaurar Copia de Seguridad</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                Recupera tus datos desde un archivo .ZIP generado anteriormente.<br />
                                <span className="text-rose-500 font-bold">¡CUIDADO!</span> Esto sobrescribirá todos los datos actuales del taller.
                            </p>
                        </div>
                        <input
                            type="file"
                            accept=".zip"
                            className="hidden"
                            id="restore-backup-input"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;

                                if (!window.confirm("⚠️ ¿ESTÁS SEGURO?\n\nAl restaurar una copia, SE BORRARÁN todos los datos actuales del taller (clientes, facturas, motos) y se reemplazarán por los de la copia.\n\nEsta acción no se puede deshacer.")) {
                                    e.target.value = null; // Reset input
                                    return;
                                }

                                const formData = new FormData();
                                formData.append('file', file);

                                const btn = document.getElementById('btn-restore');
                                const originalText = btn.innerText;
                                btn.disabled = true;
                                btn.innerText = "RESTAURANDO...";

                                try {
                                    const res = await api.post('/settings/restore-backup', formData, {
                                        headers: { 'Content-Type': 'multipart/form-data' }
                                    });
                                    alert("✅ " + res.data.message + "\n\nEl sistema se ha actualizado. Se recomienda reiniciar la aplicación.");
                                    window.location.reload();
                                } catch (error) {
                                    console.error("Error restoring backup:", error);
                                    alert("❌ Error al restaurar la copia: " + (error.response?.data?.detail || error.message));
                                } finally {
                                    btn.disabled = false;
                                    btn.innerText = originalText;
                                    e.target.value = null;
                                }
                            }}
                        />
                        <button
                            onClick={() => document.getElementById('restore-backup-input').click()}
                            id="btn-restore"
                            className="bg-rose-500 hover:bg-rose-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0"
                        >
                            RESTAURAR COPIA
                        </button>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center justify-between gap-6">
                            <div className="space-y-1 flex-1">
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest italic">Activar Copia Automática</h3>
                                <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">El sistema generará una copia al iniciar según la frecuencia elegida.</p>
                            </div>
                            <button
                                onClick={async () => {
                                    const current = String(settings.enable_auto_backup) === 'true';
                                    const newVal = current ? 'false' : 'true';
                                    try {
                                        await api.post('/settings', { key: 'enable_auto_backup', value: newVal });
                                        setSettings(prev => ({ ...prev, enable_auto_backup: newVal }));
                                    } catch (e) { alert("Error al actualizar ajuste"); }
                                }}
                                className={cn(
                                    "w-20 h-10 rounded-full p-1 transition-all duration-300 shadow-inner overflow-hidden flex",
                                    String(settings.enable_auto_backup) === 'true' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full bg-white shadow-lg transition-all duration-300",
                                    String(settings.enable_auto_backup) === 'true' ? 'ml-10' : 'ml-0'
                                )} />
                            </button>
                        </div>

                        {(settings.enable_auto_backup === true || settings.enable_auto_backup === 'true') && (
                            <div className="flex items-center justify-between gap-6 bg-slate-50 dark:bg-slate-950/20 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest italic">Intervalo de Generación</h3>
                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.1em]">¿Cada cuánto tiempo automatizar el respaldo?</p>
                                </div>
                                <select
                                    value={settings.backup_frequency || 'siempre'}
                                    onChange={async (e) => {
                                        const newVal = e.target.value;
                                        try {
                                            await api.post('/settings', { key: 'backup_frequency', value: newVal });
                                            setSettings({ ...settings, backup_frequency: newVal });
                                        } catch (e) { alert("Error al actualizar frecuencia"); }
                                    }}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-[0.1em] focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-700 dark:text-white"
                                >
                                    <option value="siempre">Cada vez que abra</option>
                                    <option value="semanal">Cada 7 días</option>
                                    <option value="quincenal">Cada 15 días</option>
                                    <option value="mensual">Cada 30 días</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* USER MANAGEMENT SECTION - ONLY FOR ADMINS */}
            {isAdmin() && (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                <UsersIcon size={18} />
                            </div>
                            <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">CONTROL DE ACCESO</h2>
                        </div>
                    </div>

                    <div className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Gestión de Usuarios</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                Crea, modifica o elimina los accesos para el personal de tu taller.<br />
                                Define quién puede borrar datos o ver resúmenes de capital.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsUserModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-3"
                        >
                            <UsersIcon size={18} /> GESTIONAR PERSONAL
                        </button>
                    </div>
                </div>
            )}

            {/* EMAIL CONFIGURATION SECTION */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                            <Mail size={18} />
                        </div>
                        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">CONFIGURACIÓN DE EMAIL</h2>
                    </div>
                </div>

                <form onSubmit={handleSaveEmail} className="p-10 space-y-10">
                    <div className="flex items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="space-y-1 flex-1">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest italic">Habilitar Funcionalidad de Email</h3>
                            <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">Activa esta opción para poder enviar facturas manualmente por correo.</p>
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                                const current = String(settings.smtp_enabled) === 'true';
                                const newVal = current ? 'false' : 'true';
                                setSettings(prev => ({ ...prev, smtp_enabled: newVal }));
                            }}
                            className={cn(
                                "w-20 h-10 rounded-full p-1 transition-all duration-300 shadow-inner overflow-hidden flex",
                                String(settings.smtp_enabled) === 'true' ? 'bg-purple-500' : 'bg-slate-200 dark:bg-slate-800'
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full bg-white shadow-lg transition-all duration-300",
                                String(settings.smtp_enabled) === 'true' ? 'ml-10' : 'ml-0'
                            )} />
                        </button>
                    </div>

                    {(settings.smtp_enabled === true || settings.smtp_enabled === 'true') && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-6">
                                <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">📧 Guía Rápida</h4>
                                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Para usar <strong>Gmail</strong>: servidor <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded">smtp.gmail.com</code>, puerto <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded">587</code>.
                                    Necesitarás crear una <strong>"Contraseña de Aplicación"</strong> desde la configuración de seguridad de tu cuenta de Google.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 ml-2 block italic">Servidor SMTP</label>
                                    <input
                                        type="text"
                                        className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 dark:text-white font-bold"
                                        value={settings.smtp_host}
                                        onChange={e => setSettings({ ...settings, smtp_host: e.target.value })}
                                        placeholder="smtp.gmail.com"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 ml-2 block italic">Puerto</label>
                                    <input
                                        type="number"
                                        className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 dark:text-white font-black"
                                        value={settings.smtp_port}
                                        onChange={e => setSettings({ ...settings, smtp_port: e.target.value })}
                                        placeholder="587"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 ml-2 block italic">Usuario / Email de Envío</label>
                                <input
                                    type="email"
                                    className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 dark:text-white font-bold"
                                    value={settings.smtp_user}
                                    onChange={e => setSettings({ ...settings, smtp_user: e.target.value })}
                                    placeholder="tu-email@gmail.com"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 ml-2 block italic">Contraseña SMTP</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full px-8 py-5 pr-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 dark:text-white font-mono"
                                        value={settings.smtp_password}
                                        onChange={e => setSettings({ ...settings, smtp_password: e.target.value })}
                                        placeholder="••••••••••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 ml-2 block italic">Nombre del Remitente</label>
                                <input
                                    type="text"
                                    className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 dark:text-white font-bold uppercase"
                                    value={settings.smtp_from_name}
                                    onChange={e => setSettings({ ...settings, smtp_from_name: e.target.value })}
                                    placeholder="NOMBRE DE TU TALLER"
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                            type="submit"
                            className="flex items-center gap-4 bg-purple-600 hover:bg-purple-700 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-purple-500/20 active:scale-95 transition-all group"
                        >
                            <Save size={20} className="group-hover:rotate-12 transition-transform" /> GUARDAR CONFIGURACIÓN EMAIL
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <Info size={24} />
                </div>
                <div>
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3 italic">
                        <Globe size={14} className="text-blue-500" /> Sistema Local & Nube
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        Recuerda que si usas Google Drive, tus datos se sincronizan solos, pero estas copias físicas son tu seguro de vida.
                    </p>
                </div>
            </div>
            
            <UserManagementModal 
                isOpen={isUserModalOpen} 
                onClose={() => setIsUserModalOpen(false)} 
            />
        </div >
    );
}
