import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const upstreamUrl = "https://context7.com/widget.js";
const outputDir = resolve("upstream");
const rawPath = resolve(outputDir, "context7-widget.latest.js");
const normalizedPath = resolve(outputDir, "context7-widget.normalized.js");
const metadataPath = resolve(outputDir, "context7-widget.metadata.json");
const shaPath = resolve(outputDir, "context7-widget.sha256");

const previousMetadata = await readJson(metadataPath);
const headers = {};

if (previousMetadata?.etag && !process.argv.includes("--force")) {
  headers["if-none-match"] = previousMetadata.etag;
}

const response = await fetch(upstreamUrl, { headers });

if (response.status === 304) {
  await writeGitHubOutput({
    changed: "false",
    current_sha: previousMetadata.sha256 ?? "",
    previous_sha: previousMetadata.sha256 ?? "",
    status: "not-modified",
    upstream_url: upstreamUrl
  });
  console.log("Upstream widget unchanged by ETag.");
  process.exit(0);
}

if (!response.ok) {
  throw new Error(`Failed to download ${upstreamUrl}: HTTP ${response.status}`);
}

const raw = await response.text();
const normalized = normalizeScript(raw);
const currentSha = sha256(normalized);
const previousSha = previousMetadata?.sha256 ?? "";
const changed = currentSha !== previousSha;

await mkdir(outputDir, { recursive: true });
await writeFile(rawPath, ensureTrailingNewline(raw));
await writeFile(normalizedPath, normalized);
await writeFile(shaPath, `${currentSha}\n`);
await writeJson(metadataPath, {
  checkedAt: new Date().toISOString(),
  contentLength: raw.length,
  etag: response.headers.get("etag"),
  lastModified: response.headers.get("last-modified"),
  sha256: currentSha,
  upstreamUrl
});

await writeGitHubOutput({
  changed: String(changed),
  current_sha: currentSha,
  previous_sha: previousSha,
  snapshot_path: "upstream/context7-widget.latest.js",
  status: changed ? "changed" : "same-hash",
  upstream_url: upstreamUrl
});

console.log(changed ? `Upstream widget changed: ${previousSha || "none"} -> ${currentSha}` : "Upstream widget hash unchanged.");

function normalizeScript(source) {
  return ensureTrailingNewline(source.replace(/\r\n/g, "\n").trim());
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function ensureTrailingNewline(value) {
  return `${value.replace(/\s+$/u, "")}\n`;
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeGitHubOutput(values) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;

  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  await writeFile(outputPath, `${lines.join("\n")}\n`, { flag: "a" });
}
