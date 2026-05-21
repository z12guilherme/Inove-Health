import { Router, Request, Response } from 'express';

const router = Router();

let fornecedores = [
    { id: '1', razao_social: 'MedPharma Distribuidora Ltda', nome_fantasia: 'MedPharma', cnpj: '12.345.678/0001-90', email: 'vendas@medpharma.com.br', telefone: '(11) 3456-7890', categoria: 'MEDICAMENTOS', ativo: true, criado_em: new Date().toISOString() },
    { id: '2', razao_social: 'HospMat Materiais Hospitalares S.A.', nome_fantasia: 'HospMat', cnpj: '98.765.432/0001-10', email: 'contato@hospmat.com.br', telefone: '(21) 2345-6789', categoria: 'MATERIAIS_HOSPITALARES', ativo: true, criado_em: new Date().toISOString() }
];

router.get('/', (req: Request, res: Response) => {
    res.json({ fornecedores: fornecedores.filter(f => f.ativo) });
});

router.post('/', (req: Request, res: Response) => {
    const novo = { id: Date.now().toString(), ativo: true, criado_em: new Date().toISOString(), ...req.body };
    fornecedores.push(novo);
    res.status(201).json(novo);
});

router.put('/:id', (req: Request, res: Response) => {
    const index = fornecedores.findIndex(f => f.id === req.params.id);
    if (index !== -1) {
        fornecedores[index] = { ...fornecedores[index], ...req.body };
        res.json(fornecedores[index]);
    } else {
        res.status(404).json({ message: 'Fornecedor não encontrado' });
    }
});

router.delete('/:id', (req: Request, res: Response) => {
    const index = fornecedores.findIndex(f => f.id === req.params.id);
    if (index !== -1) {
        fornecedores[index].ativo = false;
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Fornecedor não encontrado' });
    }
});

export default router;