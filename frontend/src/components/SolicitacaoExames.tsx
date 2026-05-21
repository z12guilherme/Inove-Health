import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Beaker, Send, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SolicitacaoExamesProps {
    pacienteId: string;
    medicoId: string;
}

const EXAMES_COMUNS = [
    { id: 'hc', nome: 'Hemograma Completo' },
    { id: 'gl', nome: 'Glicose em Jejum' },
    { id: 'cr', nome: 'Creatinina' },
    { id: 'ur', nome: 'Ureia' },
    { id: 'tgo', nome: 'TGO (AST)' },
    { id: 'tgp', nome: 'TGP (ALT)' },
    { id: 'col', nome: 'Colesterol Total e Frações' },
    { id: 'tri', nome: 'Triglicerídeos' },
    { id: 'tsa', nome: 'TSH e T4 Livre' },
    { id: 'eas', nome: 'Sumário de Urina (EAS)' },
    { id: 'rx', nome: 'Raio-X de Tórax' },
    { id: 'ecg', nome: 'Eletrocardiograma (ECG)' },
];

export function SolicitacaoExames({ pacienteId, medicoId }: SolicitacaoExamesProps) {
    const [selectedExams, setSelectedExams] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const filteredExams = EXAMES_COMUNS.filter(exame =>
        exame.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleExam = (examName: string) => {
        setSelectedExams(prev =>
            prev.includes(examName)
                ? prev.filter(e => e !== examName)
                : [...prev, examName]
        );
    };

    const handleSolicitar = async () => {
        if (selectedExams.length === 0) {
            toast.error("Por favor, selecione ao menos um exame.");
            return;
        }

        setLoading(true);
        try {
            await api.post('/laboratorio/exames/solicitar', {
                paciente_id: pacienteId,
                medico_id: medicoId,
                procedimentos: selectedExams
            });

            toast.success("Solicitação de exames enviada para o laboratório.");
            setSelectedExams([]);
            setSearchTerm('');
        } catch (error) {
            console.error('Erro ao solicitar exames:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-xl border-slate-200 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                    <Beaker className="h-5 w-5 text-indigo-600" />
                    Solicitação de Exames
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar exame pelo nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 rounded-xl border-slate-200 focus:ring-indigo-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredExams.map((exame) => (
                        <div
                            key={exame.id}
                            className={`flex items-center space-x-3 p-3.5 rounded-xl border transition-all cursor-pointer group ${selectedExams.includes(exame.nome)
                                ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                                : 'bg-white border-slate-200 hover:border-indigo-300'
                                }`}
                            onClick={() => toggleExam(exame.nome)}
                        >
                            <Checkbox
                                id={exame.id}
                                checked={selectedExams.includes(exame.nome)}
                                onCheckedChange={() => toggleExam(exame.nome)}
                                className="data-[state=checked]:bg-indigo-600 rounded-full border-slate-300"
                            />
                            <Label
                                htmlFor={exame.id}
                                className="flex-1 cursor-pointer text-sm font-semibold text-slate-700 group-hover:text-indigo-700"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {exame.nome}
                            </Label>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t bg-slate-50/50 p-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {selectedExams.length} Selecionados
                </div>
                <Button
                    onClick={handleSolicitar}
                    disabled={loading || selectedExams.length === 0}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 shadow-lg shadow-indigo-100 font-bold"
                >
                    {loading ? "Processando..." : (
                        <span className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Enviar Solicitação
                        </span>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}