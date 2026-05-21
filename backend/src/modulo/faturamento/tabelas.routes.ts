import { Router, Request, Response } from 'express';

const router = Router();

const tabelas = [
    {
        id: "TAB-001",
        convenio: "Unimed",
        tipo: "TUSS",
        vigenciaInicio: "2026-01-01",
        vigenciaFim: "2026-12-31",
        status: "ATIVA",
        itens: [
            { codigo: "10101012", descricao: "Consulta em consultório (no horário normal ou preestabelecido)", valor: 120.00 },
            { codigo: "20104235", descricao: "Terapia inalatória - por sessão", valor: 45.00 },
            { codigo: "40811018", descricao: "Radiografia de tórax (PA e Perfil)", valor: 85.00 }
        ]
    },
    {
        id: "TAB-002",
        convenio: "Bradesco Saúde",
        tipo: "TUSS",
        vigenciaInicio: "2026-03-01",
        vigenciaFim: "2027-02-28",
        status: "ATIVA",
        itens: [
            { codigo: "10101012", descricao: "Consulta em consultório", valor: 150.00 },
            { codigo: "40811018", descricao: "Radiografia de tórax (PA e Perfil)", valor: 95.00 }
        ]
    },
    {
        id: "TAB-003",
        convenio: "SUS",
        tipo: "SIGTAP",
        vigenciaInicio: "2026-01-01",
        vigenciaFim: "2026-12-31",
        status: "ATIVA",
        itens: [
            { codigo: "0301010072", descricao: "Consulta Médica em Atenção Especializada", valor: 10.00 },
            { codigo: "0204030170", descricao: "Radiografia de Tórax", valor: 9.50 }
        ]
    }
];

router.get('/', (req: Request, res: Response) => {
    res.json(tabelas);
});

export default router;
