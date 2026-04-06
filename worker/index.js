const MODEL = "@cf/meta/llama-3.2-3b-instruct";

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json; charset=UTF-8",
      ...init.headers
    },
    ...init
  });
}

function sse(stream) {
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=UTF-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive"
    }
  });
}

async function handleChat(request, env) {
  if (!env.AI) {
    return json({ error: "Workers AI 绑定不存在，请检查 wrangler 配置。" }, { status: 500 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "请求体必须是有效的 JSON。" }, { status: 400 });
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const stream = payload.stream !== false;

  const sanitizedMessages = messages
    .filter((message) => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content.trim()
    }))
    .filter((message) => message.content);

  if (sanitizedMessages.length === 0) {
    return json({ error: "缺少对话消息。" }, { status: 400 });
  }

  const modelInput = {
    messages: [
      {
        role: "system",
        content: [
          "你是一名中文命理助理，负责根据页面已经计算好的八字参数回答追问。",
          "在后续消息里，前面会先给你一段命盘事实和一条确认消息，然后才是用户追问。",
          "必须严格以消息中给出的命盘事实为准，不要重新捏造出生数据，也不要说你没有看到命盘。",
          "优先给出简洁、清晰、有依据的中文回答。若结论依赖解释，请点明你引用的是哪些已给出的柱、藏干、大运或流年。",
          "如果问题超出当前上下文支持范围，要明确说明限制，不要编造。"
        ].join("\n")
      },
      ...sanitizedMessages
    ],
    max_tokens: 700,
    temperature: 0.4
  };

  if (stream) {
    const result = await env.AI.run(MODEL, {
      ...modelInput,
      stream: true
    });

    return sse(result);
  }

  const result = await env.AI.run(MODEL, modelInput);

  return json({ response: result.response || "" });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/chat") {
      try {
        return await handleChat(request, env);
      } catch (error) {
        return json({ error: error.message || "Worker AI 调用失败。" }, { status: 500 });
      }
    }

    if (request.method === "OPTIONS" && url.pathname === "/api/chat") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type"
        }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
