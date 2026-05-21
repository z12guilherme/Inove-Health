import { Router, Request, Response } from 'express';

const router = Router();

let custos = [
    { id: '1', descricao: 'Custo por Atendimento Médico', valor: 150.75, tipo: 'FIXO', referencia: 'Consulta', criado_em: '2026-01-01' },
    { id: '2', descricao: 'Custo por Exame Laboratorial', valor: 45.20, tipo: 'VARIAVEL', referencia: 'Hemograma', criado_em: '2026-01-01' },
    { id: '3', descricao: 'Custo por Leito/Dia', valor: 320.00, tipo: 'FIXO', referencia: 'Internação', criado_em: '2026-01-01' },
];

router.get('/', (req: Request, res: Response) => {
    res.json({ custos });
});

// Em um cenário real, haveria lógica para calcular custos por atendimento, etc.
// Por enquanto, apenas um mock simples de listagem.
router.get('/calculo-atendimento/:atendimentoId', (req: Request, res: Response) => {
    const custoTotal = (Math.random() * 200 + 100).toFixed(2); // Custo aleatório
    res.json({ atendimentoId: req.params.atendimentoId, custo_total: parseFloat(custoTotal), detalhes: custos });
});

export default router;