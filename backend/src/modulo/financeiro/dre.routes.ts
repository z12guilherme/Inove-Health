import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.json({
        periodo: 'Maio/2026',
        receitas: {
            consultas_particulares: 15000,
            convenios: 45000,
            outras_receitas: 2000,
            total: 62000,
        },
        despesas: {
            salarios: 25000,
            aluguel: 5000,
            insumos: 8000,
            outras_despesas: 3000,
            total: 41000,
        },
        lucro_liquido: 21000,
    });
});

export default router;