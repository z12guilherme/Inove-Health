import { Router, Request, Response } from 'express';

const router = Router();

let guias = [
    {
        id: "GUI-1050",
        tipo: "CONSULTA",
        paciente: "João da Silva",
        convenio: "Unimed",
        dataEmissao: new Date().toISOString(),
        status: "AUTORIZADA",
        valorTotal: 120.00,
        senhaAutorizacao: "A1B2C3D4"
    },
    {
        id: "GUI-1051",
        tipo: "SADT", // Serviço de Apoio Diagnóstico Terapêutico (Exames)
        paciente: "Maria Oliveira",
        convenio: "Bradesco Saúde",
        dataEmissao: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        status: "PENDENTE",
        valorTotal: 95.00,
        senhaAutorizacao: null
    },
    {
        id: "GUI-1052",
        tipo: "CONSULTA",
        paciente: "Roberto Santos",
        convenio: "Amil",
        dataEmissao: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
        status: "FATURADA", // Já foi num lote
        valorTotal: 100.00,
        senhaAutorizacao: "X9Y8Z7"
    }
];

router.get('/', (req: Request, res: Response) => {
    res.json(guias);
});

// Simula solicitar autorização ao convênio
router.post('/:id/autorizar', (req: Request, res: Response) => {
    const index = guias.findIndex(g => g.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Guia não encontrada" });

    guias[index].status = "AUTORIZADA";
    guias[index].senhaAutorizacao = Math.random().toString(36).substring(2, 10).toUpperCase();

    res.json(guias[index]);
});

export default router;
