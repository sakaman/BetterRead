import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const metadataTemplate = await readFile(resolve(root, "userscript.meta.txt"), "utf8");
const metadata = metadataTemplate.replace(
  /^\/\/ @version\s+.*$/m,
  `// @version      ${packageJson.version}`,
);

if (!metadata.includes(`// @version      ${packageJson.version}`)) {
  throw new Error("userscript.meta.txt is missing the @version field");
}

await build({
  absWorkingDir: root,
  entryPoints: ["./src/main.ts"],
  outfile: "dist/better-read.user.js",
  tsconfig: "./tsconfig.json",
  preserveSymlinks: true,
  bundle: true,
  format: "iife",
  target: ["chrome110", "firefox115"],
  charset: "utf8",
  define: { __BETTERREAD_VERSION__: JSON.stringify(packageJson.version) },
  legalComments: "none",
  sourcemap: false,
  banner: { js: metadata.trimEnd() },
});

console.log("Built dist/better-read.user.js");
