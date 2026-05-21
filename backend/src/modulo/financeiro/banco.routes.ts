import { Router, Request, Response } from 'express';

const router = Router();

router.get('/conciliacao', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        data: 'Conciliação bancária simulada para o período de 01/05 a 20/05.',
        transacoes_pendentes: 5,
        transacoes_conciliadas: 25,
    });
});

router.post('/gerar-boleto', (req: Request, res: Response) => {
    const { valor, pagador } = req.body;
    res.status(201).json({
        message: `Boleto de R$ ${valor} gerado com sucesso para ${pagador}.`,
        codigo_barras: `34191.00000 00000.000000 00000.000000 9 00000000000000`,
        link_pagamento: `https://banco.com/boleto/${Date.now()}`,
    });
});

router.post('/gerar-pix', (req: Request, res: Response) => {
    const { valor, pagador } = req.body;
    res.status(201).json({ message: `PIX de R$ ${valor} gerado com sucesso para ${pagador}.`, qr_code: 'base64_image_data_mock', chave_copia_cola: '00020126330014BR.GOV.BCB.PIX011112345678901' });
});

export default router;