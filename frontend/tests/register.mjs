import { registerHooks } from "node:module";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
// Node 24 supports TypeScript; these aliases match tsconfig without a test dependency.
const root = new URL("../", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    const local = specifier.startsWith("@/")
      ? new URL(specifier.slice(2), root)
      : specifier.startsWith(".") && context.parentURL?.startsWith(root.href)
        ? new URL(specifier, context.parentURL)
        : null;
    if (local)
      for (const href of [
        local.href,
        `${local.href}.ts`,
        `${local.href}/index.ts`,
      ]) {
        const path = fileURLToPath(href);
        if (existsSync(path) && statSync(path).isFile())
          return nextResolve(href, context);
      }
    return nextResolve(specifier, context);
  },
});
