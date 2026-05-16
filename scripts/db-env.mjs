import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const out = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export function loadAppEnv() {
  const cwd = process.cwd();
  const envLocal = parseEnvFile(path.join(cwd, ".env.local"));
  const env = parseEnvFile(path.join(cwd, ".env"));
  return {
    ...env,
    ...envLocal,
    ...process.env
  };
}
