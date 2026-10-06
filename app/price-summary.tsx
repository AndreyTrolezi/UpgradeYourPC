"use client";
import {useState} from "react";
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from "@/components/ui/select";
import type {Offer,Part} from "@/app/lib/types";
const money=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function PriceSummary({parts,offers}:{parts:Part[];offers:Offer[]}) {
  const [id,setId]=useState("r7-5700x");
  const part=parts.find(p=>p.id===id);
  const valid=offers.filter(o=>o.partId===id && o.condition==="novo" && o.trustScore>=75 && o.priceCash>0 && Date.now()-Date.parse(o.checkedAt)<7*86400000);
  const samples=[...new Map(valid.map(o=>[`${o.store.toLowerCase()}|${o.seller.toLowerCase()}`,o])).values()].map(o=>o.priceCash).sort((a,b)=>a-b);
  const median=samples.length?(samples[Math.floor(samples.length/2)]+samples[Math.floor((samples.length-1)/2)])/2:0;
  return <section className="lab-panel p-5"><h2 className="text-xl font-bold">Suas referências cadastradas</h2><p className="my-3 text-slate-400">Esta mediana usa suas ofertas cadastradas de produtos novos, com pontuação ≥75 e consulta nos últimos 7 dias. A busca pela API aparece acima; as duas amostras são independentes.</p><Select value={id} onValueChange={setId}><SelectTrigger aria-label="Peça para consultar preço" className="w-full"><SelectValue/></SelectTrigger><SelectContent>{parts.filter(p=>p.price>0).map(p=><SelectItem key={p.id} value={p.id}>{p.brand} {p.name}</SelectItem>)}</SelectContent></Select><div className="mt-4 grid gap-4 sm:grid-cols-3">{[["Preço-base estimado",part?.price?money(part.price):"Não informado"],["Mediana da sua amostra",samples.length?money(median):"Sem ofertas recentes"],["Vendedores na amostra",String(samples.length)]].map(([label,value])=><div key={label} className="rounded-xl border border-white/10 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>)}</div><p className="mt-3 text-sm text-slate-400">Valores à vista, sem frete. Cadastro e pontuação são declaratórios; não certificam o vendedor. Com menos de 3 vendedores, a amostra é insuficiente para estimar preço de mercado.</p></section>;
}
