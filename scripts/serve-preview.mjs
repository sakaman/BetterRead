import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const port = Number(process.env.BETTERREAD_PREVIEW_PORT || 4173);
const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  const relativePath = decodeURIComponent(url.pathname === "/" ? "/tests/fixture.html" : url.pathname);
  const absolutePath = resolve(root, `.${relativePath}`);
  if (absolutePath !== root && !absolutePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const info = await stat(absolutePath);
    if (!info.isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Content-Type": types.get(extname(absolutePath)) || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    createReadStream(absolutePath).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`BetterRead preview: http://127.0.0.1:${port}/tests/fixture.html`);
});
