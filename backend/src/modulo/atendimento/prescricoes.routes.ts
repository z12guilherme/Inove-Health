import { Router, Request, Response } from 'express';
import { baixarEstoque } from '../estoque/insumos.routes';

const router = Router();

interface Prescricao {
    id: string;
    paciente_id: string;
    medico_id: string;
    itens: { nome: string; dose: string; quantidade: number }[];
    status: string;
    criado_em: string;
}

let prescricoes: Prescricao[] = [];

router.get('/', (req: Request, res: Response) => {
    res.json({ prescricoes });
});

router.get('/paciente/:id', (req: Request, res: Response) => {
    res.json({ prescricoes: prescricoes.filter(p => p.paciente_id === req.params.id) });
});

router.post('/', (req: Request, res: Response) => {
    const { paciente_id, medico_id, itens } = req.body;

    const nova: Prescricao = {
        id: Date.now().toString(),
        paciente_id,
        medico_id,
        itens: itens || [],
        status: 'Ativa',
        criado_em: new Date().toISOString()
    };

    // Lógica de Baixa Automática de Estoque
    if (itens && Array.isArray(itens)) {
        itens.forEach(item => {
            // Tenta baixar do estoque baseado no nome do medicamento
            baixarEstoque(item.nome, item.quantidade || 1);
        });
    }

    prescricoes.push(nova);
    res.status(201).json(nova);
});

export default router;