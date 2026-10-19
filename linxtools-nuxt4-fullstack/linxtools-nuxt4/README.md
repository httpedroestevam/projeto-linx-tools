# Linxtools 2.0 — Nuxt 4 + Vue 3 + TypeScript + Nitro

Migração arquitetural do protótipo Linxtools V1.3. O frontend foi reescrito em **Vue 3 com `<script setup lang="ts">` e Nuxt 4**, o backend de rotas foi transferido para **Nuxt Server API (Nitro)** e as regras de negócio validadas da V1.3 foram preservadas em módulos JavaScript sob `server/legacy/`. Isso é deliberado para reduzir risco de regressões: uma conversão integral dessas regras para TypeScript pode ser feita depois, por domínio.

O sistema utiliza um único servidor full-stack. **Supabase é opcional**, e o armazenamento local mantém dados em `storage/data.json` por padrão. O modo Supabase utiliza o adaptador PostgREST da V1.3; **não utiliza Supabase Auth** e precisa de um projeto Supabase real para ser validado.

> Protótipo independente, **não oficial**, para validação de conceito. Não hospede dados da operação ou senhas corporativas reais em ambiente público antes de revisão de segurança.

## Requisitos

- **Node.js 20.19+** (recomendado **22 LTS**)
- **npm** com acesso à internet para instalar Nuxt e dependências pela primeira vez

## 1. Instalar e executar

```bash
npm install
npm run create:admin
npm run dev
```

Acesse:

- `http://127.0.0.1:3000` — página inicial
- `http://127.0.0.1:3000/tools` — Webee Tools
- `http://127.0.0.1:3000/login` — autenticação
- `http://127.0.0.1:3000/operacao` — Portal da Operação
- `http://127.0.0.1:3000/mural` — Mural da Operação
- `http://127.0.0.1:3000/aprender` — vídeo-aulas

**O comando correto para desenvolvimento é `npm run dev`, não `npm start`.** O `npm start` desta versão serve para executar um *build* já compilado.

Para produção (após configuração, segurança e hospedagem):

```bash
npm run build
npm start
```

### Administrador inicial

`npm run create:admin` solicita nome, email e senha de 12 a 128 caracteres no terminal. A senha digitada pode aparecer na tela do terminal. O sistema guarda apenas o hash derivado via scrypt. O nome é um campo separado do comando, então não digite `npm start` quando ele pedir o nome.

### Migrar os dados da V1.3 local

1. Faça cópia de segurança do `storage/data.json` original da V1.3.
2. Antes de criar um administrador novo ou ao decidir substituir a base local, execute:

```bash
node scripts/import-v13.mjs "CAMINHO_COMPLETO_PARA_O_DATA_JSON_ANTIGO"
```

3. Se a nova instalação **já tiver** um `storage/data.json`, a importação exige `--replace`, fazendo backup automático antes da substituição:

```bash
node scripts/import-v13.mjs "CAMINHO_COMPLETO_PARA_O_DATA_JSON_ANTIGO" --replace
```

4. Inicie `npm run dev` e entre usando a conta da instalação antiga.

O importador preserva usuários, comunicados, ferramentas, vídeos, links e releases, mas **zera sessões antigas** para exigir novo login. Ele não altera senhas de usuários. Se alguma senha foi exposta em URL ou chat, redefina-a.

**Não envie `data.json` à internet ou ao Git**: contém hashes de senhas, perfis e publicações. Não envie credenciais em URL.

## 2. Portal da Operação

O backoffice em `/operacao` permite a perfis autorizados:

| Módulo | Operações |
|---|---|
| Visão geral | Métricas de conteúdos, atalho às áreas de gestão |
| Comunicados | Criar, editar, publicar, agendar, fixar, exigir ciência, arquivar e gerenciar categorias e prioridades |
| Vídeos | Cadastrar, atualizar e excluir links do YouTube e Vimeo |
| Releases | Cadastrar, publicar, salvar rascunhos e arquivar |
| Links úteis | Cadastrar, editar, salvar rascunhos, publicar e arquivar |
| Usuários | Criar e editar contas; na sub-aba Perfis e permissões, definir os acessos padrão de cada perfil |
| Configurações | Editar título, descrição e aviso destacado na home |

Somente administrador acessa gestão de usuários, perfis e configurações. As flags editoriais são `notices`, `videos`, `releases`, `links`. A sub-aba **Perfis e permissões**, dentro de Usuários, define os valores padrão usados ao criar contas; contas existentes mantêm suas permissões individuais, ajustáveis na aba Usuários. Administradores sempre têm acesso total. Alterações de usuários revogam sessões antigas. Na área **Comunicados**, as sub-abas **Categorias** e **Prioridades** permitem adicionar, renomear e remover opções. Ao remover uma opção, comunicados existentes são atualizados para uma opção disponível. Acesso ao mural, aos vídeos e aos links exige autenticação; Webee Tools e releases são públicos no MVP.

### Cadastro de usuários corrigido

Formulários Vue usam `@submit.prevent`, enviando JSON via `POST /api/admin/users` ou `PATCH /api/admin/users/:id`. Campos de senha são `type="password"` e **nunca devem ser adicionados à URL por envio de formulário**. O backend é responsável por autorizar, validar e persistir; a UI não é fronteira de segurança.

## 3. Estrutura do projeto

```text
linxtools-nuxt4/
├── app/
│   ├── app.vue
│   ├── assets/css/main.css
│   ├── components/              # Cabeçalho e cards reutilizáveis
│   ├── composables/              # Sessão e utilidades de API
│   └── pages/                    # Vue / Nuxt: início, ferramentas, mural, backoffice
├── server/
│   ├── api/[...path].ts          # Rotas REST Nitro: frontend separado da lógica API
│   ├── utils/repository.ts       # Seleção de banco
│   └── legacy/                   # Domínio, segurança e persistência da V1.3
├── shared/types/index.ts        # Modelos TypeScript
├── scripts/
│   ├── create-admin.mjs
│   ├── import-v13.mjs
│   └── migrate-to-supabase.mjs
├── supabase/schema.sql
├── storage/data.json            # Criado em tempo de execução; ignorado pelo Git
├── tests/core.test.mjs
├── nuxt.config.ts
└── package.json
```

## 4. Supabase opcional

**Importante:** criar um Supabase não é obrigatório para executar esta versão. A arquitetura contém uma camada de repositório intercambiável.

1. Faça backup de `storage/data.json`.
2. Crie um projeto Supabase e execute **todo** `supabase/schema.sql` no SQL Editor. O schema atualizado também migra `notices.display_order` e instala a função transacional de reordenação manual. Se o projeto já estiver em uso, execute novamente o arquivo atualizado.
3. Copie `.env.example` para `.env` e informe `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (no **backend**, nunca em `runtimeConfig.public`).
4. Com `DATA_PROVIDER=local`, execute `npm run migrate:supabase` para enviar os dados atuais.
5. Altere `DATA_PROVIDER=supabase` e reinicie `npm run dev`.

A migração não importa sessões; após a troca de armazenamento, usuários devem autenticar novamente. O script é para bases pequenas, não possui reconciliação transacional nem mecanismo de rollback automático. **As políticas de RLS, o login com Supabase Auth e o deploy dependem da arquitetura final escolhida** e não foram migrados nesta versão. Em operação real, prefira conectar uma solução de identidade corporativa ou Supabase Auth com políticas apropriadas.

### Imagens e editor de comunicados

O editor de comunicados usa TinyMCE 8 self-hosted, interface em Português do Brasil, e a licença comunitária GPL-2.0-or-later (`license-key="gpl"`). Confirme que a distribuição do sistema atende às obrigações GPL; para distribuição proprietária incompatível, obtenha uma licença comercial TinyMCE antes de publicar. O pós-instalação prepara as traduções e recursos de interface necessários em `public/tinymce`.

Uploads aceitam PNG, JPEG, GIF e WebP de até 5 MB. Com `DATA_PROVIDER=local`, os arquivos ficam em `storage/uploads/notices`. Com `DATA_PROVIDER=supabase`, a API cria e usa um bucket público, por padrão `notice-media`; outro nome pode ser definido com `SUPABASE_NOTICE_MEDIA_BUCKET`. A chave de serviço permanece no servidor. O HTML é sanitizado tanto ao salvar quanto ao servir comunicados existentes; somente imagens e iframes de vídeo com hosts permitidos são preservados.

## 5. Testes e limites da entrega

`npm test` executa testes automatizados **do domínio e armazenamento local** (incluindo XML/JSON, contas, permissões e publicações). Após instalar dependências, rode também:

```bash
npm run typecheck
npm run build
```

O build e os testes automatizados devem ser executados após cada alteração. A validação de uploads Supabase requer um projeto configurado; o modo local pode ser usado sem serviço externo.

Limitações: o validador XML é sintático, não fiscal/XSD; vídeos são incorporados por links permitidos; não existem notificações push, auditoria completa nem segmentação de comunicados por equipe. Para implantação corporativa, são necessários HTTPS, recuperação de conta, rate limiting distribuído, trilha de auditoria, políticas de backup, proteção de credenciais e testes de integração com banco real.
