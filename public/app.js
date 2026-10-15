const ICONS = {
  'arrow-right':'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  'arrow-left':'<path d="m12 19-7-7 7-7M5 12h14"/>',
  'arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>',
  'search':'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  'file-code':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6m-9 5-2 2 2 2m4-4 2 2-2 2"/>',
  'braces':'<path d="M8 3H6a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h2m8-14h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-2"/>',
  'route':'<circle cx="6" cy="19" r="2"/><path d="M9 19h8a4 4 0 0 0 0-8H7a4 4 0 0 1 0-8h8"/><path d="m12 6 3-3-3-3"/>',
  'share':'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 13.5 6.6 4m0-11-6.6 4"/>',
  'terminal':'<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m6 9 3 3-3 3m6 0h6"/>',
  'message':'<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8v.5Z"/><path d="M8 11h8m-8 4h5"/>',
  'sparkles':'<path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3ZM5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5L5 3Zm14 13 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z"/>',
  'bell':'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0"/>',
  'check':'<path d="m5 12 4 4L19 6"/>',
  'check-circle':'<circle cx="12" cy="12" r="10"/><path d="m7 12 3 3 7-7"/>',
  'shield':'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  'layers':'<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5m-18 5 9 5 9-5"/>',
  'clock':'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  'rocket':'<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2 2 0 0 0-2.91-.09ZM12 15l-3-3a22 22 0 0 1 2-3 12.88 12.88 0 0 1 10-6 12.88 12.88 0 0 1-6 10 22 22 0 0 1-3 2Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5-1 5-1m4 5v5s3.03-.55 4-2c1.08-1.62 1-5 1-5"/>',
  'clipboard':'<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M8 10h8m-8 4h8m-8 4h5"/>',
  'copy':'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  'send':'<path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/>',
  'x':'<path d="M18 6 6 18M6 6l12 12"/>',
  'lightbulb':'<path d="M9 18h6m-5 4h4m-2-20a7 7 0 0 0-4 12.8c.7.6 1 1.3 1 2.2h6c0-.9.3-1.6 1-2.2A7 7 0 0 0 12 2Z"/>',
  'upload':'<path d="M12 16V3m-5 5 5-5 5 5M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  'database':'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0"/>',
  'edit':'<path d="M12 20h9m-3-17a2 2 0 0 1 3 3L10 17l-4 1 1-4L18 3Z"/>',
  'play':'<path d="m8 5 12 7-12 7V5Z"/>',
  'pin':'<path d="m16 3 5 5-4 2-3 3-1 7-2 2-1-7-3-3-4 2 3-4 3-3 2-4Z"/>',
  'calendar':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  'megaphone':'<path d="m3 11 18-6v14L3 13v-2ZM6 14l2 7h4l-2-6"/>',
  'plus':'<path d="M12 5v14M5 12h14"/>',
  'trash':'<path d="M3 6h18M8 6V4h8v2m-11 0 1 15h12l1-15M10 10v7m4-7v7"/>',
  'users':'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m14-11a4 4 0 1 0 0-8m6 19v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
  'lock':'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  'settings':'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M20 13.5V10.5l-2.4-.8-.6-1.5 1.1-2.3-2.1-2.1-2.3 1.1-1.5-.6L11.5 2h-3l-.8 2.4-1.5.6-2.3-1.1-2.1 2.1 1.1 2.3-.6 1.5L0 10.5v3l2.4.8.6 1.5-1.1 2.3 2.1 2.1 2.3-1.1 1.5.6.8 2.4h3l.8-2.4 1.5-.6 2.3 1.1 2.1-2.1-1.1-2.3.6-1.5Z"/>' ,
  'link':'<path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7"/>',
  'grid':'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
};
const state = { tools: [], releases: [], notices: [], videos: [], links: [], portal: {}, adminNotices: [], adminReleases: [], adminLinks: [], users: [], overview:{}, adminTab:'overview', user: null, filter: 'Todas', query: '', lastOutput: '', busy: false };
const $ = (sel, root = document) => root.querySelector(sel);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon = (name, size = 20) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.sparkles}</svg>`;
const link = (path, label, classes = '') => `<a class="${classes}" href="${path}" data-link>${label}</a>`;

async function request(path, options = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`);
  return data;
}

function brand() {
  return `<a href="/" data-link class="brand" aria-label="Linxtools — Página inicial"><span class="brand-mark">L.</span><span class="brand-copy"><span class="brand-name">linx<b>tools</b></span><span class="brand-caption">WEBEE TOOLS</span></span></a>`;
}
function header() {
  const path=location.pathname;
  const active=(prefix)=>path===prefix||path.startsWith(prefix+'/')?'class="active"':'';
  return `<header class="site-header"><div class="container header-inner">${brand()}
    <nav class="nav-links" aria-label="Menu principal">${link('/','Início',path==='/'?'active':'')}<a href="/#tools" data-scroll="tools">Webee Tools</a><a href="/mural" data-link ${active('/mural')}>Mural</a><a href="/links" data-link ${active('/links')}>Links úteis</a><a href="/aprender" data-link ${active('/aprender')}>Aprendizado</a>${link('/releases','Releases')}</nav>
    <div class="header-actions">${canPublish()?link('/operacao',`${icon('grid',16)}<span>Portal da Operação</span>`,'btn btn-outline btn-sm admin-header-link'):''}
    ${state.user ? `<span class="user-chip" title="${esc(state.user.email)}">${esc(state.user.name.split(' ')[0])}</span><button class="btn btn-outline btn-sm logout-btn" data-action="logout" title="Sair">${icon('lock',14)} Sair</button>` : link('/login',`${icon('lock',15)} Entrar`,'btn btn-primary btn-sm')}
    </div></div></header>`;
}
function footer() {
  return `<footer class="footer"><div class="container"><div class="footer-row"><div>${brand()}<p>Comunicação da operação, ferramentas técnicas e aprendizado — tudo em uma única plataforma.</p></div><div class="footer-links">${link('/','Início')}${link('/mural','Mural')}${link('/aprender','Aprendizado')}${link('/links','Links úteis')}${link('/releases','Releases')}</div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Linxtools • Protótipo demonstrativo</span><span>Projeto independente para validação de conceito.</span></div></div></footer>`;
}
function ideaDialog() {
  return `<dialog class="dialog" id="idea-dialog" aria-labelledby="idea-title"><div class="dialog-head"><div><span class="kicker">${icon('lightbulb',14)} SUA IDEIA IMPORTA</span><h2 id="idea-title">Sugira uma ferramenta</h2><p>Quais tarefas você gostaria de simplificar?</p></div><button class="dialog-close" data-action="close-idea" aria-label="Fechar">${icon('x')}</button></div>
    <div class="dialog-body"><form id="idea-form" class="form-stack"><div><label class="field-label" for="idea-title-field">Nome da ferramenta *</label><input class="control" id="idea-title-field" name="title" maxlength="100" placeholder="Ex.: Comparador de arquivos XML" required /></div><div><label class="field-label" for="idea-description">Qual problema ela resolveria? *</label><textarea class="control" id="idea-description" name="description" maxlength="800" placeholder="Descreva a dificuldade do dia a dia..." required></textarea></div><div><label class="field-label" for="idea-role">Sua área (opcional)</label><input class="control" id="idea-role" name="role" maxlength="100" placeholder="Ex.: Suporte técnico" /></div><div id="idea-status"></div><button class="btn btn-primary btn-full" type="submit">${icon('send',16)} Enviar sugestão</button></form></div>
    </dialog>`;
}
function shell(content) { $('#app').innerHTML = `${header()}<main>${content}</main>${footer()}${ideaDialog()}`; }
const safeAccent = c => ['purple','violet','pink','coral','orange','gold','slate','charcoal'].includes(c) ? c : 'purple';

function toolCard(tool) {
  const href = tool.slug === 'releases' ? '/releases' : `/tools/${encodeURIComponent(tool.slug)}`;
  return `<a class="tool-card accent-${safeAccent(tool.accent)}" href="${href}" data-link><span class="tool-icon">${icon(tool.icon,26)}</span>${tool.featured ? '<span class="card-featured">POPULAR</span>' : ''}<span class="tool-category">${esc(tool.category)}</span><h3>${esc(tool.name)}</h3><p>${esc(tool.description)}</p><span class="tool-open">Abrir ferramenta ${icon('arrow-up-right',17)}</span></a>`;
}
function preview() {
  return `<div class="hero-visual" aria-hidden="true"><div class="orb one"></div><div class="orb two"></div><div class="product-window"><div class="window-top"><i></i><i></i><i></i><span class="window-name">linxtools / dashboard</span></div><div class="window-body"><div class="window-overline">PAINEL DE RECURSOS</div><div class="window-heading">Seu trabalho, mais simples.</div><div class="window-search">${icon('search',13)} Pesquise uma ferramenta...</div><div class="mini-tools"><div class="mini-tool"><div class="mini-tool-icon">${icon('file-code')}</div><div><strong>Validador de XML</strong><small>Ferramentas</small></div></div><div class="mini-tool gold"><div class="mini-tool-icon">${icon('message')}</div><div><strong>Gerador de feedback</strong><small>Atendimento</small></div></div><div class="mini-tool coral"><div class="mini-tool-icon">${icon('terminal')}</div><div><strong>Gerador de script</strong><small>Produtividade</small></div></div><div class="mini-tool slate"><div class="mini-tool-icon">${icon('braces')}</div><div><strong>Formatador JSON</strong><small>Ferramentas</small></div></div></div></div></div><div class="floating-note"><span class="floating-icon">${icon('check-circle',20)}</span><div><strong>Pronto para usar</strong><span>Ferramentas em um só lugar</span></div></div></div>`;
}
function homePage() {
 shell(`${state.portal.banner_enabled && state.portal.banner_text ? `<div class="global-banner"><div class="container">${icon('bell',17)} ${esc(state.portal.banner_text)}</div></div>` : ''}<section class="hero portal-hero"><div class="container hero-inner"><div><span class="kicker"><span class="kicker-dot"></span> SEU PORTAL DA OPERAÇÃO</span><h1>${esc(state.portal.hero_title || 'Mais conexão. Mais soluções.')}</h1><p class="hero-description">${esc(state.portal.hero_description || 'Fique por dentro dos comunicados da liderança, resolva tarefas com as Webee Tools e aprenda com conteúdos práticos.')}</p><div class="hero-actions"><a href="/#tools" data-scroll="tools" class="btn btn-yellow">Explorar Webee Tools ${icon('arrow-right')}</a>${link('/mural',`Acessar mural ${icon('arrow-right')}`,'btn btn-outline')}</div><div class="microproof">${icon('shield',19)} Ferramentas práticas <span class="line"></span> Mural restrito à operação</div></div>${preview()}</div></section>
   <section class="stats-band"><div class="container stats-list"><div class="stat"><span class="stat-icon">${icon('layers',25)}</span><div><b>${state.tools.length} Webee Tools</b><small>Produtividade</small></div></div><div class="stat"><span class="stat-icon">${icon('megaphone',25)}</span><div><b>Mural interno</b><small>Comunicação da liderança</small></div></div><div class="stat"><span class="stat-icon">${icon('play',25)}</span><div><b>Aprendizado</b><small>Vídeos e tutoriais</small></div></div></div></section>
   ${homeNoticeSection()}
   <section class="section tools-section" id="tools"><div class="container"><div class="section-title"><span class="kicker"><span class="kicker-dot"></span> WEBEE TOOLS</span><h2>As ferramentas certas,<br> na hora certa.</h2><p>Menos tempo em tarefas repetitivas. Mais foco no que realmente precisa da sua atenção.</p></div><div class="toolbar"><div class="filters" id="filters" role="group" aria-label="Filtrar por categoria"></div><label class="search-field">${icon('search')}<input id="search-tools" type="search" placeholder="Pesquisar ferramentas..." aria-label="Pesquisar ferramentas" autocomplete="off" /></label></div><div class="tool-grid" id="tools-grid"></div><div class="tools-bottom"><span id="tool-count">Explore as ferramentas</span><button class="btn-link" data-action="open-idea">Não encontrou o que precisava? Sugira uma ferramenta ${icon('arrow-right',15)}</button></div></div></section>
  ${videoTeaser()}
  <section class="section releases-section" id="updates"><div class="container releases-feature"><div><span class="kicker"><span class="kicker-dot"></span> SEMPRE ATUALIZADO</span><h2>Novidades que fazem a diferença.</h2><p class="releases-description">Acompanhe versões de sistemas, mudanças relevantes e materiais de apoio em uma área dedicada à operação.</p>${link('/releases',`Consultar releases ${icon('arrow-right')}`,'btn btn-primary')}</div><div class="releases-visual"><div class="releases-shape"></div><div class="release-board"><div class="board-title">${icon('bell',17)} Central de atualizações</div><div class="release-line"><span class="bullet"></span><div><strong>Novas funcionalidades</strong><span>Novidades dos produtos</span></div></div><div class="release-line"><span class="bullet"></span><div><strong>Melhorias e correções</strong><span>Histórico organizado por versão</span></div></div><div class="release-line"><span class="bullet"></span><div><strong>Documentação</strong><span>Referências oficiais</span></div></div></div></div></div></section>
  <section class="idea-section"><div class="container idea-content"><div><span class="kicker">${icon('lightbulb',14)} SUA IDEIA PODE VIRAR UMA TOOL</span><h2>Tem uma tarefa repetitiva que merece ser automatizada?</h2><p>Conte o que toma seu tempo. As próximas ferramentas podem nascer da sua sugestão.</p></div><button class="btn btn-yellow" data-action="open-idea">Sugerir ferramenta ${icon('arrow-right')}</button></div></section>`);
 renderFilters();renderGrid();
}
function renderFilters() {
  const categories = ['Todas', ...new Set(state.tools.map(t => t.category))];
  $('#filters').innerHTML = categories.map(cat => `<button class="filter ${cat === state.filter ? 'selected' : ''}" data-filter="${esc(cat)}" aria-pressed="${cat === state.filter}">${esc(cat)}</button>`).join('');
}
function renderGrid() {
  const filtered = state.tools.filter(t => (state.filter === 'Todas' || t.category === state.filter) && `${t.name} ${t.description} ${t.category}`.toLocaleLowerCase('pt-BR').includes(state.query.toLocaleLowerCase('pt-BR')));
  $('#tools-grid').innerHTML = filtered.length ? filtered.map(toolCard).join('') : `<div class="empty-tools">${icon('search',31)}<h3>Nenhuma ferramenta encontrada</h3><p>Tente buscar outro termo ou escolher outra categoria.</p></div>`;
  $('#tool-count').textContent = `${filtered.length} ferramenta${filtered.length === 1 ? '' : 's'} encontrada${filtered.length === 1 ? '' : 's'}`;
}

const CONTROL = (name, label, placeholder, extra = '') => `<div><label class="field-label" for="f-${name}">${label}</label><input class="control" id="f-${name}" name="${name}" placeholder="${esc(placeholder)}" ${extra}/></div>`;
const TEXTAREA = (name,label,placeholder, classes = '', extra = '') => `<div><label class="field-label" for="f-${name}">${label}</label><textarea class="control ${classes}" id="f-${name}" name="${name}" placeholder="${esc(placeholder)}" ${extra}></textarea></div>`;
const SELECT = (name,label,options) => `<div><label class="field-label" for="f-${name}">${label}</label><select class="control" id="f-${name}" name="${name}">${options.map(([value,label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join('')}</select></div>`;
const sampleJSON = '{\n  "pedido": 1234,\n  "status": "concluido",\n  "itens": [\n    { "produto": "Café", "quantidade": 2 },\n    { "produto": "Água", "quantidade": 1 }\n  ]\n}';
const sampleXML = '<?xml version="1.0" encoding="UTF-8"?>\n<nota id="1234">\n  <emitente>Exemplo</emitente>\n  <valor>49.90</valor>\n</nota>';
function toolFields(slug) {
  switch (slug) {
    case 'json-formatter': return `${TEXTAREA('content','Cole seu JSON','{ "chave": "valor" }','text-area-large','required')}<div class="form-row">${SELECT('mode','Tipo de formatação',[['pretty','Formatar e identar'],['compact','Compactar']])}${SELECT('indent','Indentação',[['2','2 espaços'],['4','4 espaços']])}</div><button type="button" class="small-action" data-action="sample-json">${icon('clipboard',15)} Inserir exemplo</button>`;
    case 'xml-validator': return `${TEXTAREA('content','Cole o conteúdo XML','<root>...</root>','text-area-large','required')}<div><label class="field-label" for="file-xml">Ou carregue um arquivo XML do seu computador</label><input class="file-input" id="file-xml" type="file" accept=".xml,text/xml,application/xml" /><span class="form-help">Limite: 200 mil caracteres. O conteúdo não é salvo pela aplicação.</span></div><button type="button" class="small-action" data-action="sample-xml">${icon('clipboard',15)} Inserir exemplo</button>`;
    case 'feedback-generator': return `<div class="form-row">${SELECT('target','Tipo de comunicação',[['client','Retorno ao cliente'],['internal','Registro interno'],['escalation','Escalonamento técnico']])}${SELECT('tone','Estilo',[['professional','Profissional'],['direct','Direto']])}</div>${CONTROL('customer','Nome do contato (opcional)','Ex.: Eduarda')}${CONTROL('subject','Assunto *','Ex.: Divergência em relatórios','required maxlength="140"')}${TEXTAREA('analysis','Cenário identificado *','O cliente informou...','','required')}${TEXTAREA('action','Análises ou ações realizadas *','Foram realizadas as seguintes verificações...','','required')}${TEXTAREA('next','Próximos passos (opcional)','Orientamos a equipe a...')}`;
    case 'script-generator': return `${SELECT('preset','Modelo de diagnóstico',[['windows-network','Rede — CMD'],['windows-services','Serviços — CMD'],['powershell-port','Teste de porta — PowerShell'],['sql-read','Conectividade — SQL (leitura)']])}<div class="form-row">${CONTROL('host','Host ou IP','192.168.0.10','value="localhost"')}${CONTROL('port','Porta','3050','value="3050" inputmode="numeric"')}</div>${CONTROL('service','Nome do serviço Windows','FirebirdServerDefaultInstance','value="FirebirdServerDefaultInstance"')}<span class="form-help">Modelos de consulta e diagnóstico. Nenhum comando é executado no servidor.</span>`;
    case 'scope-checker': return `${SELECT('category','Tipo de solicitação',[['incident','Falha em função existente'],['installation','Instalação / configuração'],['fiscal','Rejeição / questão fiscal'],['customization','Melhoria / personalização'],['access','Acesso / permissões']])}${TEXTAREA('description','Descreva brevemente a demanda *','Ex.: O cliente solicita a parametrização de um novo terminal de autoatendimento.','','required')}<span class="form-help">O resultado é uma orientação de triagem, não uma definição oficial de escopo.</span>`;
    case 'share-builder': return `${CONTROL('title','Título do procedimento *','Ex.: Como verificar o serviço Firebird','required')}${TEXTAREA('context','Contexto *','Cenário e motivo do procedimento...','','required')}${TEXTAREA('steps','Passo a passo *','1. Abra o CMD\n2. Execute...','','required')}${TEXTAREA('result','Resultado esperado (opcional)','O serviço deverá estar em execução...')}`;
    case 'text-utilities': return `${SELECT('action','O que deseja fazer?',[['trim','Remover linhas vazias e espaços'],['unique','Remover linhas duplicadas'],['stats','Contar caracteres, palavras e linhas']])}${TEXTAREA('content','Digite ou cole seu texto *','Cole o texto que deseja processar...','text-area-large','required')}`;
    default: return '';
  }
}
function workspacePage(slug) {
  const tool = state.tools.find(t => t.slug === slug && t.slug !== 'releases');
  if (!tool) { notFound(); return; }
  state.lastOutput = '';
  const forms = toolFields(slug);
  shell(`<div class="workspace-bg"><div class="workspace-hero"><div class="container"><a href="/#tools" data-scroll="tools" class="back-link">${icon('arrow-left',16)} Voltar às ferramentas</a><div class="workspace-title-line"><span class="tool-icon">${icon(tool.icon,30)}</span><div><span class="kicker workspace-kicker">${esc(tool.category.toUpperCase())}</span><h1>${esc(tool.name)}</h1><p>${esc(tool.description)}</p></div></div></div></div><div class="container workspace-main"><div class="workspace-grid"><section class="panel" aria-label="Entrada da ferramenta"><div class="panel-head">${icon('edit',19)}<h2>Configure sua ferramenta</h2><small>ENTRADA</small></div><div class="panel-body"><form id="tool-form" class="form-stack">${forms}<div class="form-actions"><button class="btn btn-primary" type="submit" id="execute-button">${icon('play',17)} Executar ferramenta</button><button class="btn btn-ghost btn-sm" type="reset" data-action="clear-form">Limpar</button></div></form></div></section><section class="panel result-panel" aria-live="polite"><div class="panel-head">${icon('terminal',19)}<h2>Resultado</h2><small>SAÍDA</small></div><div class="panel-body" id="result-content"><div class="result-empty"><div class="result-empty-icon">${icon('sparkles',28)}</div><strong>Tudo pronto por aqui</strong><p>Preencha as informações ao lado e execute a ferramenta para visualizar o resultado.</p></div></div></section></div><div class="workspace-tip">${icon('shield',20)}<div><strong>Segurança e privacidade</strong><p>Os dados usados nas ferramentas são processados pela API do próprio projeto e não são armazenados. Evite incluir dados pessoais, senhas ou credenciais. A validação XML é sintática e não substitui a verificação fiscal oficial.</p></div></div></div></div>`);
}
function releasePage() {
  const content = state.releases.length ? `<div class="container release-items">${state.releases.map(r=>`<article class="release-item"><small>${esc(r.product || 'Produto')} ${r.version ? ' • '+esc(r.version) : ''} ${r.published_at ? ' • '+esc(r.published_at) : ''}</small><h3>${esc(r.title)}</h3><p>${esc(r.summary || '')}</p>${r.url && /^https:\/\//.test(r.url) ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Consultar fonte oficial ${icon('arrow-up-right',14)}</a>` : ''}</article>`).join('')}</div>` : `<div class="container"><div class="empty-state"><div class="empty-state-icon">${icon('bell',28)}</div><h2>Em breve, novidades por aqui.</h2><p>A estrutura desta seção já está pronta. Ainda não há releases reais cadastradas; nenhuma versão foi inventada para preencher o MVP.</p><button class="btn btn-outline" data-action="open-idea">${icon('lightbulb',16)} Sugerir uma integração</button></div></div>`;
  shell(`<section class="page-header"><div class="container"><a href="/" data-link class="back-link release-back">${icon('arrow-left')} Página inicial</a><div><span class="kicker"><span class="kicker-dot"></span> CONHECIMENTO E VERSÕES</span><h1>Últimas releases</h1><p>Um ponto de consulta para manter as equipes informadas sobre melhorias, correções e novidades dos produtos. Exiba aqui somente dados de fontes oficiais.</p></div></div></section>${content}`);
}
function notFound() {
  shell(`<div class="container"><div class="empty-state"><div class="empty-state-icon">${icon('search',28)}</div><h2>Página não encontrada</h2><p>Esse endereço não corresponde a uma ferramenta disponível no momento.</p>${link('/','Voltar ao início','btn btn-primary')}</div></div>`);
}
async function refreshContent(){
  const [me,releases]=await Promise.all([request('/api/auth/me'),request('/api/releases')]);state.user=me.user;state.releases=releases.releases;
  if(state.user){
    const [notices,videos,links]=await Promise.all([request('/api/notices'),request('/api/videos'),request('/api/links')]);
    state.notices=notices.notices;state.videos=videos.videos;state.links=links.links;
  }else{state.notices=[];state.videos=[];state.links=[];state.adminNotices=[];state.users=[];}
}
async function renderRoute() {
  window.scrollTo({top:0});
  try {
    if(!state.tools.length){const [catalog,releases]=await Promise.all([request('/api/tools'),request('/api/releases')]);state.tools=catalog.tools;state.releases=releases.releases;}
    state.portal=(await request('/api/portal')).portal;
    await refreshContent();
    const path=decodeURI(location.pathname);document.title='Linxtools • Portal da Operação';
    if(path==='/')homePage();
    else if(path==='/login')loginPage();
    else if(path==='/mural')muralPage();
    else if(/^\/mural\/[a-f\d-]{36}$/.test(path)){
      const notice=state.notices.find(n=>n.id===path.split('/')[2]);noticeDetailPage(notice);
    }
    else if(path==='/aprender')learnPage();
    else if(path==='/admin'||path==='/operacao'){
      if(canPublish()){
        const jobs=[request('/api/admin/overview')];
        if(canManage('notices'))jobs.push(request('/api/admin/notices'));
        if(canManage('releases'))jobs.push(request('/api/admin/releases'));
        if(canManage('links'))jobs.push(request('/api/admin/links'));
        if(state.user.role==='admin')jobs.push(request('/api/admin/users'));
        const results=await Promise.all(jobs);state.overview=results.shift().overview;
        if(canManage('notices'))state.adminNotices=results.shift().notices;
        if(canManage('releases'))state.adminReleases=results.shift().releases;
        if(canManage('links'))state.adminLinks=results.shift().links;
        if(state.user.role==='admin')state.users=results.shift().users;
      }
      adminPage();
    }
    else if(path==='/links')linksPage();
    else if(path==='/releases')releasePage();
    else if(/^\/tools\/[a-z-]+$/.test(path))workspacePage(path.split('/')[2]);
    else notFound();
    if(location.hash)setTimeout(()=>$(location.hash)?.scrollIntoView(),50);
  }catch(error){$('#app').innerHTML=`<div class="boot-screen boot-error"><strong>Não foi possível conectar à API.</strong><p>${esc(error.message)}</p><button class="btn btn-primary" data-action="reload-page">Tentar novamente</button></div>`;}
}
function navigate(path) {
  history.pushState({}, '', path);
  state.filter='Todas'; state.query='';
  renderRoute();
}
function showToast(message) {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');toast.className='toast';toast.setAttribute('role','status');toast.textContent=message;document.body.append(toast);setTimeout(() => toast.remove(),3000);
}
function showError(err) {
  const result = $('#result-content');
  if (result) result.innerHTML = `<div class="alert-error"><strong>Não foi possível concluir a operação.</strong><div id="error-detail"></div></div>`;
  $('#error-detail') && ($('#error-detail').textContent = err.message);
}
function showResult(result) {
  state.lastOutput = result.output;
  const host = $('#result-content');
  host.innerHTML = `<div class="result-headline"><strong id="result-title"></strong><span class="result-success">${icon('check-circle',14)} CONCLUÍDO</span></div><pre class="output" id="result-output"></pre>${result.note ? `<p class="output-note" id="result-note"></p>` : ''}<div class="output-toolbar"><button type="button" class="btn btn-outline btn-sm" data-action="copy-output">${icon('copy',16)} Copiar resultado</button></div>`;
  $('#result-title').textContent = result.title;
  $('#result-output').textContent = result.output;
  if (result.note) $('#result-note').textContent = result.note;
  if (window.innerWidth < 780) host.scrollIntoView({ behavior:'smooth',block:'center' });
}

const dateLabel = value => value ? new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value)) : '—';
const dateInput = value => value ? new Date(new Date(value).getTime()-new Date(value).getTimezoneOffset()*60000).toISOString().slice(0,16) : '';
const canManage = permission => state.user?.role==='admin' || Boolean(state.user?.permissions?.includes(permission));
const canPublish = () => ['notices','videos','releases','links'].some(canManage);
const badgeStyle = value => ({Urgente:'danger',Treinamento:'violet',Procedimento:'blue',Geral:'neutral'}[value] || 'neutral');
const requireSignIn = (title,copy) => `<section class="container portal-gate"><div class="gate-icon">${icon('lock',28)}</div><span class="kicker">ACESSO DA OPERAÇÃO</span><h1>${title}</h1><p>${copy}</p>${link('/login',`Entrar com minha conta ${icon('arrow-right')}`,'btn btn-primary')}</div></section>`;
function noticeCard(n, compact = false) {
  return `<a class="notice-card ${n.pinned?'notice-pinned':''} ${compact?'notice-compact':''}" href="/mural/${esc(n.id)}" data-link>
    <div class="notice-top"><span class="notice-category category-${badgeStyle(n.category)}">${esc(n.category)}</span>${n.pinned?`<span class="notice-pin">${icon('pin',14)} Fixado</span>`:''}</div>
    <h3>${esc(n.title)}</h3><p>${esc(n.body.slice(0,compact?130:190))}${n.body.length>(compact?130:190)?'…':''}</p>
    <div class="notice-meta"><span>${icon('calendar',14)} ${dateLabel(n.published_at || n.created_at)}</span><span>${n.requires_ack ? n.acknowledged? `${icon('check-circle',14)} Ciente`:`${icon('bell',14)} Requer ciência` : `Ler comunicado ${icon('arrow-up-right',15)}`}</span></div></a>`;
}
function homeNoticeSection() {
  return `<section class="portal-notices"><div class="container"><div class="portal-section-heading"><div><span class="kicker">COMUNICAÇÃO INTERNA</span><h2>Mural da operação <span class="heading-dot">.</span></h2><p>Informações importantes, no momento em que você precisa.</p></div>${link('/mural',`Ver todos os avisos ${icon('arrow-right',18)}`,'btn btn-light')}</div>
  ${state.user ? (state.notices.length ? `<div class="notice-featured-grid">${state.notices.slice(0,3).map(n=>noticeCard(n,true)).join('')}</div>` : `<div class="portal-empty-small">${icon('bell',23)} Ainda não há comunicados publicados.</div>`) : `<div class="mural-locked"><div class="locked-icon">${icon('lock',26)}</div><div><strong>Os comunicados são exclusivos da operação</strong><p>Entre com sua conta para visualizar atualizações e orientações da liderança.</p></div>${link('/login','Entrar no mural','btn btn-primary')}</div>`}
  </div></section>`;
}
function videoTeaser() {
  return `<section class="learning-promo"><div class="container learning-promo-inner"><div class="learning-illustration"><div class="learning-illustration-inner">${icon('play',36)}</div><div class="learning-pill">EM EVOLUÇÃO</div></div><div><span class="kicker">CONHECIMENTO EM MOVIMENTO</span><h2>Aprenda no seu ritmo.</h2><p>Uma biblioteca de treinamentos e tutoriais para apoiar a operação. A liderança já pode cadastrar vídeos do YouTube ou Vimeo.</p>${link('/aprender',`Explorar aprendizado ${icon('arrow-right')}`,'btn btn-primary')}</div></div></section>`;
}
function loginPage() {
  if(state.user) { navigate('/mural');return; }
  shell(`<section class="auth-page"><div class="auth-art"><div class="auth-art-content"><span class="kicker">LINXTOOLS • ACESSO INTERNO</span><h1>Conhecimento, ferramentas e equipe conectados.</h1><p>Comunicados da liderança, capacitação e ferramentas em uma única central.</p><div class="auth-art-graphic">${icon('shield',52)}<span>SEU ESPAÇO DE TRABALHO</span></div></div></div><div class="auth-form-wrap"><form class="auth-form" id="login-form"><span class="kicker">BEM-VINDO DE VOLTA</span><h2>Acesse sua conta</h2><p>Utilize o email e a senha cadastrados pelo administrador.</p><label class="field-label" for="login-email">Email</label><input class="control" id="login-email" name="email" type="email" autocomplete="username" placeholder="voce@empresa.com" required /><label class="field-label" for="login-password">Senha</label><input class="control" id="login-password" name="password" type="password" autocomplete="current-password" required /><div id="login-error" role="alert"></div><button class="btn btn-primary btn-full" type="submit">Entrar na plataforma ${icon('arrow-right',17)}</button><small>Contas são criadas pela administração da plataforma.</small></form></div></section>`);
}
function muralPage() {
  if(!state.user){shell(requireSignIn('Mural da operação','Para proteger as orientações internas, os comunicados ficam disponíveis somente para colaboradores autenticados.'));return;}
  shell(`<section class="portal-page-head"><div class="container"><div class="portal-header-line"><div><span class="kicker">COMUNICADOS DA LIDERANÇA</span><h1>Mural da operação<span class="heading-dot">.</span></h1><p>Acompanhe atualizações, orientações e informações para o dia a dia.</p></div>${canManage('notices')?link('/operacao',`${icon('edit',16)} Nova publicação`,'btn btn-primary'):''}</div></div></section>
    <section class="container mural-content"><div class="mural-toolbar"><label class="mural-search">${icon('search',18)}<input type="search" id="notice-search" placeholder="Pesquisar avisos..." aria-label="Pesquisar comunicados"></label><select id="notice-category-filter" class="control" aria-label="Filtrar por categoria"><option value="Todos">Todas as categorias</option>${['Geral','Procedimento','Treinamento','Urgente'].map(n=>`<option value="${n}">${n}</option>`).join('')}</select></div><div class="notice-featured-grid" id="notice-list"></div></section>`);
  renderNotices();
}
function renderNotices(){
  const host=$('#notice-list');if(!host)return;
  const query=($('#notice-search')?.value || '').toLocaleLowerCase('pt-BR');const category=$('#notice-category-filter')?.value || 'Todos';
  const notices=state.notices.filter(n=>(category==='Todos'||n.category===category)&&`${n.title} ${n.body} ${n.author_name}`.toLocaleLowerCase('pt-BR').includes(query));
  host.innerHTML=notices.length?notices.map(n=>noticeCard(n)).join(''):`<div class="portal-empty-small">${icon('search',24)} Nenhum comunicado encontrado.</div>`;
}
function noticeDetailPage(notice) {
  if(!state.user){shell(requireSignIn('Comunicado restrito','Entre com sua conta para ler os comunicados da liderança.'));return;}
  if(!notice){notFound();return;}
  const body=esc(notice.body).replace(/\n/g,'<br>');
  shell(`<section class="portal-page-head portal-detail-head"><div class="container"><a href="/mural" data-link class="portal-back">${icon('arrow-left',16)} Voltar ao mural</a><div class="detail-labels"><span class="notice-category category-${badgeStyle(notice.category)}">${esc(notice.category)}</span>${notice.pinned?'<span class="notice-pin">Fixado pela liderança</span>':''}</div><h1>${esc(notice.title)}</h1><p>${esc(notice.author_name || 'Liderança')} · ${dateLabel(notice.published_at || notice.created_at)}</p></div></section>
  <section class="container detail-area"><article class="detail-content"><div class="detail-copy">${body}</div>${notice.requires_ack ? `<div class="ack-box">${notice.acknowledged? `${icon('check-circle',24)} <div><strong>Leitura confirmada</strong><p>Você já confirmou ciência deste comunicado.</p></div>`:`${icon('bell',24)}<div><strong>Confirmação de ciência solicitada</strong><p>Confirme apenas após ler as orientações.</p></div><button class="btn btn-primary btn-sm" data-action="ack-notice" data-id="${esc(notice.id)}">Confirmar ciência</button>`}</div>` : ''}</article><aside class="detail-aside"><strong>Sobre o comunicado</strong><p>Publicado em ${dateLabel(notice.published_at || notice.created_at)}</p><p>Categoria: ${esc(notice.category)}</p><p>Responsável: ${esc(notice.author_name || 'Liderança')}</p>${link('/mural','Ver outros comunicados','btn btn-outline btn-sm')}</aside></section>`);
}
function learnPage() {
  if(!state.user){shell(requireSignIn('Central de aprendizado','Os vídeos e treinamentos são destinados aos colaboradores. Entre para consultar o conteúdo.'));return;}
  shell(`<section class="portal-page-head"><div class="container"><span class="kicker">VÍDEOS E TREINAMENTOS</span><h1>Central de aprendizado<span class="heading-dot">.</span></h1><p>Aprenda processos, explore tutoriais e acompanhe conteúdos da operação.</p></div></section><section class="container learning-area">${state.videos.length?`<div class="video-grid">${state.videos.map(v=>`<article class="video-card"><div class="video-thumbnail"><span class="video-play">${icon('play',27)}</span><span class="video-provider">${esc(v.provider)}</span></div><div class="video-card-body"><small>${esc(v.category)}</small><h3>${esc(v.title)}</h3><p>${esc(v.description)}</p><button class="btn btn-outline btn-sm" data-action="watch-video" data-id="${esc(v.id)}">${icon('play',15)} Assistir vídeo</button></div></article>`).join('')}</div>`:`<div class="video-empty"><div class="video-empty-icon">${icon('play',38)}</div><h2>Uma nova forma de aprender está chegando.</h2><p>A biblioteca já está preparada. Os primeiros vídeos aparecerão aqui assim que forem cadastrados pela liderança.</p>${canManage('videos')?link('/operacao',`Cadastrar primeiro vídeo ${icon('arrow-right')}`,'btn btn-primary'):''}</div>`}</section><dialog id="video-dialog" class="dialog video-dialog"><div class="video-dialog-top"><h2 id="video-title">Treinamento</h2><button class="dialog-close" data-action="close-video" aria-label="Fechar vídeo">${icon('x')}</button></div><div class="video-embed" id="video-embed"></div></dialog>`);
}
function linksPage(){
  if(!state.user){shell(requireSignIn('Links úteis da operação','Entre com sua conta para consultar referências internas.'));return;}
  shell(`<section class="portal-page-head"><div class="container"><span class="kicker">RECURSOS DA OPERAÇÃO</span><h1>Links úteis<span class="heading-dot">.</span></h1><p>Referências e páginas selecionadas pela liderança.</p></div></section><section class="container learning-area"><div class="useful-link-grid">${state.links.length?state.links.map(l=>`<article class="useful-link"><span class="notice-category category-blue">${esc(l.category)}</span><h3>${esc(l.title)}</h3><p>${esc(l.description||'Acesso rápido para a operação.')}</p><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Abrir recurso ${icon('arrow-up-right',15)}</a></article>`).join(''):`<div class="portal-empty-small">Ainda não há links publicados.</div>`}</div></section>`);
}
const adminSections=[['overview','grid','Visão geral'],['notices','megaphone','Comunicados'],['videos','play','Vídeos'],['releases','rocket','Releases'],['links','link','Links úteis'],['users','users','Usuários'],['settings','settings','Configurações']];
function availableAdminTabs(){return adminSections.filter(([name])=>name==='overview'||(name==='users'||name==='settings'?state.user?.role==='admin':canManage(name)));}
function panelHeader(heading,description,button='') {return `<div class="admin-panel-head"><div><h2>${heading}</h2><p>${description}</p></div>${button}</div>`;}
function itemActions(type,item){return `<div class="admin-actions"><button data-action="edit-${type}" data-id="${esc(item.id)}" title="Editar" aria-label="Editar">${icon('edit',16)}</button><button data-action="archive-${type}" data-id="${esc(item.id)}" title="Arquivar" aria-label="Arquivar">${icon('trash',16)}</button></div>`;}
function adminContent(){
 const tab=state.adminTab;
 if(tab==='overview')return `<div class="admin-welcome"><span class="kicker">GESTÃO DA OPERAÇÃO</span><h2>Bem-vindo ao seu painel, ${esc(state.user.name.split(' ')[0])}.</h2><p>Crie publicações, organize conteúdos e mantenha sua equipe informada.</p></div><div class="dashboard-stats">${[['megaphone','Comunicados',state.overview.notices||0],['play','Vídeos',state.overview.videos||0],['rocket','Releases',state.overview.releases||0],['link','Links',state.overview.links||0]].map(([i,label,value])=>`<div class="dashboard-stat">${icon(i,24)}<b>${value}</b><span>${label}</span></div>`).join('')}</div><div class="admin-panel">${panelHeader('Ações rápidas','Escolha o que deseja cadastrar ou publicar.') }<div class="quick-grid">${availableAdminTabs().filter(t=>!['overview','users','settings'].includes(t[0])).map(([key,i,label])=>`<button class="quick-card" data-action="tab-admin" data-tab="${key}">${icon(i,23)}<strong>${label}</strong><small>Gerenciar publicações ${icon('arrow-right',13)}</small></button>`).join('')}</div></div><div class="admin-hint">${icon('shield',21)} Os colaboradores só visualizam conteúdos publicados. Rascunhos, agendamentos e configurações ficam restritos aos perfis autorizados.</div>`;
 if(tab==='notices')return `<div class="admin-panel">${panelHeader(`${icon('megaphone',22)} Comunicados`,'Gerencie o mural e publique orientações para a operação.',`<button class="btn btn-primary btn-sm" data-action="new-notice">${icon('plus',16)} Novo comunicado</button>`)}<div class="admin-list">${state.adminNotices.map(n=>`<div class="admin-list-item"><div><span class="notice-category category-${badgeStyle(n.category)}">${esc(n.category)}</span><strong>${esc(n.title)}</strong><small>${n.archived_at?'Arquivado':n.status==='draft'?'Rascunho':n.published_at && new Date(n.published_at)>new Date()?'Agendado':'Publicado'} · ${dateLabel(n.created_at)}</small></div>${itemActions('notice',n)}</div>`).join('')||'<div class="admin-list-empty">Nenhum comunicado cadastrado.</div>'}</div></div>`;
 if(tab==='videos')return `<div class="admin-panel">${panelHeader(`${icon('play',21)} Treinamentos em vídeo`,'Cadastre links HTTPS válidos do YouTube ou Vimeo.')}<form class="form-stack compact-form" id="video-form"><input type="hidden" name="id"/><div class="form-row"><label class="field-label">Título<input class="control" name="title" maxlength="140" required placeholder="Treinamento de atendimento"/></label><label class="field-label">Categoria<input class="control" name="category" maxlength="50" value="Treinamento" required/></label></div><label class="field-label">URL do vídeo<input class="control" name="url" type="url" required placeholder="https://www.youtube.com/watch?v=..."/></label><label class="field-label">Descrição<input class="control" name="description" maxlength="1500" placeholder="Sobre o conteúdo..."/></label><button class="btn btn-primary btn-sm" type="submit">${icon('plus',16)} Cadastrar vídeo</button><div id="video-form-status"></div></form><div class="admin-list">${state.videos.map(v=>`<div class="admin-list-item"><div><strong>${esc(v.title)}</strong><small>${esc(v.category)} · ${esc(v.provider)}</small></div><div class="admin-actions"><button data-action="edit-video" data-id="${esc(v.id)}" aria-label="Editar vídeo">${icon('edit',16)}</button><button data-action="remove-video" data-id="${esc(v.id)}" aria-label="Remover vídeo">${icon('trash',16)}</button></div></div>`).join('')||'<div class="admin-list-empty">Nenhum vídeo cadastrado.</div>'}</div></div>`;
 if(tab==='releases')return `<div class="admin-panel">${panelHeader(`${icon('rocket',21)} Releases`,'Cadastre novidades e atualizações dos produtos.',`<button class="btn btn-primary btn-sm" data-action="new-release">${icon('plus',16)} Nova release</button>`)}<div class="admin-list">${state.adminReleases.map(r=>`<div class="admin-list-item"><div><span class="notice-category category-blue">${esc(r.product)}</span><strong>${esc(r.title)}</strong><small>${r.archived_at?'Arquivada':r.status==='draft'?'Rascunho':'Publicada'} · ${esc(r.version||'Sem versão')} · ${dateLabel(r.published_at)}</small></div>${!r.archived_at?itemActions('release',r):''}</div>`).join('')||'<div class="admin-list-empty">Nenhuma release cadastrada.</div>'}</div></div>`;
 if(tab==='links')return `<div class="admin-panel">${panelHeader(`${icon('link',21)} Links úteis`,'Gerencie os recursos acessíveis aos colaboradores.',`<button class="btn btn-primary btn-sm" data-action="new-link">${icon('plus',16)} Novo link</button>`)}<div class="admin-list">${state.adminLinks.map(l=>`<div class="admin-list-item"><div><span class="notice-category category-blue">${esc(l.category)}</span><strong>${esc(l.title)}</strong><small>${l.archived_at?'Arquivado':l.status==='draft'?'Rascunho':'Publicado'} · ${esc(l.url).slice(0,65)}</small></div>${!l.archived_at?itemActions('link',l):''}</div>`).join('')||'<div class="admin-list-empty">Nenhum link cadastrado.</div>'}</div></div>`;
 if(tab==='users')return `<div class="admin-panel">${panelHeader(`${icon('users',21)} Gestão de usuários`,'Habilite contas, altere perfis e conceda acesso à publicação.',`<button class="btn btn-primary btn-sm" data-action="new-user">${icon('plus',16)} Novo usuário</button>`)}<div class="user-table">${state.users.map(u=>`<div class="user-row"><span class="user-avatar">${esc(u.name.charAt(0).toUpperCase())}</span><div class="user-identity"><strong>${esc(u.name)}${u.id===state.user.id?' (você)':''}</strong><small>${esc(u.email)}</small><div class="permission-tags">${(u.permissions||[]).map(p=>`<i>${({notices:'Mural',videos:'Vídeos',releases:'Releases',links:'Links'})[p]||esc(p)}</i>`).join('')}</div></div><span class="user-role">${esc(u.role)}</span><span class="user-status ${u.active===false?'off':''}">${u.active===false?'Bloqueado':'Ativo'}</span><button class="btn btn-outline btn-sm" data-action="edit-user" data-id="${esc(u.id)}">Editar</button></div>`).join('')}</div></div>`;
 if(tab==='settings')return `<div class="admin-panel">${panelHeader(`${icon('settings',21)} Personalização do portal`,'Altere o destaque da página inicial e publique avisos no topo.')}<form id="portal-form" class="form-stack compact-form"><label class="field-label">Título da página inicial<input name="hero_title" class="control" maxlength="110" value="${esc(state.portal.hero_title||'')}" /></label><label class="field-label">Descrição de apresentação<textarea name="hero_description" class="control" maxlength="380">${esc(state.portal.hero_description||'')}</textarea></label><label class="field-label">Texto do aviso em destaque<input name="banner_text" class="control" maxlength="230" value="${esc(state.portal.banner_text||'')}" placeholder="Ex.: Atualização de processo disponível no mural"/></label><label class="checkline"><input type="checkbox" name="banner_enabled" ${state.portal.banner_enabled?'checked':''}/> Exibir aviso no topo da página inicial</label><button type="submit" class="btn btn-primary btn-sm">${icon('check',16)} Salvar configurações</button><div id="portal-form-status"></div></form></div>`;
 return '';
}
function adminPage(){
 if(!canPublish()){shell(requireSignIn('Portal da Operação','Seu perfil não está habilitado para gerenciar publicações. Solicite acesso ao administrador.'));return;}
 if(!availableAdminTabs().some(a=>a[0]===state.adminTab))state.adminTab='overview';
 shell(`<div class="management-shell"><aside class="management-sidebar"><div class="management-brand">${icon('shield',22)} <div><strong>Portal da Operação</strong><span>BACKOFFICE · LINXTOOLS</span></div></div><div class="management-group-title">GERENCIAMENTO</div><nav aria-label="Menu do painel">${availableAdminTabs().map(([key,i,label])=>`<button type="button" class="management-nav ${state.adminTab===key?'selected':''}" data-action="tab-admin" data-tab="${key}">${icon(i,18)}<span>${label}</span>${state.adminTab===key?icon('arrow-right',15):''}</button>`).join('')}</nav><div class="management-sidebar-bottom"><span class="user-avatar">${esc(state.user.name.charAt(0))}</span><div><strong>${esc(state.user.name)}</strong><small>${state.user.role==='admin'?'Administrador':'Editor autorizado'}</small></div></div></aside><section class="management-main"><div class="management-topbar"><span>Linxtools / ${esc(availableAdminTabs().find(t=>t[0]===state.adminTab)?.[2]||'Portal')}</span>${link('/',`${icon('arrow-up-right',15)} Visualizar site`,'btn btn-outline btn-sm')}</div><div class="management-content"><div class="management-head"><span class="kicker">ÁREA RESTRITA</span><h1>${esc(availableAdminTabs().find(t=>t[0]===state.adminTab)?.[2]||'Portal')}</h1><p>Área administrativa para publicação e gestão de conteúdo da operação.</p></div>${adminContent()}</div></section></div>
 <dialog class="dialog notice-dialog" id="notice-dialog"><div class="dialog-head"><div><span class="kicker">COMUNICAÇÃO INTERNA</span><h2 id="notice-dialog-heading">Novo comunicado</h2><p>As alterações serão exibidas no mural conforme o status.</p></div><button class="dialog-close" data-action="close-notice" aria-label="Fechar">${icon('x')}</button></div><div class="dialog-body"><form id="notice-form" class="form-stack"><input type="hidden" name="id"/><label class="field-label">Título<input class="control" name="title" maxlength="140" required placeholder="Assunto do comunicado" /></label><label class="field-label">Mensagem<textarea class="control" name="body" maxlength="8000" required placeholder="Escreva a orientação..." style="min-height:180px"></textarea></label><div class="form-row"><label class="field-label">Categoria<select class="control" name="category"><option>Geral</option><option>Procedimento</option><option>Treinamento</option><option>Urgente</option></select></label><label class="field-label">Prioridade<select class="control" name="priority"><option value="normal">Normal</option><option value="important">Importante</option><option value="critical">Crítica</option></select></label></div><div class="form-row"><label class="field-label">Publicar em (opcional)<input class="control" type="datetime-local" name="published_at" /></label><label class="field-label">Expira em (opcional)<input class="control" type="datetime-local" name="expires_at" /></label></div><div class="notice-options"><label><input type="checkbox" name="pinned"/> Fixar no topo</label><label><input type="checkbox" name="requires_ack"/> Solicitar confirmação de leitura</label></div><label class="field-label">Status<select class="control" name="status"><option value="published">Publicar</option><option value="draft">Salvar rascunho</option></select></label><div id="notice-form-status"></div><button class="btn btn-primary btn-full" type="submit">Salvar comunicado ${icon('check',16)}</button></form></div></dialog>
 <dialog class="dialog notice-dialog" id="content-dialog"><div class="dialog-head"><div><span class="kicker">PORTAL DA OPERAÇÃO</span><h2 id="content-heading">Nova publicação</h2><p>Configure e salve o conteúdo no portal.</p></div><button class="dialog-close" data-action="close-content" aria-label="Fechar">${icon('x')}</button></div><div class="dialog-body" id="content-dialog-body"></div></dialog>
 <dialog class="dialog notice-dialog" id="user-dialog"><div class="dialog-head"><div><span class="kicker">GESTÃO DE ACESSO</span><h2 id="user-dialog-title">Conta da equipe</h2><p>Somente administradores podem definir perfis e permissões.</p></div><button class="dialog-close" data-action="close-user" aria-label="Fechar">${icon('x')}</button></div><div class="dialog-body" id="user-dialog-body"></div></dialog>`);
}
function openContentEditor(type,item=null){
 const formId=type==='release'?'release-form':'link-form';const title=type==='release'?'release':'link';
 $('#content-heading').textContent=item?`Editar ${title}`:`Novo ${title}`;
 const content=type==='release'?`<div class="form-row"><label class="field-label">Produto<input class="control" name="product" maxlength="90" value="${esc(item?.product||'')}" required/></label><label class="field-label">Versão<input class="control" name="version" maxlength="60" value="${esc(item?.version||'')}"/></label></div><label class="field-label">Título<input class="control" name="title" maxlength="140" value="${esc(item?.title||'')}" required/></label><label class="field-label">Resumo<textarea class="control" maxlength="1600" name="summary">${esc(item?.summary||'')}</textarea></label><div class="form-row"><label class="field-label">Data<input class="control" type="date" name="published_at" value="${esc(item?.published_at?.slice(0,10)||new Date().toISOString().slice(0,10))}" required/></label><label class="field-label">URL oficial (opcional)<input class="control" type="url" name="url" value="${esc(item?.url||'')}"/></label></div>`:`<label class="field-label">Título<input class="control" name="title" maxlength="120" value="${esc(item?.title||'')}" required/></label><div class="form-row"><label class="field-label">Categoria<input class="control" name="category" maxlength="55" value="${esc(item?.category||'Geral')}"/></label><label class="field-label">URL HTTPS<input class="control" type="url" name="url" value="${esc(item?.url||'')}" required/></label></div><label class="field-label">Descrição<textarea class="control" maxlength="350" name="description">${esc(item?.description||'')}</textarea></label>`;
 $('#content-dialog-body').innerHTML=`<form id="${formId}" class="form-stack"><input type="hidden" name="id" value="${esc(item?.id||'')}"/>${content}<label class="field-label">Estado<select class="control" name="status"><option value="draft" ${item?.status==='draft'||!item?'selected':''}>Rascunho</option><option value="published" ${item?.status==='published'?'selected':''}>Publicar</option></select></label><div id="${formId}-status"></div><button class="btn btn-primary" type="submit">${icon('check',16)} Salvar ${title}</button></form>`;
 $('#content-dialog').showModal();
}
function openUserEditor(user=null){
 $('#user-dialog-title').textContent=user?'Editar conta':'Cadastrar usuário';
 const enabled=user?.active!==false;
 $('#user-dialog-body').innerHTML=`<form id="${user?'user-edit-form':'user-form'}" class="form-stack"><input type="hidden" name="id" value="${esc(user?.id||'')}"/><label class="field-label">Nome<input class="control" name="name" required maxlength="120" value="${esc(user?.name||'')}" /></label>${user?`<p class="form-help">Email: ${esc(user.email)}</p>`:`<label class="field-label">Email<input class="control" name="email" type="email" required maxlength="254"/></label>`}<div class="form-row"><label class="field-label">Perfil<select class="control" name="role">${[['analista','Analista'],['lideranca','Liderança'],['admin','Administrador']].map(([key,label])=>`<option value="${key}" ${user?.role===key?'selected':''}>${label}</option>`).join('')}</select></label><label class="field-label">${user?'Nova senha (opcional)':'Senha inicial (mín. 12 caracteres)'}<input class="control" name="password" type="password" minlength="12" maxlength="128" ${user?'':'required'} autocomplete="new-password"/></label></div><label class="checkline"><input type="checkbox" name="active" ${enabled?'checked':''}/> Conta habilitada para acesso</label><div class="permission-editor"><strong>Permissões de publicação</strong><p>Administradores têm todas as permissões. Os demais perfis usam a seleção abaixo.</p>${[['notices','Publicar comunicados'],['videos','Cadastrar vídeos'],['releases','Publicar releases'],['links','Gerenciar links úteis']].map(([key,label])=>`<label class="checkline"><input type="checkbox" name="perm_${key}" ${user?.permissions?.includes(key)?'checked':''}/> ${label}</label>`).join('')}</div><div id="user-edit-status"></div><button class="btn btn-primary" type="submit">${icon('check',16)} Salvar conta</button></form>`;
 $('#user-dialog').showModal();
}

function openNoticeEditor(notice=null){
  const dialog=$('#notice-dialog');const form=$('#notice-form');if(!dialog||!form)return;
  form.reset();form.elements.id.value=notice?.id||'';
  $('#notice-dialog-heading').textContent=notice?'Editar comunicado':'Novo comunicado';
  if(notice){
    for(const name of ['title','body','category','priority','status'])form.elements[name].value=notice[name]||'';
    for(const name of ['published_at','expires_at'])form.elements[name].value=dateInput(notice[name]);
    for(const name of ['pinned','requires_ack'])form.elements[name].checked=Boolean(notice[name]);
  }
  $('#notice-form-status').textContent='';dialog.showModal();
}
// Interações delegadas. A UI não acessa banco ou regras de negócio diretamente.
document.addEventListener('click', async e => {
  const target = e.target.closest('[data-link],[data-scroll],[data-action],[data-filter]');
  if (!target) return;
  if (target.dataset.link !== undefined) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || target.target === '_blank') return;
    e.preventDefault(); navigate(target.getAttribute('href')); return;
  }
  if (target.dataset.scroll) {
    e.preventDefault();
    const id = target.dataset.scroll;
    if (location.pathname !== '/') { navigate(`/#${id}`); }
    else { history.replaceState({},'',`/#${id}`); $(`#${id}`)?.scrollIntoView({behavior:'smooth'}); }
    return;
  }
  if (target.dataset.filter !== undefined) {
    state.filter=target.dataset.filter; renderFilters(); renderGrid(); return;
  }
  switch (target.dataset.action) {
    case 'reload-page': location.reload(); break;
    case 'logout': {try{await request('/api/auth/logout',{method:'POST',body:'{}'});showToast('Você saiu da plataforma.');navigate('/');}catch(err){showToast(err.message);}break;}
    case 'ack-notice': {try{await request(`/api/notices/${target.dataset.id}/ack`,{method:'POST',body:'{}'});showToast('Leitura confirmada.');await renderRoute();}catch(err){showToast(err.message);}break;}
    case 'close-video': {const dialog=$('#video-dialog');dialog?.close();$('#video-embed').innerHTML='';break;}
    case 'watch-video': {const video=state.videos.find(v=>v.id===target.dataset.id);if(!video)return;
      // O iframe só aceita links gerados a partir de provedores autorizados.
      const src=video.provider==='youtube' && /^[a-zA-Z0-9_-]{11}$/.test(video.provider_id)?`https://www.youtube-nocookie.com/embed/${video.provider_id}`:
        video.provider==='vimeo' && /^\d{6,12}$/.test(video.provider_id)?`https://player.vimeo.com/video/${video.provider_id}`:null;
      if(!src){showToast('Link do vídeo inválido.');return;}
      $('#video-title').textContent=video.title;$('#video-embed').innerHTML=`<iframe src="${src}" title="${esc(video.title)}" allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
      $('#video-dialog').showModal();break;}
    case 'tab-admin': state.adminTab=target.dataset.tab;adminPage();break;
    case 'new-release': openContentEditor('release');break;
    case 'edit-video': {const v=state.videos.find(v=>v.id===target.dataset.id);const f=$('#video-form');if(!v||!f)return;f.elements.id.value=v.id;f.elements.title.value=v.title;f.elements.category.value=v.category;f.elements.url.value=v.external_url;f.elements.description.value=v.description||'';f.scrollIntoView({behavior:'smooth',block:'center'});showToast('Edite os campos e salve o vídeo.');break;}
    case 'new-link': openContentEditor('link');break;
    case 'edit-release': {const r=state.adminReleases.find(r=>r.id===target.dataset.id);if(r)openContentEditor('release',r);break;}
    case 'edit-link': {const l=state.adminLinks.find(l=>l.id===target.dataset.id);if(l)openContentEditor('link',l);break;}
    case 'archive-release':
    case 'archive-link': {
      const type=target.dataset.action.split('-')[1];if(!confirm('Arquivar esta publicação?'))return;
      try{await request(`/api/admin/${type}s/${target.dataset.id}`,{method:'DELETE',body:'{}'});showToast('Publicação arquivada.');await renderRoute();}catch(err){showToast(err.message);}break;
    }
    case 'new-user': openUserEditor();break;
    case 'edit-user': {const u=state.users.find(u=>u.id===target.dataset.id);if(u)openUserEditor(u);break;}
    case 'close-user': $('#user-dialog')?.close();break;
    case 'close-content': $('#content-dialog')?.close();break;
    case 'new-notice': openNoticeEditor();break;
    case 'edit-notice': {const n=state.adminNotices.find(n=>n.id===target.dataset.id);if(n)openNoticeEditor(n);break;}
    case 'close-notice': $('#notice-dialog')?.close();break;
    case 'archive-notice': {if(!confirm('Arquivar este comunicado? Ele deixará de aparecer no mural.'))return;
      try{await request(`/api/admin/notices/${target.dataset.id}`,{method:'DELETE',body:'{}'});showToast('Comunicado arquivado.');await renderRoute();}catch(err){showToast(err.message);}break;}
    case 'remove-video': {if(!confirm('Remover este vídeo da biblioteca?'))return;
      try{await request(`/api/admin/videos/${target.dataset.id}`,{method:'DELETE',body:'{}'});showToast('Vídeo removido.');await renderRoute();}catch(err){showToast(err.message);}break;}
    case 'open-idea': $('#idea-dialog')?.showModal(); break;
    case 'close-idea': $('#idea-dialog')?.close(); break;
    case 'sample-json': $('#f-content').value=sampleJSON; break;
    case 'sample-xml': $('#f-content').value=sampleXML; break;
    case 'copy-output': {
      try { await navigator.clipboard.writeText(state.lastOutput);showToast('Resultado copiado!'); }
      catch {showToast('Não foi possível copiar automaticamente. Selecione o texto acima.');}
      break;
    }
    case 'clear-form': state.lastOutput='';$('#result-content').innerHTML=`<div class="result-empty"><div class="result-empty-icon">${icon('sparkles',28)}</div><strong>Campos limpos</strong><p>Preencha e execute para começar novamente.</p></div>`;break;
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'search-tools') { state.query=e.target.value; renderGrid(); }
  if (e.target.id === 'notice-search') renderNotices();
});
document.addEventListener('change', async e => {
  if (e.target.id === 'notice-category-filter') renderNotices();
  if (e.target.id === 'file-xml' && e.target.files?.[0]) {
    const file = e.target.files[0];
    if (file.size > 200_000) { showToast('O arquivo XML é maior que o limite permitido.'); e.target.value='';return; }
    $('#f-content').value=await file.text();
    showToast('XML carregado na área de texto.');
  }
});
document.addEventListener('submit', async e => {
  if (!['tool-form','idea-form','login-form','notice-form','video-form','user-form','user-edit-form','release-form','link-form','portal-form'].includes(e.target.id)) return;
  e.preventDefault();
  const form=e.target; const btn=form.querySelector('[type="submit"]');
  if (btn.disabled) return;
  btn.disabled=true;
  const oldHTML=btn.innerHTML;btn.innerHTML=`<span class="spinner spinner-small"></span> Processando...`;
  try {
    const payload=Object.fromEntries(new FormData(form));
    if(form.id==='login-form'){
      const response=await request('/api/auth/login',{method:'POST',body:JSON.stringify(payload)});
      state.user=response.user;form.reset();showToast(`Bem-vindo, ${state.user.name.split(' ')[0]}!`);navigate('/mural');
    }else if(form.id==='notice-form'){
      const id=payload.id;delete payload.id;
      payload.pinned=form.elements.pinned.checked;payload.requires_ack=form.elements.requires_ack.checked;
      for(const key of ['published_at','expires_at'])payload[key]=payload[key]?new Date(payload[key]).toISOString():null;
      const api=id?`/api/admin/notices/${id}`:'/api/admin/notices';
      await request(api,{method:id?'PATCH':'POST',body:JSON.stringify(payload)});
      $('#notice-dialog')?.close();showToast(id?'Comunicado atualizado!':'Comunicado criado!');await renderRoute();
    }else if(form.id==='video-form'){
      const id=payload.id;delete payload.id;await request(id?`/api/admin/videos/${id}`:'/api/admin/videos',{method:id?'PATCH':'POST',body:JSON.stringify(payload)});showToast(id?'Vídeo atualizado!':'Vídeo adicionado!');await renderRoute();
    }else if(form.id==='user-form'||form.id==='user-edit-form'){
      const userId=payload.id;delete payload.id;
      payload.active=form.elements.active.checked;
      payload.permissions=['notices','videos','releases','links'].filter(p=>form.elements[`perm_${p}`].checked);
      if(form.id==='user-edit-form'&&!payload.password)delete payload.password;
      await request(userId?`/api/admin/users/${userId}`:'/api/admin/users',{method:userId?'PATCH':'POST',body:JSON.stringify(payload)});
      $('#user-dialog')?.close();showToast('Conta salva com sucesso!');await renderRoute();
    }else if(form.id==='release-form'||form.id==='link-form'){
      const type=form.id==='release-form'?'releases':'links';const itemId=payload.id;delete payload.id;
      await request(`/api/admin/${type}${itemId?'/'+itemId:''}`,{method:itemId?'PATCH':'POST',body:JSON.stringify(payload)});
      $('#content-dialog')?.close();showToast('Publicação salva!');await renderRoute();
    }else if(form.id==='portal-form'){
      payload.banner_enabled=form.elements.banner_enabled.checked;
      await request('/api/admin/portal',{method:'PATCH',body:JSON.stringify(payload)});
      showToast('Configurações atualizadas!');await renderRoute();
    }else if (form.id === 'idea-form') {
      const result=await request('/api/ideas',{method:'POST',body:JSON.stringify(payload)});
      form.reset();$('#idea-status').innerHTML=`<div class="result-success idea-success">${icon('check-circle',16)} ${esc(result.message)}</div>`;
      showToast('Sugestão enviada!');
    } else {
      const slug=location.pathname.split('/')[2];
      const data=await request(`/api/tools/${slug}/execute`,{method:'POST',body:JSON.stringify(payload)});
      showResult(data.result);
    }
  } catch(err) {
    if(form.id==='idea-form')$('#idea-status').innerHTML=`<div class="alert-error" id="idea-error"></div>`,$('#idea-error').textContent=err.message;
    else if(['login-form','notice-form','video-form','user-form','user-edit-form','release-form','link-form','portal-form'].includes(form.id)){
      const targetId=({'login-form':'login-error','notice-form':'notice-form-status','video-form':'video-form-status','user-form':'user-edit-status','user-edit-form':'user-edit-status','release-form':'release-form-status','link-form':'link-form-status','portal-form':'portal-form-status'})[form.id];
      const el=document.getElementById(targetId);if(el){el.innerHTML='<div class="alert-error"></div>';el.firstElementChild.textContent=err.message;}
    }else showError(err);
  } finally {btn.disabled=false;btn.innerHTML=oldHTML;}
});
window.addEventListener('popstate',renderRoute);
renderRoute();
