import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distRoot = path.resolve(__dirname, "..", "dist");
const port = Number(process.env.WEBSITE_PORT || 4174);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
]);

function safePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0] || "/");
  const candidate = path.normalize(cleanPath).replace(/^(\.\.[/\\])+/, "");
  return path.join(distRoot, candidate);
}

async function resolveFile(urlPath) {
  const directPath = safePath(urlPath);
  const directStat = await stat(directPath).catch(() => null);
  if (directStat?.isFile()) {
    return directPath;
  }
  if (directStat?.isDirectory()) {
    return path.join(directPath, "index.html");
  }
  return path.join(directPath, "index.html");
}

createServer(async (request, response) => {
  try {
    const filePath = await resolveFile(request.url || "/");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "content-type": contentTypes.get(path.extname(filePath)) || "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Website preview: http://127.0.0.1:${port}`);
});
