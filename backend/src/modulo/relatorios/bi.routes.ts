import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/relatorios/bi - Retorna indicadores consolidados para o Dashboard
router.get('/', (req: Request, res: Response) => {
    res.json({
        atendimentos_mes: [
            { nome: 'Semana 1', total: 450 },
            { nome: 'Semana 2', total: 520 },
            { nome: 'Semana 3', total: 610 },
            { nome: 'Semana 4', total: 480 },
        ],
        distribuicao_risco: [
            { name: 'Emergência', value: 15, color: '#ef4444' },
            { name: 'Muito Urgente', value: 25, color: '#f97316' },
            { name: 'Urgente', value: 40, color: '#eab308' },
            { name: 'Pouco Urgente', value: 120, color: '#22c55e' },
            { name: 'Não Urgente', value: 250, color: '#3b82f6' },
        ],
        tempo_medio_espera: '18 min',
        taxa_ocupacao: '72%',
        consumo_insumos_abc: [
            { nome: 'Luva Nitrílica', consumo: 1500, custo: 480.00 },
            { nome: 'Soro Fisiológico', consumo: 800, custo: 320.00 }
        ]
    });
});

export default router;