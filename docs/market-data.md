# Preços e cupons

A integração está implementada e usa uma chave própria da SerpApi configurada como segredo do servidor. Não há preços ou cupons simulados na tela online. O catálogo anterior usa estimativas; as 12 novas fichas têm fonte técnica e preço não consultado.

## Ativação

1. Crie sua conta em https://serpapi.com/users/sign_up e obtenha uma chave no painel do provedor.
2. Cadastre `SERPAPI_API_KEY` como segredo de runtime do Site. Em desenvolvimento local, use apenas um arquivo de ambiente ignorado pelo Git, conforme o runtime. Nunca use prefixo `NEXT_PUBLIC_`, o catálogo, um manifesto de extensão ou o código do navegador.
3. Publique novamente caso a configuração de runtime exija nova implantação. Entre no Upgrade PC, abra **Preços**, escolha uma peça e use **Buscar ofertas**. Valide pelo menos três ofertas na página da loja antes de depender da amostra. Faça uma consulta de cupons separada.

O plano gratuito informado pela SerpApi em 14/09/2026 tem 250 buscas por mês e 50 por hora (https://serpapi.com/pricing). Não foi contratado plano pago. Uma consulta de peça pode consumir três buscas: Shopping e até duas páginas do produto. Uma consulta de cupons consome uma busca. O limite local é conservador: reserva três créditos por peça mesmo quando usa menos; tentativas com falha também contam. Há limites de 200 créditos por mês civil UTC, 40 por hora UTC e 12 por pessoa/dia UTC. As janelas locais não equivalem necessariamente ao ciclo de cobrança da conta. Confira o saldo no provedor, especialmente se compartilhar a chave com outro aplicativo. Aumentar os limites exige revisar o plano e o código.

## Fluxo e documentação

- Google Shopping: https://serpapi.com/google-shopping-api — busca com `gl=br`, `hl=pt`, `google_domain=google.com.br` e identidade exata entre aspas. Termos genéricos de kits e computadores completos são excluídos na consulta e novamente nos filtros locais.
- Ofertas de lojas: https://serpapi.com/google-immersive-product-api — usa `immersive_product_page_token` e `more_stores=true`. O `product_link` do Shopping pode apontar para o Google; não é apresentado como link direto de lojista. O servidor constrói os próprios endpoints e nunca segue URLs arbitrárias retornadas pelo provedor.
- Cupons: https://serpapi.com/bing-coupons-results — busca Bing com `mkt=pt-BR`; códigos vêm de `coupons_results.items[].coupon`. Sua presença depende da busca e da cobertura regional. Links codificados do Bing só são aceitos após decodificar e conferir o destino.

As consultas exigem conta autenticada. A API aceita somente IDs do catálogo incorporado e IDs de lojas permitidas, não consultas arbitrárias ou peças de extensões. Não envia nome, e-mail, localização pessoal ou configuração do usuário ao provedor, somente a busca de produto/loja. A chave fica no servidor. Respostas e logs da aplicação não incluem a chave ou erros brutos do provedor.

## Critérios e limites dos dados

- Destinos HTTPS explícitos: KaBuM!, Pichau, TerabyteShop, GK InfoStore e Patoloco, no domínio principal ou `www`. Sem encurtadores nem sites de terceiros. Domínio conhecido não certifica vendedor de marketplace, nota fiscal ou garantia; a tela pede confirmação desses pontos.
- Correspondência pelo título: CPU exige modelo e sufixo exatos; GPUs genéricas exigem chip e VRAM. Novas variantes de GPU, placas-mãe e SSD usam termos do modelo, capacidade ou revisão. Falsos negativos são preferidos a substituições silenciosas. Títulos incorretos do anunciante ainda podem escapar, por isso há link para a conferência final.
- Kits, usados e recondicionados identificados, ofertas indisponíveis e moedas diferentes de BRL são descartados. Condição omitida fica **não informado**, nunca **novo verificado**. Esta amostra não equivale a um filtro que garante somente produtos novos.
- Usa o preço integral anunciado, descartando texto só com parcelas, faixas ou "a partir de". Pix, boleto e condição não informada ficam identificados. A média pode incluir condições de pagamento diferentes. Frete desconhecido é `null`, não zero; não se presume frete grátis.
- Um menor preço por loja na amostra. Deduplicação por URL. Com pelo menos quatro lojas, exclui preços abaixo de 0,5× ou acima de 2× a mediana inicial; a tela informa o critério e a quantidade removida. A lista ainda permite revisar os excluídos.
- Calcula média aritmética, mediana e faixa da amostra; não chama esses números de média de todo o mercado. Aplicar uma referência ao montador exige três lojas e consulta ainda válida. A ação adiciona/substitui a peça da categoria, salva valor, método, quantidade de lojas e data. Não desconta cupons. Configurações salvas e exportadas preservam esse retrato; novas consultas não alteram pesquisas anteriores.
- Cupons são exibidos apenas com destino na própria loja. Códigos não são inventados a partir de porcentagens ou snippets. Páginas oficiais de ofertas podem aparecer sem código. Validade, mínimo de compra, elegibilidade do produto e primeira compra precisam ser conferidos na fonte e no checkout. Nenhum código é declarado testado.

## Persistência e operação

`market_cache` armazena resultados compartilhados por produto/loja por 24 h (preços) e 6 h (cupons). Não é histórico de preços nem agendamento de coleta. A atualização ocorre na próxima consulta depois de expirar. Uma trava por chave evita buscas concorrentes repetidas; `market_usage` usa reservas atômicas para limitar custos. Migrações são incrementais e preservam os perfis existentes.

Sem chave, sem saldo, sem resultados ou em falha do provedor, a interface informa o estado e não inventa valores. Os adaptadores e filtros foram validados com respostas documentadas simuladas em `node scripts/check-market.mjs`; a consulta de ponta a ponta ao provedor real ainda precisa da chave. Dados ausentes dos fabricantes não receberam índices de desempenho ou preços supostos.

Fontes de especificações estão em `app/data/catalog-verified.ts` e nas fichas do catálogo. As fichas anteriores não foram revalidadas integralmente nesta alteração.
