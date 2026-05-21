import { Router, Request, Response } from 'express';

const router = Router();

interface Exame {
    id: string;
    paciente_id: string;
    medico_id: string;
    procedimentos: string[];
    status: 'SOLICITADO' | 'COLETADO' | 'EM_ANALISE' | 'LAUDADO';
    laudo?: string;
    data_solicitacao: string;
    data_coleta?: string;
    data_laudo?: string;
}

let exames: Exame[] = [
    { id: '1', paciente_id: '1', medico_id: 'mock-1', procedimentos: ['Hemograma Completo', 'Glicose'], status: 'SOLICITADO', data_solicitacao: new Date().toISOString() }
];

// GET /api/laboratorio/exames/pendentes - Lista exames aguardando coleta
router.get('/pendentes', (req: Request, res: Response) => {
    res.json({ exames: exames.filter(e => e.status === 'SOLICITADO') });
});

// POST /api/laboratorio/exames/solicitar - Médico solicita exames
router.post('/solicitar', (req: Request, res: Response) => {
    const novo: Exame = {
        id: Date.now().toString(),
        status: 'SOLICITADO',
        data_solicitacao: new Date().toISOString(),
        ...req.body
    };
    exames.push(novo);
    res.status(201).json(novo);
});

// POST /api/laboratorio/exames/:id/coletar - Enfermagem registra coleta
router.post('/:id/coletar', (req: Request, res: Response) => {
    const index = exames.findIndex(e => e.id === req.params.id);
    if (index !== -1) {
        exames[index].status = 'COLETADO';
        exames[index].data_coleta = new Date().toISOString();
        return res.json(exames[index]);
    }
    res.status(404).json({ message: 'Exame não encontrado' });
});

// POST /api/laboratorio/exames/:id/laudo - Registro manual de laudo
router.post('/:id/laudo', (req: Request, res: Response) => {
    const index = exames.findIndex(e => e.id === req.params.id);
    if (index !== -1) {
        exames[index].status = 'LAUDADO';
        exames[index].laudo = req.body.laudo;
        exames[index].data_laudo = new Date().toISOString();
        return res.json(exames[index]);
    }
    res.status(404).json({ message: 'Exame não encontrado' });
});

// POST /api/laboratorio/exames/lis-webhook - Integração externa LIS
router.post('/lis-webhook', (req: Request, res: Response) => {
    const { external_id, laudo_texto } = req.body;
    // Simulando busca pelo ID enviado pelo sistema externo
    const index = exames.findIndex(e => e.id === external_id);
    if (index !== -1) {
        exames[index].status = 'LAUDADO';
        exames[index].laudo = laudo_texto;
        exames[index].data_laudo = new Date().toISOString();
        console.log(`[LIS] Laudo recebido para exame ${external_id}`);
        return res.json({ success: true });
    }
    res.status(404).json({ message: 'Exame não localizado no sistema' });
});

export default router;