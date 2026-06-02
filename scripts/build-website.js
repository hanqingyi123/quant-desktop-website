import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(__dirname, "..");
const distRoot = path.join(websiteRoot, "dist");
const publicRoot = path.join(websiteRoot, "public");
const version = process.env.WEBSITE_VERSION || "0.1.0-beta.1";
const deployTime = process.env.WEBSITE_DEPLOY_TIME || new Date().toISOString();
const appName = process.env.WEBSITE_APP_NAME || "quant-desktop";
const siteUrl = process.env.WEBSITE_SITE_URL || "https://quant-desktop.app";
const seoTitle = `${appName} | AI-native A 股策略研究工作台`;
const seoDescription = "用自然语言讨论策略，用历史数据验证想法。AI 策略助手、快速回测、实验对比、数据来源可追溯。";

const featureCards = [
  ["Quick Backtest", "输入股票代码，用默认参数完成一次历史回测，快速理解策略样貌。"],
  ["Conversational Strategy Copilot", "用自然语言讨论策略结构、条件组合和下一步验证方式。"],
  ["AI Backtest Analyst", "把回测结果转成可读研究说明，保留数据来源和风险边界。"],
  ["Strategy Experiment Lab", "对比策略版本、参数变化和实验结果，帮助整理研究路径。"],
  ["Data Hub 多数据源", "展示数据源状态、缓存降级和 AKShare 修复路径。"],
  ["Reports 导出", "导出 HTML、PDF、Excel 和研究档案，方便复盘与留存。"],
];

const highlightRows = [
  ["从一句想法到可验证策略", "先描述策略意图，再拆成可检查条件、参数和数据需求。"],
  ["从数据异常到可解释降级", "数据源不可用时展示缓存、fallback 和修复建议，不把原始报错丢给用户。"],
  ["从回测结果到研究档案", "指标、图表、风险提示和报告导出形成一条完整研究链路。"],
];

const faqItems = [
  ["这是不是自动交易软件？", "不是。quant-desktop 不自动交易，不连接券商，只用于历史研究、学习参考和策略验证。"],
  ["数据来自哪里？", "当前以 AKShare、本地文件和缓存数据为主，并在页面中展示数据来源与降级状态。"],
  ["AI 会给出确定交易结论吗？", "不会。AI 只帮助整理策略表达、解释历史结果和提示风险，不构成投资建议。"],
  ["如何安装？", "下载页会提供 macOS ARM、macOS Intel 和 Windows 安装包入口。正式开放前按钮保持占位状态。"],
  ["为什么 AKShare 有时不可用？", "公开数据源可能受网络、证书、字段变化或上游服务影响。应用会提供诊断和缓存降级。"],
];

const riskText = [
  "历史回测不代表未来收益",
  "不构成投资建议",
  "不自动交易",
  "不连接券商",
  "不输出价格目标或收益承诺",
];

const pages = [
  {
    slug: "",
    title: seoTitle,
    eyebrow: "Private-source desktop research tool",
    heading: "AI-native A 股策略研究工作台",
    intro: "用自然语言讨论策略，用历史数据验证想法。",
    cta: [
      ["查看产品演示", "#features", "primary"],
      ["下载桌面版（即将开放）", "/download/", "secondary"],
    ],
    mode: "home",
  },
  {
    slug: "features",
    title: `功能 - ${seoTitle}`,
    eyebrow: "Research workflow",
    heading: "把策略研究拆成可验证的工作流",
    intro: "从想法、数据、回测、解释到报告留存，每一步都保留来源、限制和风险说明。",
    mode: "features",
  },
  {
    slug: "download",
    title: `下载 - ${seoTitle}`,
    eyebrow: "Release-only distribution",
    heading: "下载桌面安装包",
    intro: "安装包将通过公开 release-only 仓库分发。正式开放前，平台卡片展示版本、签名状态和校验占位。",
    mode: "download",
  },
  {
    slug: "safety",
    title: `安全与免责声明 - ${seoTitle}`,
    eyebrow: "Security and risk policy",
    heading: "研究工具，不是交易执行系统",
    intro: "桌面端更新由用户确认，公开网站只暴露安装包元数据和风险边界说明。",
    mode: "safety",
  },
  {
    slug: "changelog",
    title: `更新日志 - ${seoTitle}`,
    eyebrow: "Changelog",
    heading: "版本历史线",
    intro: "版本记录来自公开 changelog.json，只展示用户可见变化、安全说明和安装注意事项。",
    mode: "changelog",
  },
  {
    slug: "faq",
    title: `FAQ - ${seoTitle}`,
    eyebrow: "Questions",
    heading: "常见问题",
    intro: "围绕安装、数据、AI 边界和风险提示，回答最容易误解的问题。",
    mode: "faq",
  },
];

function pagePath(slug) {
  return slug ? path.join(distRoot, slug, "index.html") : path.join(distRoot, "index.html");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderNav() {
  return pages.map((item) => {
    const href = item.slug ? `/${item.slug}/` : "/";
    const label = item.slug ? item.title.split(" - ")[0] : "首页";
    return `<a href="${href}">${escapeHtml(label)}</a>`;
  }).join("");
}

function renderMeta(page) {
  const canonical = `${siteUrl}${page.slug ? `/${page.slug}/` : "/"}`;
  const pageTitle = page.title || seoTitle;
  const description = page.intro || seoDescription;
  return `
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${canonical}">
    <link rel="icon" type="image/png" href="/assets/product-icon.png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <meta name="application-name" content="${escapeHtml(appName)}">
    <meta name="theme-color" content="#0A0E14">
    <meta property="og:title" content="quant-desktop - AI-native A 股策略研究工作台">
    <meta property="og:description" content="${escapeHtml(seoDescription)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${siteUrl}/assets/og_image.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="quant-desktop - AI-native A 股策略研究工作台">
    <meta name="twitter:description" content="用自然语言讨论策略，用历史数据验证想法。">
    <meta name="twitter:image" content="${siteUrl}/assets/og_image.png">`;
}

function renderMockup() {
  return `<div class="product-shot" aria-label="产品界面概览">
    <div class="shot-titlebar"><span></span><span></span><span></span><strong>quant-desktop</strong></div>
    <div class="shot-body">
      <aside class="shot-sidebar"><b>Q</b><i></i><i></i><i></i></aside>
      <section class="shot-main">
        <div class="shot-card shot-card-large">
          <small>Strategy Experiment Lab</small>
          <div class="shot-chart"><span></span><span></span><span></span></div>
        </div>
        <div class="shot-card"><small>Data Hub</small><p>AKShare_Sina · recovered</p></div>
        <div class="shot-card"><small>AI Backtest Analyst</small><p>Report ready</p></div>
        <div class="shot-prompt">向 AI 助手提问，探索你的策略思路...</div>
      </section>
    </div>
  </div>`;
}

function renderHero(page) {
  const actions = (page.cta || [["查看功能", "/features/", "primary"]]).map(([label, href, kind]) => (
    `<a class="button ${kind === "secondary" ? "button-secondary" : "button-primary"}" href="${href}">${escapeHtml(label)}</a>`
  )).join("");
  return `<section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
      <h1>${escapeHtml(page.heading)}</h1>
      <p class="intro">${escapeHtml(page.intro)}</p>
      <div class="hero-actions">${actions}</div>
      <div class="trust-row" aria-label="信任徽章">
        <span>Private source</span>
        <span>Release-only downloads</span>
        <span>Manual updates</span>
      </div>
    </div>
    ${renderMockup()}
  </section>`;
}

function renderRiskStrip() {
  return `<section class="risk-strip" aria-label="风险提示">
    ${riskText.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
  </section>`;
}

function renderHome() {
  const cards = featureCards.map(([title, body]) => (
    `<article class="feature-card"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p></article>`
  )).join("");
  return `<section id="features" class="section-block">
    <div class="section-heading"><p class="eyebrow">Core capabilities</p><h2>六个模块串起研究路径</h2></div>
    <div class="feature-grid">${cards}</div>
  </section>
  <section class="section-block download-band">
    <div><p class="eyebrow">Desktop release</p><h2>桌面版即将开放下载</h2><p>正式版本会提供 macOS 与 Windows 安装包、SHA256 校验和签名状态。</p></div>
    <a class="button button-primary" href="/download/">查看下载页</a>
  </section>`;
}

function renderFeatures() {
  return `<section class="section-block">
    <div class="highlight-stack">
      ${highlightRows.map(([title, body], index) => `<article class="highlight-row ${index % 2 ? "is-reversed" : ""}">
        ${renderMockup()}
        <div><p class="eyebrow">Highlight ${index + 1}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p></div>
      </article>`).join("")}
    </div>
  </section>`;
}

function renderDownload() {
  const latest = JSON.parse(latestJson);
  const platformCards = [
    ["macOS ARM", "Apple Silicon", "DMG / ZIP", "Developer ID + notarization 待发布确认"],
    ["macOS Intel", "x64", "DMG / ZIP", "Developer ID + notarization 待发布确认"],
    ["Windows", "x64", "NSIS", "签名状态待发布确认"],
  ];
  return `<section class="section-block">
    <div class="download-grid">
      ${platformCards.map(([title, arch, type, badge]) => `<article class="download-card">
        <h2>${title}</h2>
        <p>${arch} · ${type}</p>
        <span class="badge">${badge}</span>
        <dl><dt>版本</dt><dd>${escapeHtml(latest.version)}</dd><dt>SHA256</dt><dd>PENDING_RELEASE_SHA256</dd></dl>
        <button disabled>即将开放</button>
      </article>`).join("")}
    </div>
    <div class="release-note">
      <p>公开发布仓库：${escapeHtml(latest.releaseRepo)}</p>
      <p>下载前请比对 SHA256SUMS。若校验不一致，请不要安装。</p>
    </div>
  </section>`;
}

function renderSafety() {
  return `<section class="section-block">
    <div class="policy-grid">
      ${riskText.map((item) => `<article class="policy-card"><strong>${escapeHtml(item)}</strong><p>所有页面、报告和更新说明都保留该边界，避免把历史研究误解为确定交易结论。</p></article>`).join("")}
    </div>
    <article class="security-panel">
      <h2>更新安全策略</h2>
      <p>桌面端默认不静默下载，不在退出时自动安装。检测到新版本后，用户确认才开始下载；下载完成后，用户再次确认才重启安装。</p>
    </article>
  </section>`;
}

function renderChangelog() {
  const changelog = JSON.parse(changelogJson);
  return `<section class="section-block timeline">
    ${changelog.releases.map((release) => `<article class="timeline-item">
      <time>${escapeHtml(release.date)}</time>
      <h2>${escapeHtml(release.version)}</h2>
      <p>${escapeHtml(release.summary)}</p>
      <ul>${release.changes.map((change) => `<li>${escapeHtml(change)}</li>`).join("")}</ul>
      <small>${escapeHtml(release.riskNotice)}</small>
    </article>`).join("")}
  </section>`;
}

function renderFaq() {
  return `<section class="section-block faq-list">
    ${faqItems.map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join("")}
  </section>`;
}

function renderBody(page) {
  const contentByMode = {
    home: renderHome,
    features: renderFeatures,
    download: renderDownload,
    safety: renderSafety,
    changelog: renderChangelog,
    faq: renderFaq,
  };
  return `${renderHero(page)}${renderRiskStrip()}${contentByMode[page.mode]()}`;
}

function renderPage(page) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${renderMeta(page)}
    <link rel="stylesheet" href="/assets/site.css">
  </head>
  <body>
    <div class="ambient" aria-hidden="true"></div>
    <header class="site-header">
      <a class="brand" href="/">
        <img src="/assets/logo.svg" alt="quant-desktop logo" width="162" height="38">
      </a>
      <nav>${renderNav()}</nav>
    </header>
    <main>${renderBody(page)}</main>
    <footer>
      <span>Copyright © 2026 A 股研究工作台. All Rights Reserved.</span>
      <span>Version ${escapeHtml(version)} · Deploy ${escapeHtml(deployTime)}</span>
    </footer>
  </body>
</html>`;
}

let latestJson = "{}";
let changelogJson = "{}";

async function copyPublicDir(source, target) {
  await mkdir(target, { recursive: true });
  const entries = await import("node:fs/promises").then((fs) => fs.readdir(source, { withFileTypes: true }));
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyPublicDir(sourcePath, targetPath);
    } else {
      await copyFile(sourcePath, targetPath);
    }
  }
}

async function main() {
  await rm(distRoot, { recursive: true, force: true });
  await mkdir(distRoot, { recursive: true });
  latestJson = await readFile(path.join(publicRoot, "releases", "latest.json"), "utf8");
  changelogJson = await readFile(path.join(publicRoot, "releases", "changelog.json"), "utf8");
  await copyPublicDir(publicRoot, distRoot);

  const css = await readFile(path.join(websiteRoot, "src", "site.css"), "utf8");
  await mkdir(path.join(distRoot, "assets"), { recursive: true });
  await writeFile(path.join(distRoot, "assets", "site.css"), css);

  for (const page of pages) {
    const outputPath = pagePath(page.slug);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, renderPage(page));
  }

  console.log(`Built ${pages.length} website pages into ${distRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
