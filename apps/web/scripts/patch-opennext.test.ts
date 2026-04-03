import { describe, expect, it } from "vitest";

import { patchMiddlewareManifestRequire } from "./patch-opennext.mjs";

describe("patchMiddlewareManifestRequire", () => {
  it("replaces the runtime middleware manifest require with a static empty manifest", () => {
    const input = 'getMiddlewareManifest(){return this.minimalMode?null:require(this.middlewareManifestPath)}async getMiddleware(){}';

    expect(patchMiddlewareManifestRequire(input)).toContain(
      'getMiddlewareManifest(){return this.minimalMode?null:{version:3,middleware:{},functions:{},sortedMiddleware:[]}}async getMiddleware(){}',
    );
  });
});
