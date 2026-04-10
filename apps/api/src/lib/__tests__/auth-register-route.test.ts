import { describe, expect, it } from "vitest";

import app from "../../index";

describe("auth register route", () => {
  it("rejects Yahoo-family email addresses before account creation", async () => {
    const response = await app.fetch(
      new Request("https://api.scanlume.com/v1/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Jam Yanh",
          email: "pony@yahoo.com",
          password: "supersecret123",
        }),
      }),
      {} as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Yahoo email registration is not supported right now. Please use another email provider or Google sign-in.",
    });
  });
});
