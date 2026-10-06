# Verificação da SerpApi

Última verificação: **6 de outubro de 2026 (UTC)**.

## Resultado

- Credencial aceita pelo endpoint oficial de conta.
- Plano identificado: Free Plan.
- Google Shopping respondeu com status HTTP 200 e `search_metadata.status = Success`.
- A consulta exata de teste para `AMD Ryzen 7 5700X` retornou 40 resultados brutos.
- A busca Bing usada para cupons respondeu com status HTTP 200 e 10 resultados orgânicos.
- Na consulta de teste da Pichau, o provedor não retornou cupons estruturados. Isso é uma ausência de cobertura naquele momento, não uma falha da integração.

Foram consumidas três pesquisas durante a validação: uma consulta ampla de diagnóstico, uma consulta exata de preço e uma consulta de cupons.

## Segurança e limites

- A chave não está no repositório, no navegador nem neste relatório; permanece como segredo de runtime do Site.
- O teste mostrou por que a consulta precisa ser exata: a busca ampla retornou processadores parecidos, kits e PCs completos. O código agora usa identidade entre aspas e mantém a validação estrita de título.
- A média continua usando somente ofertas que passam pelos filtros locais, com no máximo um preço por loja aprovada.
- Cupons só aparecem quando o provedor fornece um código estruturado e o destino pertence à própria loja. Ausência de código é exibida como ausência de resultado; nenhum cupom é inferido.

Para repetir os testes locais sem fazer chamadas reais, execute `node scripts/check-market.mjs`. A verificação ponta a ponta no Site exige uma conta autenticada e usa a cota real do provedor.
