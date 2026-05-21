import { Router, Request, Response } from 'express';

const router = Router();

interface Conta {
    id: string;
    descricao: string;
    tipo: 'PAGAR' | 'RECEBER';
    valor: number;
    data_vencimento: string;
    data_pagamento?: string;
    status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
    criado_em: string;
}

let contas: Conta[] = [
    { id: '1', descricao: 'Aluguel Unidade Central', tipo: 'PAGAR', valor: 5000, data_vencimento: '2026-05-25', status: 'PENDENTE', criado_em: '2026-05-01' },
    { id: '2', descricao: 'Consulta Particular Maria', tipo: 'RECEBER', valor: 300, data_vencimento: '2026-05-20', data_pagamento: '2026-05-19', status: 'PAGO', criado_em: '2026-05-15' },
    { id: '3', descricao: 'Salários Equipe Médica', tipo: 'PAGAR', valor: 25000, data_vencimento: '2026-05-30', status: 'PENDENTE', criado_em: '2026-05-01' },
    { id: '4', descricao: 'Convênio Unimed - Abril', tipo: 'RECEBER', valor: 15000, data_vencimento: '2026-05-10', status: 'ATRASADO', criado_em: '2026-04-20' },
];

router.get('/', (req: Request, res: Response) => {
    res.json({ contas });
});

router.post('/', (req: Request, res: Response) => {
    const novaConta: Conta = {
        id: Date.now().toString(),
        status: 'PENDENTE',
        criado_em: new Date().toISOString(),
        ...req.body,
    };
    contas.push(novaConta);
    res.status(201).json(novaConta);
});

router.put('/:id', (req: Request, res: Response) => {
    const index = contas.findIndex(c => c.id === req.params.id);
    if (index !== -1) {
        contas[index] = { ...contas[index], ...req.body };
        res.json(contas[index]);
    } else {
        res.status(404).json({ message: 'Conta não encontrada' });
    }
});

router.delete('/:id', (req: Request, res: Response) => {
    const index = contas.findIndex(c => c.id === req.params.id);
    if (index !== -1) {
        contas.splice(index, 1); // Exclusão física para mock
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Conta não encontrada' });
    }
});

export default router;