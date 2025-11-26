/** @jest-environment node */

import { NextRequest } from "next/server";
import { i18n } from "@/i18n/config";
import { proxy } from "@/proxy";

describe("proxy locale redirect", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as (
      input: RequestInfo | URL,
      init?: RequestInit | undefined,
    ) => Promise<Response>;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("preserves search params when adding locale prefix", async () => {
    const request = new NextRequest(
      "http://localhost/app/chat?chatId=chat-123",
      {
        headers: { "accept-language": i18n.defaultLocale },
      },
    );

    const response = await proxy(request);

    expect(response.headers.get("location")).toBe(
      `http://localhost/${i18n.defaultLocale}/app/chat?chatId=chat-123`,
    );
  });
});
