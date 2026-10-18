// Smoke test for the MCP server over stdio: initialize, list tools, run check_offer on a sample line.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const child = spawn("node_modules/.bin/tsx", ["src/mcp/server.ts"], {
  stdio: ["pipe", "pipe", "inherit"],
});
const pending = new Map();
let id = 0;
const send = (method, params) =>
  new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, resolve);
    child.stdin.write(
      `${JSON.stringify({ jsonrpc: "2.0", id: msgId, method, params })}\n`,
    );
    setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 20000);
  });
createInterface({ input: child.stdout }).on("line", (line) => {
  if (!line.trim()) return;
  const msg = JSON.parse(line);
  if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg);
});
const watchdog = setTimeout(() => {
  console.error("smoke test timed out");
  child.kill();
  process.exit(1);
}, 30000);

try {
  const init = await send("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "smoke", version: "0" },
  });
  console.log("server:", init.result.serverInfo);
  child.stdin.write(
    `${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`,
  );
  const tools = await send("tools/list", {});
  console.log(
    "tools:",
    tools.result.tools.map((t) => t.name),
  );
  const check = await send("tools/call", {
    name: "check_offer",
    arguments: {
      line: "Sample Indie Band · Chicago, IL · 250 cap · $20 ticket · $6,000 guarantee + $1,000 room",
    },
  });
  const parsed = JSON.parse(check.result.content[0].text);
  console.log(
    "check_offer:",
    parsed.mode,
    parsed.verdict?.status,
    "|",
    parsed.verdict?.headline,
  );
} finally {
  clearTimeout(watchdog);
  child.kill();
}
