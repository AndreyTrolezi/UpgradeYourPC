import type { ExtensionManifest, PluginPermission } from "@/app/lib/types";

export const permissionLabels: Record<PluginPermission, { label: string; detail: string; risk: "baixo" | "médio" | "alto" }> = {
  "catalog.read": { label: "Ler catálogo", detail: "Consulta especificações e peças públicas.", risk: "baixo" },
  "build.read": { label: "Ler configuração", detail: "Acessa as peças do PC aberto no momento.", risk: "baixo" },
  "build.write": { label: "Alterar configuração", detail: "Pode trocar ou remover peças do montador.", risk: "médio" },
  "compatibility.extend": { label: "Adicionar verificações", detail: "Contribui alertas e regras de compatibilidade.", risk: "médio" },
  "glossary.extend": { label: "Adicionar termos", detail: "Inclui explicações no glossário.", risk: "baixo" },
  "export.extend": { label: "Criar exportações", detail: "Adiciona formatos de saída para configurações.", risk: "médio" },
  "prices.read": { label: "Ler ofertas", detail: "Consulta preços e links já cadastrados.", risk: "baixo" },
  "network.request": { label: "Acessar internet", detail: "Pode consultar serviços externos declarados.", risk: "alto" },
};

// Construção explícita evita que uma extensão remota execute JavaScript ao ser instalada.
export const builtInExtensions: ExtensionManifest[] = [
  {
    id: "core.compatibility", name: "Motor de compatibilidade", version: "1.0.0", author: "Upgrade Lab", builtIn: true,
    description: "Valida socket, memória, gabinete, cooler, fonte e equilíbrio com o monitor.",
    permissions: ["catalog.read", "build.read", "compatibility.extend"],
  },
  {
    id: "core.explainer", name: "Explicador técnico", version: "1.0.0", author: "Upgrade Lab", builtIn: true,
    description: "Transforma termos de ficha técnica em impacto prático e adiciona notas contextuais.",
    permissions: ["catalog.read", "build.read", "glossary.extend"],
  },
  {
    id: "lens.am4", name: "Lente de upgrade AM4", version: "1.0.0", author: "Upgrade Lab", builtIn: true,
    description: "Compara o ganho de uma troca direta com a migração completa de plataforma.",
    permissions: ["catalog.read", "build.read", "compatibility.extend"],
  },
  {
    id: "lens.qhd165", name: "Perfil QHD 165 Hz", version: "1.0.0", author: "Upgrade Lab", builtIn: true,
    description: "Analisa se CPU e GPU aproveitam monitores 1440p de alta frequência.",
    permissions: ["catalog.read", "build.read", "compatibility.extend"],
  },
  {
    id: "prices.trust", name: "Filtro de procedência", version: "0.3.0", author: "Upgrade Lab", builtIn: true,
    description: "Estrutura ofertas por loja, vendedor, garantia, nota fiscal e anomalia de preço. A coleta automática será conectada depois.",
    permissions: ["catalog.read", "prices.read"],
  },
];

const allowedPermissions = new Set<PluginPermission>([
  "catalog.read", "build.read", "build.write", "compatibility.extend", "glossary.extend", "export.extend", "prices.read", "network.request",
]);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function parseExtensionManifest(source: string): ExtensionManifest {
  if (source.length > 80_000) throw new Error("O manifesto excede o limite de 80 KB.");
  let value: unknown;
  try { value = JSON.parse(source); } catch { throw new Error("O conteúdo não é um JSON válido."); }
  if (!isPlainObject(value)) throw new Error("O manifesto precisa ser um objeto JSON.");
  const id = String(value.id ?? "");
  const name = String(value.name ?? "");
  const version = String(value.version ?? "");
  const author = String(value.author ?? "");
  const description = String(value.description ?? "");
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(id)) throw new Error("ID inválido. Use letras minúsculas, números, ponto, hífen ou sublinhado.");
  if (!name || name.length > 80) throw new Error("Informe um nome de até 80 caracteres.");
  if (!/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(version)) throw new Error("A versão deve seguir o formato 1.0.0.");
  if (!author || author.length > 80) throw new Error("Informe o autor.");
  if (!description || description.length > 300) throw new Error("Informe uma descrição de até 300 caracteres.");
  const rawPermissions = Array.isArray(value.permissions) ? value.permissions.map(String) : [];
  const permissions = rawPermissions.filter((item): item is PluginPermission => allowedPermissions.has(item as PluginPermission));
  if (permissions.length !== rawPermissions.length) throw new Error("O manifesto solicita uma permissão desconhecida.");
  if (permissions.includes("network.request")) throw new Error("Acesso externo ainda não está disponível para extensões importadas.");
  return { id, name, version, author, description, permissions };
}

export const exampleManifest = JSON.stringify({
  id: "comunidade.meu-explicador",
  name: "Meu explicador de hardware",
  version: "1.0.0",
  author: "Seu nome",
  description: "Exemplo de extensão declarativa segura para o Upgrade Lab.",
  permissions: ["catalog.read", "build.read", "glossary.extend"],
}, null, 2);
