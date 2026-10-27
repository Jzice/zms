/* ==================== 大模型接管：OpenAI 兼容客户端 ==================== */
import type { LlmConfig, LlmMessage } from './types';
import { getLlmConfig } from './config';

/** 厂商适配层：默认 openAiAdapter 覆盖绝大多数兼容接口。 */
export interface ProviderAdapter {
  build(urlBase: string, apiKey: string, messages: LlmMessage[], cfg: LlmConfig): RequestInit & { url: string };
  parse(body: unknown): string;
}

function chatCompletionsUrl(base: string): string {
  const b = base.trim().replace(/\/+$/, '');
  return `${b}/chat/completions`;
}

export const openAiAdapter: ProviderAdapter = {
  build(urlBase, apiKey, messages, cfg) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    return {
      url: chatCompletionsUrl(urlBase),
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: cfg.temperature,
        max_tokens: cfg.maxTokens,
        response_format: { type: 'json_object' },
      }),
    };
  },
  parse(body) {
    const data = body as { choices?: { message?: { content?: string } }[] };
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content : '';
  },
};

function adapterFor(_provider: string): ProviderAdapter {
  return openAiAdapter;
}

/** 发起一次补全；超时由 AbortController 控制，异常向上抛出由调用方回退 */
export async function callLlm(messages: LlmMessage[], cfgOverride?: LlmConfig): Promise<string> {
  const cfg = cfgOverride ?? getLlmConfig();
  const adapter = adapterFor(cfg.provider);
  const req = adapter.build(cfg.baseURL, cfg.apiKey, messages, cfg);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Math.max(1000, cfg.timeoutMs));
  try {
    const res = await fetch(req.url, { ...req, signal: ctrl.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`LLM HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    const body = await res.json();
    return adapter.parse(body);
  } finally {
    clearTimeout(timer);
  }
}

/** 从模型文本中提取第一个 JSON 对象（容错：去掉 ```json 围栏、取首尾花括号） */
export function parseJsonSafe<T>(text: string): T | null {
  if (!text) return null;
  let s = text.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/** 设置弹窗「测试连接」：发起一次最小补全，返回是否成功 */
export async function testLlmConnection(): Promise<{ ok: boolean; msg: string }> {
  try {
    const res = await callLlm(
      [
        { role: 'system', content: '你是测试助手，只回复 JSON。' },
        { role: 'user', content: '请只输出 {"ok":true}' },
      ],
      { ...getLlmConfig(), maxTokens: 16, timeoutMs: Math.min(15000, getLlmConfig().timeoutMs) },
    );
    const j = parseJsonSafe<{ ok?: boolean }>(res);
    if (j && j.ok === true) return { ok: true, msg: '连接成功' };
    return { ok: true, msg: '已收到响应（模型未严格返回 JSON，但可通信）' };
  } catch (e) {
    return { ok: false, msg: '连接失败：' + (e instanceof Error ? e.message : String(e)) };
  }
}
