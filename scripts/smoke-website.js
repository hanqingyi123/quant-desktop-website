import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const pages = [
  "index.html",
  "download/index.html",
  "features/index.html",
  "safety/index.html",
  "changelog/index.html",
  "faq/index.html",
];
const banned = ["买入建议", "卖出建议", "推荐买入", "推荐卖出", "目标价", "保证收益", "稳赚", "必赚", "自动赚钱", "AI 炒股神器", "高概率盈利", "预测涨到", "预测未来价格"];
const requiredRiskText = ["历史回测不代表未来收益", "不构成投资建议", "不自动交易", "不连接券商", "不输出价格目标或收益承诺"];
const requiredMeta = ["og:title", "og:description", "og:type", "og:image", "twitter:card", "twitter:image"];

async function readDistFile(relativePath) {
  const fullPath = path.join(dist, relativePath);
  await access(fullPath);
  return readFile(fullPath, "utf8");
}

function includesAll(content, values) {
  return values.every((value) => content.includes(value));
}

async function main() {
  const problems = [];
  const allHtml = [];

  for (const page of pages) {
    const html = await readDistFile(page);
    allHtml.push([page, html]);
    if (!html.includes("quant-desktop") || !html.includes("AI-native A 股策略研究工作台")) {
      problems.push(`${page} 缺少产品名或 SEO 主标题`);
    }
    if (!includesAll(html, requiredRiskText)) {
      problems.push(`${page} 缺少完整风险边界文案`);
    }
    if (!includesAll(html, requiredMeta)) {
      problems.push(`${page} 缺少 SEO / OG / Twitter meta`);
    }
  }

  const latest = JSON.parse(await readDistFile("releases/latest.json"));
  const changelog = JSON.parse(await readDistFile("releases/changelog.json"));
  if (!latest.version || !Array.isArray(latest.files)) {
    problems.push("latest.json 缺少 version 或 files");
  }
  if (!Array.isArray(changelog.releases)) {
    problems.push("changelog.json 缺少 releases");
  }

  const downloadHtml = await readDistFile("download/index.html");
  for (const required of ["macOS ARM", "macOS Intel", "Windows", "即将开放", "SHA256", "notarization"]) {
    if (!downloadHtml.includes(required)) {
      problems.push(`download/index.html 缺少 ${required}`);
    }
  }

  const safetyHtml = await readDistFile("safety/index.html");
  if (!safetyHtml.includes("桌面端默认不静默下载")) {
    problems.push("safety/index.html 缺少更新安全说明");
  }

  for (const [page, html] of allHtml) {
    for (const word of banned) {
      if (html.includes(word)) {
        problems.push(`${page} 包含禁用投资承诺词：${word}`);
      }
    }
  }

  for (const asset of ["assets/product-icon.png", "assets/og_image.png", "apple-touch-icon.png"]) {
    const assetStat = await stat(path.join(dist, asset)).catch(() => null);
    if (!assetStat || assetStat.size < 1024) {
      problems.push(`${asset} 缺失或资源异常`);
    }
  }
  const logoStat = await stat(path.join(dist, "assets/logo.svg")).catch(() => null);
  if (!logoStat || logoStat.size < 512) {
    problems.push("assets/logo.svg 缺失或资源异常");
  }

  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log("Website smoke passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
