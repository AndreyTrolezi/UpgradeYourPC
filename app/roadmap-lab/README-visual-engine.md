# Visual Engine — montagem estrutural experimental

## Objetivo
Oferecer uma cena WebGL genérica de gabinete ATX-style para explorar posições relativas de placa-mãe, CPU/cooler, RAM, GPU, fonte e ventilação. **A cena não representa escala física certificada nem os modelos exatos do catálogo.**

## Arquitetura
- `scene-layout.ts`: convenção de eixos e âncoras. X: traseira → frente, Y: base → teto, Z: bandeja → painel aberto.
- `visual-engine-pro.tsx`: componentes React Three Fiber, interação, gabinete e visualização.
- `workbench.tsx`: carrega o módulo sob demanda no laboratório.
- `scripts/check-visual-engine.mjs`: valida invariantes de posição e separação entre montagem e vista explodida.

O objeto `ANCHORS` define posições instaladas. O objeto `EXPLODED` fornece deslocamentos exclusivamente para inspeção. Não ajuste coordenadas independentes sem verificar seus pontos de referência.

## Comandos para validar no Windows

```powershell
git fetch origin
git switch feat/visual-engine-structural-v2
node scripts/check-visual-engine.mjs
node scripts/check-visual-inspection.mjs
node scripts/check-visual-explosion.mjs
pnpm.cmd build
pnpm.cmd dev
```

Acesse `http://localhost:5173/roadmap-lab`.

## Testes de aceitação visual
1. **Montado:** placa-mãe na bandeja, cooler no socket, RAM nos slots e GPU horizontal acoplada ao PCIe, com fans para baixo.
2. **Fonte:** fica no compartimento inferior; desative "Cobertura da fonte" para inspecioná-la.
3. **Ventoinhas:** três intake frontais e uma traseira; veja os fluxos esquemáticos no modo "Fluxo de ar". Setas azuis devem continuar visíveis como representação de entrada, e laranjas indicam exaustão.
4. **Explodido:** peças ficam afastadas do chassi, com gabinete apenas em contorno. Use o controle de separação em 100%, 130% e 160%: nenhuma peça deve atravessar outra. Linhas pontilhadas indicam âncoras. O botão "Enquadrar peças" reposiciona a câmera; retornar a Montado não deve alterar posições instaladas.
5. **Raio-X:** o gabinete vira contorno esquemático; apenas o componente selecionado fica opaco, os demais ficam translúcidos. Use os botões "Placa de vídeo", "Cooler", "RAM" para alternar o foco. O contorno não pode bloquear clique nas peças.
6. **Seleção:** clicar na peça ou no botão destaca e atualiza a ficha informativa.
7. **Painel lateral e isolamento:** a opção de painel deve mostrar vidro visível no modo normal, sem capturar cliques. No Raio-X e na Vista explodida, os controles de painel lateral e cobertura da fonte ficam desabilitados para não parecer que estão funcionando sem efeito. Com isolamento ativo, os demais componentes desaparecem.
8. **Sem GPU:** escolher a opção vazia no catálogo deve omitir o modelo da placa de vídeo.
9. **Câmera:** conferir os presets Isométrica, Lateral aberta, Frontal e Parte inferior, além dos controles orbitais de rotação e zoom.

## Limites conhecidos
- Dimensões do catálogo são mostradas no diagnóstico de compatibilidade, mas **não são usadas como geometria exata**.
- GPU usa modelo dual-fan genérico mesmo que o produto real tenha configuração diferente.
- O fluxo de ar é ilustrativo, não uma simulação térmica.
- O script de colisão verifica apenas envelopes geométricos aproximados entre componentes na vista explodida (100% a 160%). Não substitui colisões de malha 3D nem medições reais.
- Ainda faltam detalhamento PBR/fotográfico, cabos e conectores por modelo, animação de montagem e checagem de colisões tridimensionais exatas.
- A SerpApi permanece fora desta etapa.
