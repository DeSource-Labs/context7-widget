import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const publicDir = resolve("public");
const distDir = resolve("dist");

if (existsSync(publicDir)) {
  await mkdir(distDir, { recursive: true });
  await cp(publicDir, distDir, { recursive: true });
}
