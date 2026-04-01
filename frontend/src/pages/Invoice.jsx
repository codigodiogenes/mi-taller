/**
 * Componente: Invoice (Factura)
 * Descripción: Plantilla visual para renderizar la factura de una reparación,
 * preparada para ser impresa o guardada/enviada como PDF.
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Printer } from 'lucide-react';
import api from '../lib/api';

export default function Invoice() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailConfig, setEmailConfig] = useState({
        manualEmail: '',
        useClient: true,
        useManual: false
    });

    useEffect(() => {
        fetchInvoiceData();
    }, [id]);

    const fetchInvoiceData = async () => {
        try {
            console.log("Fetching invoice for ID:", id);
            const [repairRes, settingsRes] = await Promise.all([
                api.get(`/repairs/${id}`),
                api.get('/settings')
            ]);

            const repair = repairRes.data;
            if (!repair) {
                console.error("No repair data found in response");
                setLoading(false);
                return;
            }

            const settingsObj = {};
            if (Array.isArray(settingsRes.data)) {
                settingsRes.data.forEach(s => settingsObj[s.key] = s.value);
            }

            // The repair object now comes with motorcycle and client thanks to eager loading
            const moto = repair.motorcycle;
            // Client can be direct or from moto owner
            const client = repair.client || (moto ? moto.owner : null);

            console.log("Invoice data prepared:", { repair, moto, client });
            setData({ repair, moto, client, settings: settingsObj });

        } catch (error) {
            console.error("Error fetching invoice data:", error);
            alert("Error al cargar la factura. Revisa la consola o la conexión.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Preparando Documento...</p>
        </div>
    );

    if (!data || !data.repair) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-10 text-center">
            <h2 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Orden no encontrada</h2>
            <p className="text-slate-500 mb-6">No se ha podido recuperar la información de la reparación #{id}</p>
            <button onClick={() => window.close()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest">Cerrar Ventana</button>
        </div>
    );

    const { repair, moto, client, settings } = data;

    return (
        <div className="max-w-3xl mx-auto bg-white p-12 min-h-screen text-slate-800 print:p-0">
            <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">{settings.workshop_name || "Taller de Motos"}</h1>
                    <div className="text-slate-500 text-sm space-y-1">
                        {settings.workshop_address && <p>{settings.workshop_address}</p>}
                        {settings.workshop_phone && <p>Tel: {settings.workshop_phone}</p>}
                        {settings.workshop_email && <p>{settings.workshop_email}</p>}
                        {!settings.workshop_address && !settings.workshop_phone && <p>Factura / Orden de Reparación</p>}
                    </div>
                </div>
                {settings.logo_url && (
                    <img
                        src={settings.logo_url.startsWith('http') ? settings.logo_url : `${api.defaults.baseURL}${settings.logo_url}`}
                        alt="Logo"
                        className="h-20 object-contain"
                    />
                )}
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Cliente</h3>
                    {client ? (
                        <div>
                            <p className="font-bold text-lg">{client.name}</p>
                            <p>{client.phone}</p>
                            <p className="text-slate-500">{client.email}</p>
                            <p className="text-slate-500">{client.address}</p>
                        </div>
                    ) : <p>Cliente desconocido</p>}
                </div>
                <div className="text-right">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Detalles</h3>
                    <p><span className="font-medium">Orden #:</span> {repair.id.toString().padStart(6, '0')}</p>
                    <p><span className="font-medium">Fecha:</span> {new Date(repair.entry_date).toLocaleDateString()}</p>
                    <div className="mt-4">
                        {moto ? (
                            <>
                                <p className="font-medium">Vehículo</p>
                                <p>{moto.brand} {moto.model}</p>
                                <p className="uppercase">{moto.plate}</p>
                            </>
                        ) : (
                            <p className="font-medium italic text-slate-400">Venta Directa de Material/Servicio</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Descripción / Servicios</h3>
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 mb-6">
                    <p className="whitespace-pre-wrap font-medium text-lg leading-relaxed">{repair.description}</p>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="py-3 font-bold text-slate-900">Concepto / Pieza</th>
                            <th className="py-3 font-bold text-slate-900 text-center w-20">Cant.</th>
                            <th className="py-3 font-bold text-slate-900 text-right w-28">P. Unit</th>
                            <th className="py-3 font-bold text-slate-900 text-right w-28">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {repair.items.map(item => (
                            <tr key={item.id}>
                                <td className="py-3 text-slate-700">{item.description}</td>
                                <td className="py-3 text-center text-slate-500">{item.quantity}</td>
                                <td className="py-3 text-right text-slate-500">€{(item.cost || 0).toFixed(2)}</td>
                                <td className="py-3 text-right text-slate-900 font-medium">€{((item.cost || 0) * (item.quantity || 1)).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-8">
                <div className="w-1/2 ml-auto">
                    <div className="flex justify-between items-center py-2 text-sm font-bold text-slate-500">
                        <span>Base Imponible</span>
                        <span>€{(repair.total_cost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-sm font-bold text-slate-500 border-b border-slate-200 mb-2">
                        <span>I.V.A (21%)</span>
                        <span>€{((repair.total_cost || 0) * 0.21).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-2xl font-bold text-slate-900">
                        <span>Total Factura</span>
                        <span>€{((repair.total_cost || 0) * 1.21).toFixed(2)}</span>
                    </div>
                    <div className={`text-right text-sm font-medium mt-2 ${repair.paid ? 'text-green-600' : 'text-red-500'}`}>
                        {repair.paid ? 'PAGADO' : 'PENDIENTE DE PAGO'}
                    </div>
                </div>
            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 text-center text-slate-400 text-sm print:hidden flex justify-center gap-4">
                <button
                    onClick={() => window.history.back()}
                    className="bg-white border border-slate-200 text-slate-600 px-8 py-3 rounded-xl hover:bg-slate-50 transition-all font-bold uppercase text-[10px] tracking-widest"
                >
                    Volver
                </button>
                <button
                    onClick={() => window.print()}
                    className="bg-slate-100 text-slate-900 px-8 py-3 rounded-xl hover:bg-slate-200 transition-all font-bold uppercase text-[10px] tracking-widest flex items-center gap-2"
                >
                    <Printer size={16} /> Imprimir
                </button>
                <button
                    onClick={() => {
                        setEmailConfig(prev => ({ ...prev, useClient: !!client?.email }));
                        setShowEmailModal(true);
                    }}
                    className="bg-purple-600 text-white px-8 py-3 rounded-xl hover:bg-purple-700 transition-all font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-purple-500/20 flex items-center gap-2"
                >
                    <Mail size={16} /> Enviar por Email
                </button>
            </div>

            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[300] p-4 print:hidden">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                        <div className="p-8 text-center bg-slate-50/50">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Mail size={24} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Enviar Factura Digital</h2>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-3">
                                {client?.email ? (
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${emailConfig.useClient ? "border-purple-500 bg-purple-50" : "border-slate-100"}`}>
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-purple-600"
                                            checked={emailConfig.useClient}
                                            onChange={e => setEmailConfig({ ...emailConfig, useClient: e.target.checked })}
                                        />
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Guardado</p>
                                            <p className="font-bold text-slate-800">{client.email}</p>
                                        </div>
                                    </label>
                                ) : (
                                    <div className="p-4 rounded-xl border-2 border-dashed border-slate-100 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        No hay email guardado para este cliente
                                    </div>
                                )}

                                <div className={`p-4 rounded-xl border-2 transition-all space-y-3 ${emailConfig.useManual ? "border-blue-500 bg-blue-50" : "border-slate-100"}`}>
                                    <label className="flex items-center gap-4 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600"
                                            checked={emailConfig.useManual}
                                            onChange={e => setEmailConfig({ ...emailConfig, useManual: e.target.checked })}
                                        />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Introducir manualmente</span>
                                    </label>
                                    {emailConfig.useManual && (
                                        <input
                                            type="email"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none font-bold text-sm"
                                            placeholder="ejemplo@email.com"
                                            value={emailConfig.manualEmail}
                                            onChange={e => setEmailConfig({ ...emailConfig, manualEmail: e.target.value })}
                                            autoFocus
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEmailModal(false)}
                                    className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={async () => {
                                        const recipients = [];
                                        if (emailConfig.useClient && client?.email) recipients.push(client.email);
                                        if (emailConfig.useManual && emailConfig.manualEmail) recipients.push(emailConfig.manualEmail);

                                        if (recipients.length === 0) {
                                            alert("Selecciona un destinatario.");
                                            return;
                                        }

                                        setSending(true);
                                        try {
                                            const res = await api.post(`/repairs/${id}/send-invoice`, { emails: recipients });
                                            alert(res.data.message);
                                            setShowEmailModal(false);
                                        } catch (error) {
                                            alert("Error: " + (error.response?.data?.detail || error.message));
                                        } finally {
                                            setSending(false);
                                        }
                                    }}
                                    disabled={sending}
                                    className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest"
                                >
                                    {sending ? 'Enviando...' : 'Enviar Ahora'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
