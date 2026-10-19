import assert from 'node:assert/strict';
import test from 'node:test';
import { noticeInput, sanitizeNoticeHtml } from '../server/legacy/services/content.js';

test('comunicado mantém formatação permitida e remove conteúdo executável', () => {
  const html = sanitizeNoticeHtml(
    '<h2 style="color:#5d2fb1">Aviso</h2><p onclick="alert(1)">Texto <strong>importante</strong><script>alert(1)</script></p><img src="data:image/png;base64,AAA" onerror="alert(1)">',
  );

  assert.match(html, /<h2 style="color:#5d2fb1">Aviso<\/h2>/);
  assert.match(html, /<strong>importante<\/strong>/);
  assert.doesNotMatch(html, /<script|onclick|onerror|data:image/);
});

test('comunicado preserva tabelas e apenas iframes de hosts autorizados', () => {
  const html = sanitizeNoticeHtml(
    '<table><tbody><tr><td style="background-color:#fff">Célula</td></tr></tbody></table><iframe src="https://www.youtube.com/embed/video"></iframe><iframe src="https://attacker.example/embed/video"></iframe>',
  );

  assert.match(html, /<table>/);
  assert.match(html, /background-color:#fff/);
  assert.match(html, /youtube\.com\/embed\/video/);
  assert.doesNotMatch(html, /attacker\.example/);
});

test('noticeInput sanitiza HTML e aceita conteúdo maior que o limite antigo', () => {
  const body = `<p>${'conteúdo '.repeat(1100)}<img src="https://example.com/aviso.png" alt="Aviso"></p>`;
  const notice = noticeInput({ body }, { partial: true });

  assert.ok(notice.body.length > 8000);
  assert.match(notice.body, /<img src="https:\/\/example\.com\/aviso\.png" alt="Aviso"/);
});
