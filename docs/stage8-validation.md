# Etapa 8 — Integração experimental e validação

## Alterações desta etapa

- Nova entrada **Montagem 3D** no menu autenticado `/meu-pc` (também disponível por `/meu-pc?view=visual-lab`).
- O laboratório usa a **configuração atual** ou a **montagem do Montador**, selecionadas explicitamente; também recebe as **peças personalizadas** da conta.
- Trocar GPU dentro do laboratório cria **somente um cenário local**, sem PUT/POST no perfil. Um usuário deve salvar mudanças no Meu PC/Montador separadamente.
- O protótipo autônomo `/roadmap-lab` ainda existe e usa o PC de demonstração.
- O laboratório e o Three.js são carregados sob demanda para manter as demais telas mais leves.
- Os testes automatizados validam condições de compatibilidade, âncoras, modos de inspeção, separação da vista explodida, etapas da montagem e integração ao perfil.
- Workflow GitHub Actions executa suíte e build em pull requests, sem precisar da SerpApi.

## Testes no Windows (PowerShell)

Execute a partir da raiz correta:

```powershell
cd "C:\Users\Ekivale\Desktop\UpgradeYourPC\UpgradeYourPC"
git fetch origin
git switch feat/integration-quality-stage8
pnpm.cmd install --no-frozen-lockfile
pnpm.cmd test:roadmap
pnpm.cmd build
pnpm.cmd dev
```

Abra `http://localhost:5173/meu-pc?view=visual-lab` e autentique-se, se solicitado.

### Checklist de aprovação

1. O menu **Montagem 3D** aparece em **Meu espaço**.
2. **Configuração = Meu PC**: CPU, GPU e demais categorias são retiradas do perfil atual. O texto não pode chamar essa configuração de exemplo.
3. **Configuração = Montador**: o laboratório passa a trabalhar com o rascunho do Montador, sem sobrescrever Meu PC.
4. Trocar a GPU no laboratório altera o diagnóstico local e a placa selecionada no 3D. Voltar ao Meu PC: a GPU salva continua a original.
5. Peças personalizadas devem aparecer na seleção, quando a categoria correspondente existir no perfil.
6. O tutorial de montagem, seus nove passos (oito sem GPU), a reprodução de encaixe e o botão Encerrar devem permanecer operacionais.
7. Raio-X, vista explodida de 100% a 160%, fluxo de ar, seleção por peça e câmera continuam funcionando após sair do tutorial.
8. `/roadmap-lab` continua como ambiente de demonstração independente.
9. Os fluxos de login e perfil não devem falhar: `GET /api/profile`, `GET /api/builds` e `GET /api/extensions` devem continuar respondendo.
10. A aplicação não deve consultar SerpApi ao abrir o laboratório. O controle de custos e erros 502/429 permanece para revisão posterior.

### Limites e próximos passos

- Não mesclar ou publicar até CI, build, avaliação visual e aprovação.
- O workflow instala dependências com `--no-frozen-lockfile` porque as dependências Three.js foram adicionadas em branches anteriores, enquanto o lockfile versionado ainda não foi atualizado. **Antes de publicar**, gerar e versionar `pnpm-lock.yaml` atualizado e então trocar CI para `pnpm install --frozen-lockfile`.
- O visualizador usa modelos 3D esquemáticos; acabamento fiel a fabricante, checagem física exata e calibração dimensional ficam para o ciclo final.
- Os testes não cobrem autenticação real, hardware físico, SerpApi nem testes end-to-end completos de navegador.
