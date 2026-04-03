import { describe, expect, it } from "vitest";

import { readCreditBalance, tryConsumeCredits } from "../store";

describe("credit balance bootstrap", () => {
  it("initializes anonymous actors with 5 credits and users with 50 credits", async () => {
    const env = {} as never;

    await expect(readCreditBalance(env, { type: "anonymous", key: "anon-bootstrap" })).resolves.toMatchObject({
      grantedCredits: 5,
      usedCredits: 0,
      remainingCredits: 5,
    });
    await expect(readCreditBalance(env, { type: "user", key: "user-bootstrap" })).resolves.toMatchObject({
      grantedCredits: 50,
      usedCredits: 0,
      remainingCredits: 50,
    });
  });

  it("settles credits atomically without allowing negative balances", async () => {
    const env = {} as never;

    await expect(tryConsumeCredits(env, { actor: { type: "user", key: "user-no-overspend" }, amount: 51 })).resolves.toEqual({
      ok: false,
      remainingCredits: 50,
    });
  });
});
