import { Router, Request, Response } from 'express';

const router = Router();

let glosas = [
    {
        id: "GLO-001",
        guiaId: "GUI-1010",
        paciente: "Fernando Costa",
        convenio: "Bradesco Saúde",
        dataRetorno: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
        motivo: "1001 - Senha de autorização informada inválida.",
        valorGlosado: 150.00,
        status: "PENDENTE_RECURSO"
    },
    {
        id: "GLO-002",
        guiaId: "GUI-0955",
        paciente: "Carla Mendes",
        convenio: "Unimed",
        dataRetorno: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
        motivo: "1014 - Procedimento não autorizado para o beneficiário.",
        valorGlosado: 350.00,
        status: "RECURSO_ENVIADO"
    }
];

router.get('/', (req: Request, res: Response) => {
    res.json(glosas);
});

// Envia recurso para uma glosa
router.post('/:id/recurso', (req: Request, res: Response) => {
    const { justificativa } = req.body;
    const index = glosas.findIndex(g => g.id === req.params.id);
    
    if (index === -1) return res.status(404).json({ message: "Glosa não encontrada" });

    glosas[index].status = "RECURSO_ENVIADO";
    // Na vida real salvaria a justificativa no banco

    res.json(glosas[index]);
});

export default router;
