import { Router, Request, Response } from 'express';

const router = Router();

let pacientes = [
    { id: '1', nome: 'Maria Silva Costa', data_nascimento: '1979-05-12', sexo: 'F', cpf: '111.222.333-44', status: 'Em Atendimento', risco: 'amarelo' },
    { id: '2', nome: 'João Pedro Alves', data_nascimento: '1995-10-23', sexo: 'M', cpf: '555.666.777-88', status: 'Aguardando Triagem', risco: 'verde' }
];

router.get('/', (req: Request, res: Response) => {
    res.json({ pacientes });
});

router.get('/:id', (req: Request, res: Response) => {
    const paciente = pacientes.find(p => p.id === req.params.id);
    res.json({ paciente: paciente || {} });
});

router.post('/', (req: Request, res: Response) => {
    const novo = { id: Date.now().toString(), status: 'Aguardando Triagem', ...req.body };
    pacientes.push(novo);
    res.status(201).json(novo);
});

router.get('/:id/historico', (req: Request, res: Response) => {
    res.json({ triagens: [], consultas: [], prescricoes: [] });
});

export default router;