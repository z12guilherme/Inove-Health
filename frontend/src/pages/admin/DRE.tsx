import { useState, useEffect } from 'react';
import { PieChart as PieChartIcon, TrendingUp, TrendingDown, DollarSign, Loader2, LineChart } from 'lucide-react';
import { api } from '../../lib/api';

interface DREData {
  mes: string;
  receitaBruta: number;
  deducoesImpostos: number;
  receitaLiquida: number;
  custosServicos: number;
  lucroBruto: number;
  despesasOperacionais: number;
  ebitda: number;
  depreciacaoAmortizacao: number;
  resultadoFinanceiro: number;
  lucroLiquido: number;
  historico: Array<{mes: string, receitas: number, custos: number, despesas: number, lucro: number}>;
}

export function DRE() {
  const [data, setData] = useState<DREData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDRE = async () => {
      try {
        const res = await api.get('/financeiro/dre');
        setData(res.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchDRE();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DRE Gerencial</h1>
        <p className="text-muted-foreground mt-2">Demonstrativo do Resultado do Exercício - {data.mes}</p>
      </div>

      {/* DRE Structure */}
      <div className="glass rounded-2xl p-6 overflow-x-auto">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="border-b border-border/50 text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="py-4 font-semibold">Descrição</th>
                  <th className="py-4 font-semibold text-right">Valor (R$)</th>
                  <th className="py-4 font-semibold text-right">% (Análise Vertical)</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
               <tr className="bg-primary/5 font-semibold">
                  <td className="py-3 px-2 flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Receita Operacional Bruta</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(data.receitaBruta)}</td>
                  <td className="py-3 px-2 text-right">100.0%</td>
               </tr>
               <tr className="text-muted-foreground text-sm">
                  <td className="py-3 px-2 pl-8">(-) Deduções e Impostos</td>
                  <td className="py-3 px-2 text-right text-destructive">{formatCurrency(data.deducoesImpostos)}</td>
                  <td className="py-3 px-2 text-right">{((data.deducoesImpostos / data.receitaBruta) * 100).toFixed(1)}%</td>
               </tr>
               <tr className="font-semibold text-primary">
                  <td className="py-3 px-2 pl-4">(=) Receita Operacional Líquida</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(data.receitaLiquida)}</td>
                  <td className="py-3 px-2 text-right">{((data.receitaLiquida / data.receitaBruta) * 100).toFixed(1)}%</td>
               </tr>
               <tr className="text-muted-foreground text-sm">
                  <td className="py-3 px-2 pl-8">(-) Custos dos Serviços Prestados (CSP)</td>
                  <td className="py-3 px-2 text-right text-destructive">{formatCurrency(data.custosServicos)}</td>
                  <td className="py-3 px-2 text-right">{((data.custosServicos / data.receitaBruta) * 100).toFixed(1)}%</td>
               </tr>
               <tr className="font-semibold text-amber-500 bg-amber-500/5">
                  <td className="py-3 px-2 pl-4">(=) Lucro Bruto</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(data.lucroBruto)}</td>
                  <td className="py-3 px-2 text-right">{((data.lucroBruto / data.receitaBruta) * 100).toFixed(1)}%</td>
               </tr>
               <tr className="text-muted-foreground text-sm">
                  <td className="py-3 px-2 pl-8">(-) Despesas Operacionais (Vendas/ADM)</td>
                  <td className="py-3 px-2 text-right text-destructive">{formatCurrency(data.despesasOperacionais)}</td>
                  <td className="py-3 px-2 text-right">{((data.despesasOperacionais / data.receitaBruta) * 100).toFixed(1)}%</td>
               </tr>
               <tr className="font-semibold">
                  <td className="py-3 px-2 pl-4 flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-violet-500" /> (=) EBITDA</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(data.ebitda)}</td>
                  <td className="py-3 px-2 text-right">{((data.ebitda / data.receitaBruta) * 100).toFixed(1)}%</td>
               </tr>
               <tr className="text-muted-foreground text-sm">
                  <td className="py-3 px-2 pl-8">(-) Depreciação e Amortização</td>
                  <td className="py-3 px-2 text-right text-destructive">{formatCurrency(data.depreciacaoAmortizacao)}</td>
                  <td className="py-3 px-2 text-right">{((data.depreciacaoAmortizacao / data.receitaBruta) * 100).toFixed(1)}%</td>
               </tr>
               <tr className="text-muted-foreground text-sm">
                  <td className="py-3 px-2 pl-8">(+/-) Resultado Financeiro</td>
                  <td className="py-3 px-2 text-right text-destructive">{formatCurrency(data.resultadoFinanceiro)}</td>
                  <td className="py-3 px-2 text-right">{((data.resultadoFinanceiro / data.receitaBruta) * 100).toFixed(1)}%</td>
               </tr>
               <tr className="font-bold text-lg bg-emerald-500/10 text-emerald-500">
                  <td className="py-4 px-2 pl-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> (=) LUCRO LÍQUIDO DO EXERCÍCIO</td>
                  <td className="py-4 px-2 text-right">{formatCurrency(data.lucroLiquido)}</td>
                  <td className="py-4 px-2 text-right">{((data.lucroLiquido / data.receitaBruta) * 100).toFixed(1)}%</td>
               </tr>
            </tbody>
         </table>
      </div>
      
      {/* Mini historical chart visual mockup */}
      <div className="glass rounded-2xl p-6">
         <div className="flex items-center gap-3 mb-6">
            <LineChart className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Evolução do Lucro (Últimos 5 meses)</h2>
         </div>
         <div className="flex items-end justify-between h-48 mt-8 border-b border-border/50 pb-2 px-4">
            {data.historico.map((h, i) => {
               const height = (h.lucro / 70000) * 100; // max chart height approx
               return (
                  <div key={i} className="flex flex-col items-center group relative w-full px-2 sm:px-6">
                     <div 
                        className="w-full max-w-[40px] bg-emerald-500/80 hover:bg-emerald-500 rounded-t-md transition-all duration-300 relative"
                        style={{ height: `${height}%` }}
                     >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-background border border-border shadow-lg rounded px-2 py-1 text-xs whitespace-nowrap transition-opacity">
                           {formatCurrency(h.lucro)}
                        </div>
                     </div>
                     <span className="text-xs text-muted-foreground mt-2">{h.mes}</span>
                  </div>
               )
            })}
         </div>
      </div>

    </div>
  );
}
