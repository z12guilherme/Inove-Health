import express, { Request, Response } from 'express';
import cors from 'cors';
import { router } from './modulo';
import unidadesSaudeRouter from './modulo/unidade-saude/unidadesSaude.routes';
import fornecedoresRouter from './modulo/cadastros/fornecedores.routes';
import conveniosRouter from './modulo/cadastros/convenios.routes';
import insumosRouter from './modulo/estoque/insumos.routes';
import prescricoesRouter from './modulo/atendimento/prescricoes.routes';
import contasRouter from './modulo/financeiro/contas.routes'; // Novo
import custosRouter from './modulo/financeiro/custos.routes'; // Novo
import bancoRouter from './modulo/financeiro/banco.routes'; // Novo
import dreRouter from './modulo/financeiro/dre.routes'; // Novo
import tabelasRouter from './modulo/faturamento/tabelas.routes';
import guiasRouter from './modulo/faturamento/guias.routes';
import lotesRouter from './modulo/faturamento/lotes.routes';
import glosasRouter from './modulo/faturamento/glosas.routes';
import examesRouter from './modulo/laboratorio/exames.routes';
import biRouter from './modulo/relatorios/bi.routes';

const app = express();

app.use(cors(
    { origin: '*' }
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api', router);

// Registro de Rotas conforme Documentação Oficial 3.2.0
// Estas rotas serão implementadas dentro de cada módulo futuramente

// 2.1 Autenticação
app.use('/api/auth', (req, res) => res.json({ message: "Módulo de Autenticação" }));
// 2.2 Consultas
app.use('/api/consultas', (req, res) => res.json({ message: "Módulo de Consultas" }));
// 2.3 Profissionais
app.use('/api/medicos', (req, res) => res.json({ message: "Módulo de Médicos" }));
app.use('/api/enfermeiros', (req, res) => res.json({ message: "Módulo de Enfermeiros" }));
// 2.4 Pacientes
app.use('/api/pacientes', (req, res) => res.json({ message: "Módulo de Pacientes" }));
// 2.5 & 2.6 Prescrições e Prontuários
app.use('/api/prescricoes', prescricoesRouter);
app.use('/api/prontuarios', (req, res) => res.json({ message: "Módulo de Prontuários" }));
// 2.7 Triagens
app.use('/api/triagens', (req, res) => res.json({ message: "Módulo de Triagens" })); // Mantém o placeholder por enquanto
app.use('/api/cadastros/fornecedores', fornecedoresRouter);
app.use('/api/cadastros/convenios', conveniosRouter);
app.use('/api/estoque/insumos', insumosRouter);
app.use('/api/financeiro/contas', contasRouter); // Novo
app.use('/api/financeiro/custos', custosRouter); // Novo
app.use('/api/financeiro/banco', bancoRouter); // Novo
app.use('/api/financeiro/dre', dreRouter); // Novo
app.use('/api/faturamento/tabelas', tabelasRouter);
app.use('/api/faturamento/guias', guiasRouter);
app.use('/api/faturamento/lotes', lotesRouter);
app.use('/api/faturamento/glosas', glosasRouter);
app.use('/api/laboratorio/exames', examesRouter);
app.use('/api/relatorios/bi', biRouter);

// 2.8 Unidades de Saúde (Agora usando o roteador dedicado)
app.use('/api/unidades-saude', unidadesSaudeRouter);
// 2.9 Inteligência Artificial
app.use('/api/ia', (req, res) => res.json({ message: "Módulo de IA" }));

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'API do Sistema Hospitalar está rodando!' });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;