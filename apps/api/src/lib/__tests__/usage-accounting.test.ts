import { describe, expect, it } from "vitest";

import { readUserDailyPdfUsage, readUserDailyUsage, writeUserDailyPdfUsage, writeUserDailyUsage } from "../store";

describe("logged-in usage accounting", () => {
  it("writes and reads back image usage for a logged-in user", async () => {
    const env = {} as never;
    const date = "2026-04-03";
    const userId = "user-image";

    await writeUserDailyUsage(env, userId, date, { usedImages: 1, usedCredits: 3 }, new Date().toISOString());

    await expect(readUserDailyUsage(env, userId, date)).resolves.toEqual({ usedImages: 1, usedCredits: 3 });
  });

  it("writes and reads back PDF page usage for a logged-in user", async () => {
    const env = {} as never;
    const date = "2026-04-03";
    const userId = "user-pdf";

    await writeUserDailyPdfUsage(env, userId, date, { usedPages: 4 }, new Date().toISOString());

    await expect(readUserDailyPdfUsage(env, userId, date)).resolves.toEqual({ usedPages: 4 });
  });
});
