import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeExplanation,
  buildSystemPrompt,
  generateDeterministicExplanation,
  streamAIExplanation,
} from '../lib/ai-explainer';
import { loadCatalog } from '../lib/catalog';
import { recommend } from '../lib/recommend';

test('sanitizeExplanation removes all forbidden bottleneck words per AC-12', () => {
  const dirty1 = 'Cấu hình này không bị bottleneck giữa CPU và GPU.';
  const clean1 = sanitizeExplanation(dirty1);
  assert.ok(!clean1.toLowerCase().includes('bottleneck'));
  assert.ok(clean1.includes('sự cân đối hiệu năng'));

  const dirty2 = 'Hệ thống hạn chế tối đa nguy cơ nghẽn cổ chai.';
  const clean2 = sanitizeExplanation(dirty2);
  assert.ok(!clean2.toLowerCase().includes('nghẽn cổ chai'));
  assert.ok(clean2.includes('mức cân bằng tải'));

  const dirty3 = 'Tránh hiện tượng nghen co chai và nghẽn khi chơi game.';
  const clean3 = sanitizeExplanation(dirty3);
  assert.ok(!clean3.toLowerCase().includes('nghen co chai'));
  assert.ok(!clean3.toLowerCase().includes(' nghẽn '));
});

test('buildSystemPrompt embeds build specs and strict anti-bottleneck guardrail', async () => {
  const catalog = await loadCatalog();
  const rec = recommend({
    budget_vnd: 25_000_000,
    resolution: '1080p',
    target_games: ['Cyberpunk 2077'],
    priority: 'FPS',
    client_timestamp: new Date().toISOString(),
  }, catalog);

  assert.equal(rec.status, 'OK');
  if (rec.status !== 'OK') return;

  const prompt = buildSystemPrompt(rec.build, {
    budget_vnd: 25_000_000,
    resolution: '1080p',
    target_games: ['Cyberpunk 2077'],
    priority: 'FPS',
  });

  assert.ok(prompt.includes('QUY TẮC BẮT BUỘC (STRICT GUARDRAILS)'));
  assert.ok(prompt.includes('TUYỆT ĐỐI KHÔNG sử dụng từ "bottleneck"'));
  assert.ok(prompt.includes('Tối ưu ngân sách & Hiệu năng game'));
  assert.ok(prompt.includes('Nhiệt độ & Nguồn điện'));
  assert.ok(prompt.includes('Lộ trình nâng cấp 2 năm tới'));
});

test('generateDeterministicExplanation generates clean 3-part rationale with zero forbidden copy', async () => {
  const catalog = await loadCatalog();
  const rec = recommend({
    budget_vnd: 20_000_000,
    resolution: '1080p',
    target_games: ['Valorant', 'Counter-Strike 2'],
    priority: 'FPS',
    client_timestamp: new Date().toISOString(),
  }, catalog);

  assert.equal(rec.status, 'OK');
  if (rec.status !== 'OK') return;

  const explanation = generateDeterministicExplanation(rec.build, {
    budget_vnd: 20_000_000,
    resolution: '1080p',
    target_games: ['Valorant', 'Counter-Strike 2'],
    priority: 'FPS',
  });

  assert.ok(explanation.includes('🎯 **Tối ưu ngân sách & Hiệu năng game**'));
  assert.ok(explanation.includes('⚡ **Nhiệt độ & Điện năng dự phòng**'));
  assert.ok(explanation.includes('🚀 **Lộ trình nâng cấp 2 năm tới**'));

  // Strict AC-12 check
  assert.ok(!explanation.toLowerCase().includes('bottleneck'));
  assert.ok(!explanation.toLowerCase().includes('nghẽn cổ chai'));
});

test('streamAIExplanation yields streamed chunks successfully in fallback mode', async () => {
  const catalog = await loadCatalog();
  const rec = recommend({
    budget_vnd: 30_000_000,
    resolution: '1440p',
    target_games: ['Black Myth: Wukong'],
    priority: 'FPS',
    client_timestamp: new Date().toISOString(),
  }, catalog);

  assert.equal(rec.status, 'OK');
  if (rec.status !== 'OK') return;

  const chunks: string[] = [];
  for await (const chunk of streamAIExplanation(rec.build, {
    budget_vnd: 30_000_000,
    resolution: '1440p',
    target_games: ['Black Myth: Wukong'],
    priority: 'FPS',
  })) {
    chunks.push(chunk);
    if (chunks.length >= 3) break; // Check initial streaming
  }

  assert.ok(chunks.length >= 3);
  assert.ok(chunks.join('').length > 10);
});
