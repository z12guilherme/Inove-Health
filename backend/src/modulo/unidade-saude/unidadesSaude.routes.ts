import { Router, Request, Response } from 'express';

const router = Router();

interface Unidade {
    id: string;
    nome: string;
    tipo: string;
    endereco: string;
    telefone: string;
    capacidade_leitos: number;
    ativo: boolean;
    criado_em: string;
}

// Dados em memória para simular o banco de dados
let unidades: Unidade[] = [
    { id: '1', nome: 'UPA Centro', tipo: 'UPA', endereco: 'Rua Principal, 100', telefone: '(11) 1111-1111', capacidade_leitos: 50, ativo: true, criado_em: new Date().toISOString() },
    { id: '2', nome: 'Hospital Municipal', tipo: 'HOSPITAL', endereco: 'Av. Secundária, 200', telefone: '(22) 2222-2222', capacidade_leitos: 200, ativo: true, criado_em: new Date().toISOString() },
];

// Simula um atraso de rede para todas as respostas
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// GET /api/unidades-saude - Lista todas as unidades ativas
router.get('/', async (req: Request, res: Response) => {
    await simulateDelay(500);
    res.json(unidades.filter(u => u.ativo));
});

// GET /api/unidades-saude/:id - Detalhes de uma unidade específica
router.get('/:id', async (req: Request, res: Response) => {
    await simulateDelay(500);
    const unidade = unidades.find(u => u.id === req.params.id && u.ativo);
    if (unidade) {
        res.json(unidade);
    } else {
        res.status(404).json({ message: 'Unidade não encontrada' });
    }
});

// POST /api/unidades-saude - Cria uma nova unidade
router.post('/', async (req: Request, res: Response) => {
    await simulateDelay(500);
    const novaUnidade: Unidade = {
        id: Date.now().toString(), // Geração de ID simples para mock
        ativo: true,
        criado_em: new Date().toISOString(),
        ...req.body,
    };
    unidades.push(novaUnidade);
    res.status(201).json(novaUnidade);
});

// PUT /api/unidades-saude/:id - Atualiza uma unidade existente
router.put('/:id', async (req: Request, res: Response) => {
    await simulateDelay(500);
    const index = unidades.findIndex(u => u.id === req.params.id && u.ativo);
    if (index !== -1) {
        unidades[index] = { ...unidades[index], ...req.body };
        res.json(unidades[index]);
    } else {
        res.status(404).json({ message: 'Unidade não encontrada' });
    }
});

// DELETE /api/unidades-saude/:id - Soft delete de uma unidade
router.delete('/:id', async (req: Request, res: Response) => {
    await simulateDelay(500);
    const index = unidades.findIndex(u => u.id === req.params.id);
    if (index !== -1) {
        unidades[index].ativo = false; // Soft delete
        res.status(204).send(); // No content
    } else {
        res.status(404).json({ message: 'Unidade não encontrada' });
    }
});

// GET /api/unidades-saude/:id/funcionarios - Placeholder para listar funcionários
router.get('/:id/funcionarios', async (req: Request, res: Response) => {
    await simulateDelay(500);
    res.json([]); // Retorna um array vazio por enquanto
});

// POST /api/unidades-saude/:id/funcionarios/:funcId - Placeholder para associar funcionário
router.post('/:id/funcionarios/:funcId', async (req: Request, res: Response) => {
    await simulateDelay(500);
    res.status(200).json({ message: `Funcionário ${req.params.funcId} associado à unidade ${req.params.id}` });
});

export default router;