import { Router, Request, Response } from 'express';

const router = Router();

let convenios = [
    { id: '1', nome: 'Unimed Nacional', registro_ans: '354801', tipo: 'COOPERATIVA', email: 'credenciamento@unimed.com.br', telefone: '0800 722 0022', cobertura: 'COMPLETO', tabela_preco: 'TISS', ativo: true, criado_em: '2025-01-10' },
    { id: '2', nome: 'Amil Saúde', registro_ans: '326305', tipo: 'PLANO_SAUDE', email: 'redes@amil.com.br', telefone: '0800 202 6001', cobertura: 'AMBULATORIAL_HOSPITALAR', tabela_preco: 'TUSS', ativo: true, criado_em: '2025-01-15' },
];

router.get('/', (req: Request, res: Response) => {
    res.json({ convenios: convenios.filter(c => c.ativo) });
});

router.post('/', (req: Request, res: Response) => {
    const novo = {
        id: Date.now().toString(),
        ativo: true,
        criado_em: new Date().toISOString(),
        ...req.body
    };
    convenios.push(novo);
    res.status(201).json(novo);
});

router.put('/:id', (req: Request, res: Response) => {
    const index = convenios.findIndex(c => c.id === req.params.id);
    if (index !== -1) {
        convenios[index] = { ...convenios[index], ...req.body };
        res.json(convenios[index]);
    } else {
        res.status(404).json({ message: 'Convênio não encontrado' });
    }
});

router.delete('/:id', (req: Request, res: Response) => {
    const index = convenios.findIndex(c => c.id === req.params.id);
    if (index !== -1) {
        convenios[index].ativo = false;
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Convênio não encontrado' });
    }
});

export default router;