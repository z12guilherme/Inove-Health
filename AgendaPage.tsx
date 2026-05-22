import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const AgendaPage: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Mock de agendamentos
    const appointments = [
        { id: 1, patient: "João Silva", time: "09:00", type: "Consulta Geral", status: "Confirmado", color: "bg-blue-500" },
        { id: 2, patient: "Maria Oliveira", time: "10:30", type: "Retorno", status: "Em Espera", color: "bg-yellow-500" },
        { id: 3, patient: "Carlos Souza", time: "14:00", type: "Exame Laboratorial", status: "Agendado", color: "bg-purple-500" },
    ];

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Agenda Centralizada</h1>
                    <p className="text-gray-500 text-sm">Gerencie horários de consultas, exames e procedimentos.</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-md">
                    <Plus size={18} />
                    <span>Novo Agendamento</span>
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Mini Calendário e Filtros */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-700">Janeiro 2026</h3>
                            <div className="flex gap-1">
                                <button className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={16} /></button>
                                <button className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <span key={d} className="text-gray-400 font-medium">{d}</span>)}
                            {/* Exemplo simplificado de grid de dias */}
                            {Array.from({ length: 31 }).map((_, i) => (
                                <button key={i} className={`p-2 rounded-md hover:bg-blue-50 transition-colors ${i === 4 ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Filter size={16} /> Filtros
                        </h3>
                        <select className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                            <option>Todas as Unidades</option>
                            <option>Hospital Central</option>
                            <option>UPA Norte</option>
                        </select>
                        <select className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                            <option>Todos os Profissionais</option>
                            <option>Dr. Cláudio (Médico)</option>
                            <option>Enf. Sara (Triagem)</option>
                        </select>
                    </div>
                </div>

                {/* Visualização da Agenda do Dia */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Hoje, 05 de Jan</span>
                                <span>Segunda-feira</span>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar paciente..."
                                    className="pl-10 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {appointments.map((apt) => (
                                <div key={apt.id} className="p-4 flex items-center hover:bg-gray-50 transition-colors group">
                                    <div className="w-20 flex flex-col items-center justify-center border-r border-gray-100 pr-4">
                                        <span className="text-lg font-bold text-gray-700">{apt.time}</span>
                                        <Clock size={14} className="text-gray-400" />
                                    </div>
                                    <div className="flex-1 px-6">
                                        <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{apt.patient}</h4>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">{apt.type}</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${apt.color}`}></span>
                                            <span className="text-sm text-gray-600">{apt.status}</span>
                                        </div>
                                        <button className="text-blue-600 hover:underline text-sm font-medium">Detalhes</button>
                                    </div>
                                </div>
                            ))}
                            {appointments.length === 0 && (
                                <div className="p-12 text-center text-gray-400">
                                    <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Nenhum agendamento para este período.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgendaPage;