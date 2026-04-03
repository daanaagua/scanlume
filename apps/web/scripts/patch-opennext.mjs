import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SEARCH = "getMiddlewareManifest(){return this.minimalMode?null:require(this.middlewareManifestPath)}";
const REPLACE = "getMiddlewareManifest(){return this.minimalMode?null:{version:3,middleware:{},functions:{},sortedMiddleware:[]}}";

export function patchMiddlewareManifestRequire(source) {
  return source.includes(SEARCH) ? source.replace(SEARCH, REPLACE) : source;
}

const executedDirectly = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (executedDirectly) {
  const handlerPath = path.resolve(process.cwd(), ".open-next/server-functions/default/apps/web/handler.mjs");
  const source = readFileSync(handlerPath, "utf8");
  const patched = patchMiddlewareManifestRequire(source);
  if (patched !== source) {
    writeFileSync(handlerPath, patched, "utf8");
    process.stdout.write(`patched ${handlerPath}\n`);
  } else {
    process.stdout.write(`no-op ${handlerPath}\n`);
  }
}
