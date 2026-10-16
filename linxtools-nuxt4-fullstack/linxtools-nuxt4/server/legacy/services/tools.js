import { field, HttpError } from '../lib/http.js';
import { inspectXML } from './xml.js';

function choice(v, values, name) {
  if (!values.includes(v)) throw new HttpError(400, `Opção inválida em ${name}.`);
  return v;
}

function countNodes(root) {
  const stats = { objects: 0, arrays: 0, values: 0, maxDepth: 0 };
  function visit(node, depth) {
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    if (Array.isArray(node)) { stats.arrays++; for (const item of node) visit(item, depth+1); }
    else if (node !== null && typeof node === 'object') { stats.objects++; for (const item of Object.values(node)) visit(item, depth+1); }
    else stats.values++;
  }
  visit(root, 0);
  return stats;
}

function formatJSON(payload) {
  const source = field(payload.content, 'JSON');
  let parsed;
  try { parsed = JSON.parse(source); }
  catch (err) { throw new HttpError(422, `JSON inválido: ${err.message}`); }
  const mode = choice(payload.mode || 'pretty', ['pretty', 'compact'], 'formatação');
  const indentation = Number(payload.indent || 2);
  if (![2, 4].includes(indentation)) throw new HttpError(400, 'A indentação deve ser de 2 ou 4 espaços.');
  const output = JSON.stringify(parsed, null, mode === 'compact' ? 0 : indentation);
  return { title: 'JSON validado com sucesso', output, language: 'json', details: countNodes(parsed) };
}

function validateXML(payload) {
  const xml = field(payload.content, 'XML');
  const info = inspectXML(xml);
  const message = `XML estruturalmente válido.\n\nElemento raiz: <${info.root}>\nElementos: ${info.tags}\nProfundidade máxima: ${info.maxDepth}\nTamanho: ${info.bytes} bytes`;
  return { title: 'Estrutura XML válida', output: message, language: 'text', details: info, note: 'Validação sintática. Não verifica XSD, assinatura digital nem regras da SEFAZ.' };
}

function generateFeedback(payload) {
  const target = choice(payload.target || 'client', ['client', 'internal', 'escalation'], 'destinatário');
  const tone = choice(payload.tone || 'professional', ['professional', 'direct'], 'tom');
  const customer = field(payload.customer || '', 'nome', 100, false);
  const subject = field(payload.subject, 'assunto', 140);
  const analysis = field(payload.analysis, 'análise', 1200);
  const action = field(payload.action, 'ação realizada', 1200);
  const next = field(payload.next || '', 'próximos passos', 800, false);
  let output;
  if (target === 'internal') {
    output = `ASSUNTO: ${subject}\n\nCENÁRIO\n${analysis}\n\nTRATATIVA\n${action}${next ? `\n\nPRÓXIMOS PASSOS\n${next}` : ''}`;
  } else if (target === 'escalation') {
    output = `ENCAMINHAMENTO TÉCNICO — ${subject}\n\nContexto: ${analysis}\n\nValidações realizadas: ${action}${next ? `\n\nAção solicitada: ${next}` : ''}\n\nSolicito avaliação da equipe responsável.`;
  } else {
    output = `${customer ? `Olá, ${customer}!` : 'Olá!'}\n\n${tone === 'direct' ? 'Sobre' : 'Em relação à solicitação'} "${subject}", identificamos o seguinte cenário: ${analysis}\n\n${tone === 'direct' ? 'Realizamos' : 'Durante o atendimento, realizamos'}: ${action}.${next ? `\n\nPróximos passos: ${next}.` : ''}\n\nPermanecemos à disposição.`;
  }
  return { title: 'Texto gerado', output, language: 'text', note: 'Modelo determinístico. Revise os fatos antes de enviar.' };
}

const SCRIPT_PRESETS = {
  'windows-network': { label: 'Diagnóstico de rede (CMD)', output: 'ipconfig /all\nping {host}\nnslookup {host}\ntracert {host}' },
  'windows-services': { label: 'Consulta de serviços (CMD)', output: 'sc query state= all\nsc query "{service}"' },
  'powershell-port': { label: 'Verificação de porta (PowerShell)', output: 'Test-NetConnection -ComputerName {host} -Port {port}' },
  'sql-read': { label: 'Consulta de conectividade SQL (leitura)', output: 'SELECT CURRENT_TIMESTAMP AS data_servidor;' }
};
function generateScript(payload) {
  const preset = choice(payload.preset, Object.keys(SCRIPT_PRESETS), 'modelo');
  const host = field(payload.host || 'localhost', 'host', 100);
  const service = field(payload.service || 'FirebirdServerDefaultInstance', 'serviço', 120);
  const port = Number(payload.port || 3050);
  if (!/^[a-zA-Z0-9._:-]+$/.test(host)) throw new HttpError(400, 'Host inválido. Use IP ou hostname sem espaços.');
  if (!/^[\w.-]+$/.test(service)) throw new HttpError(400, 'Nome de serviço inválido.');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new HttpError(400, 'A porta deve estar entre 1 e 65535.');
  const output = SCRIPT_PRESETS[preset].output.replaceAll('{host}', host).replaceAll('{port}', String(port)).replaceAll('{service}', service);
  return { title: SCRIPT_PRESETS[preset].label, output, language: preset.startsWith('powershell') ? 'powershell' : 'text', note: 'Comandos de consulta/diagnóstico. Revise antes de executar em um ambiente de produção.' };
}

const SCOPE_RULES = {
  'installation': { team: 'Implantação / Serviços', reason: 'Instalações e configurações estruturais normalmente exigem fluxo especializado.', next: 'Verifique o contrato, o processo interno e os dados necessários para abertura da demanda.' },
  'incident': { team: 'Suporte técnico', reason: 'Comportamento inesperado em operação existente deve passar por triagem técnica.', next: 'Registre evidências, impacto, horário, ambiente e passos para reprodução.' },
  'fiscal': { team: 'Suporte técnico + especialista fiscal', reason: 'Ocorrências fiscais requerem conferência de regras e condições de emissão.', next: 'Colete código de rejeição, UF, tipo de documento, certificado e evidências sem dados sensíveis.' },
  'customization': { team: 'Produto / Comercial / Serviços', reason: 'Alterações de produto e personalizações podem depender de avaliação de viabilidade.', next: 'Documente o caso de uso, o resultado esperado e o processo atual.' },
  'access': { team: 'Suporte / Administração de acessos', reason: 'Permissões e acessos dependem de regras de responsabilidade.', next: 'Confirme a identidade pelos canais oficiais e siga o processo de autorização.' }
};
function checkScope(payload) {
  const category = choice(payload.category, Object.keys(SCOPE_RULES), 'categoria');
  const description = field(payload.description, 'descrição', 1500);
  const rule = SCOPE_RULES[category];
  return { title: 'Sugestão de encaminhamento', output: `DEMANDA\n${description}\n\nÁREA SUGERIDA\n${rule.team}\n\nCRITÉRIO\n${rule.reason}\n\nPRÓXIMO PASSO\n${rule.next}`, language: 'text', note: 'Orientação preliminar baseada em exemplos; não substitui a matriz oficial de escopo ou a triagem humana.' };
}

function buildShare(payload) {
  const title = field(payload.title, 'título', 160);
  const context = field(payload.context, 'contexto', 1500);
  const steps = field(payload.steps, 'passos', 3000);
  const result = field(payload.result || '', 'resultado', 1200, false);
  const output = `📌 ${title}\n\nCONTEXTO\n${context}\n\nPASSO A PASSO\n${steps}${result ? `\n\nRESULTADO / OBSERVAÇÕES\n${result}` : ''}\n\n— Compartilhado via Webee Tools`;
  return { title: 'Procedimento pronto para compartilhar', output, language: 'text' };
}

function textUtilities(payload) {
  const source = field(payload.content, 'texto');
  const action = choice(payload.action || 'trim', ['trim', 'unique', 'stats'], 'utilitário');
  const lines = source.split(/\r?\n/);
  let output;
  if (action === 'trim') output = lines.map(line => line.trim()).filter(Boolean).join('\n');
  else if (action === 'unique') output = [...new Set(lines.map(line => line.trim()).filter(Boolean))].join('\n');
  else output = `Caracteres: ${source.length}\nPalavras: ${(source.match(/\S+/g) || []).length}\nLinhas: ${lines.length}\nLinhas não vazias: ${lines.filter(x => x.trim()).length}`;
  return { title: action === 'stats' ? 'Estatísticas do texto' : 'Texto processado', output, language: 'text', details: { originalLines: lines.length, resultingLines: output.split('\n').length } };
}

const handlers = {
  'json-formatter': formatJSON,
  'xml-validator': validateXML,
  'feedback-generator': generateFeedback,
  'script-generator': generateScript,
  'scope-checker': checkScope,
  'share-builder': buildShare,
  'text-utilities': textUtilities
};

export function executeTool(slug, payload) {
  if (!handlers[slug]) throw new HttpError(404, 'Ferramenta não encontrada ou indisponível.');
  return handlers[slug](payload);
}
