import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../../index";
import { readCreditBalance, sha256Hex } from "../store";

function createEnv() {
  return {
    ARK_API_BASE: "https://ark.test",
    ARK_MODEL: "mock-model",
    ARK_API_KEY: "mock-key",
  };
}

function createImageRequest(
  browserId: string,
  mode: "simple" | "formatted",
  overrides: Record<string, unknown> = {},
) {
  return new Request("https://api.scanlume.com/v1/ocr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode,
      browserId,
      ...overrides,
      image: {
        name: "receipt.png",
        mimeType: "image/png",
        dataUrl: "data:image/png;base64,ZmFrZQ==",
        size: 1024,
      },
    }),
  });
}

async function readAnonymousBalance(env: ReturnType<typeof createEnv>, browserId: string) {
  const actorKey = await sha256Hex(`0.0.0.0:${browserId}`);
  return readCreditBalance(env as never, { type: "anonymous", key: actorKey });
}

describe("/v1/ocr credit settlement", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("charges 1 credit for simple OCR and 2 for formatted OCR", async () => {
    const env = createEnv();
    const browserId = "anon-ocr-priced";
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ output_text: "simple text", usage: { input_tokens: 0, output_tokens: 0 } }), { status: 200 }),
    );
    let response = await app.fetch(createImageRequest(browserId, "simple"), env as never);
    expect(response.status).toBe(200);
    await expect(readAnonymousBalance(env, browserId)).resolves.toMatchObject({ remainingCredits: 4 });

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ blocks: [{ type: "p", text: "formatted", order: 0 }] }) } }], usage: { input_tokens: 0, output_tokens: 0 } }), { status: 200 }),
    );
    response = await app.fetch(createImageRequest(browserId, "formatted"), env as never);
    expect(response.status).toBe(200);
    await expect(readAnonymousBalance(env, browserId)).resolves.toMatchObject({ remainingCredits: 2 });
  });

  it("does not deduct credits when OCR fails", async () => {
    const env = createEnv();
    const browserId = "anon-ocr-failure";
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce(new Response("upstream failed", { status: 500 }));

    const response = await app.fetch(createImageRequest(browserId, "simple"), env as never);

    expect(response.status).toBe(502);
    await expect(readAnonymousBalance(env, browserId)).resolves.toMatchObject({ remainingCredits: 5 });
  });

  it("passes the selected OCR language to the upstream prompt", async () => {
    const env = createEnv();
    const browserId = "anon-ocr-language";
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ output_text: "plain text", usage: { input_tokens: 0, output_tokens: 0 } }), { status: 200 }),
    );

    const response = await app.fetch(createImageRequest(browserId, "simple", { ocrLanguage: "en" }), env as never);

    expect(response.status).toBe(200);
    const upstreamBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body ?? "{}")) as {
      input?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    const promptText = upstreamBody.input?.[0]?.content?.find((item) => item.type === "input_text")?.text ?? "";
    expect(promptText).toContain("Do not translate");
    expect(promptText).toContain("English");
  });
});
