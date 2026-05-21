import { Router, Request, Response } from 'express';

const router = Router();

let insumos = [
    { id: '1', nome: 'Dipirona Sódica 500mg', codigo: 'MED-001', categoria: 'MEDICAMENTO', unidade_medida: 'CP', quantidade_atual: 2500, quantidade_minima: 500, lote: 'LOT-2026-A01', validade: '2027-06-15', fornecedor_nome: 'MedPharma', preco_unitario: 0.35, localizacao: 'Farmácia Central - Prat. A1', ativo: true, criado_em: '2025-01-10' },
    { id: '2', nome: 'Amoxicilina 875mg', codigo: 'MED-002', categoria: 'MEDICAMENTO', unidade_medida: 'CP', quantidade_atual: 180, quantidade_minima: 200, lote: 'LOT-2026-A02', validade: '2026-12-30', fornecedor_nome: 'MedPharma', preco_unitario: 1.20, localizacao: 'Farmácia Central - Prat. A2', ativo: true, criado_em: '2025-01-10' },
];

// Função exportada para permitir que o módulo de Prescrições realize a baixa automática
export const baixarEstoque = (nomeItem: string, quantidade: number) => {
    const index = insumos.findIndex(i => i.nome === nomeItem && i.ativo);
    if (index !== -1) {
        insumos[index].quantidade_atual = Math.max(0, insumos[index].quantidade_atual - quantidade);
        return true;
    }
    return false;
};

router.get('/', (req: Request, res: Response) => {
    res.json({ insumos: insumos.filter(i => i.ativo) });
});

// GET /api/estoque/insumos/alertas - Retorna itens com estoque baixo ou validade próxima
router.get('/alertas', (req: Request, res: Response) => {
    const hoje = new Date();
    const em30Dias = new Date();
    em30Dias.setDate(hoje.getDate() + 30);

    const alertas = insumos.filter(i => i.ativo).map(i => {
        const dataValidade = i.validade ? new Date(i.validade) : null;
        const critico_estoque = i.quantidade_atual <= i.quantidade_minima;
        const vencido = dataValidade ? dataValidade < hoje : false;
        const vence_proximo = dataValidade ? (dataValidade >= hoje && dataValidade <= em30Dias) : false;

        if (critico_estoque || vencido || vence_proximo) {
            return {
                ...i,
                status_alerta: {
                    estoque_baixo: critico_estoque,
                    vencido: vencido,
                    vence_proximo: vence_proximo
                }
            };
        }
        return null;
    }).filter(item => item !== null);

    res.json({ alerts: alertas });
});

// POST /api/estoque/insumos/entrada-nf - Registro de entrada por Nota Fiscal
router.post('/entrada-nf', (req: Request, res: Response) => {
    const { itens } = req.body; // Array de { id, quantidade, preco_unitario }

    if (itens && Array.isArray(itens)) {
        itens.forEach((entrada: any) => {
            const index = insumos.findIndex(i => i.id === entrada.id);
            if (index !== -1) {
                insumos[index].quantidade_atual += entrada.quantidade;
                if (entrada.preco_unitario) insumos[index].preco_unitario = entrada.preco_unitario;
            }
        });
        return res.json({ message: 'Entrada de NF processada com sucesso', insumos });
    }
    res.status(400).json({ message: 'Dados de entrada inválidos' });
});

// POST /api/estoque/insumos/inventario - Ajuste manual de inventário
router.post('/inventario', (req: Request, res: Response) => {
    const { id, nova_quantidade, motivo } = req.body;
    const index = insumos.findIndex(i => i.id === id);
    if (index !== -1) {
        insumos[index].quantidade_atual = nova_quantidade;
        return res.json({ message: `Inventário ajustado. Motivo: ${motivo}`, item: insumos[index] });
    }
    res.status(404).json({ message: 'Item não encontrado para ajuste' });
});

router.post('/', (req: Request, res: Response) => {
    const novo = {
        id: Date.now().toString(),
        ativo: true,
        criado_em: new Date().toISOString(),
        ...req.body
    };
    insumos.push(novo);
    res.status(201).json(novo);
});

router.put('/:id', (req: Request, res: Response) => {
    const index = insumos.findIndex(i => i.id === req.params.id);
    if (index !== -1) {
        insumos[index] = { ...insumos[index], ...req.body };
        res.json(insumos[index]);
    } else {
        res.status(404).json({ message: 'Insumo não encontrado' });
    }
});

router.delete('/:id', (req: Request, res: Response) => {
    const index = insumos.findIndex(i => i.id === req.params.id);
    if (index !== -1) {
        insumos[index].ativo = false;
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Insumo não encontrado' });
    }
});

export default router;