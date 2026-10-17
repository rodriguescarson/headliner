/**
 * Read-only MCP server. A counterparty's agent (a venue booker, a co-promoter, a sponsor) can run the same
 * check and read the same evidence, rulebook and trace that the promoter saw. Nothing here writes anything.
 *
 *   pnpm mcp            # stdio transport
 *
 * Tools: check_offer(line) → the full verdict; rulebook() → the versioned rules; endpoint_suite() → live suite.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runCheck } from "../lib/check";
import { runSuite } from "../lib/qloo/suite";
import { RULES_VERSION, rules } from "../lib/rules";

const server = new McpServer({ name: "headliner", version: "0.1.0" });

server.registerTool(
  "check_offer",
  {
    title: "Check a live-show offer",
    description:
      "Deterministic deal math plus Qloo cultural evidence for one offer line, e.g. 'Khruangbin · Austin, TX · 600 cap · $32 ticket · $9,000 guarantee + $2,500 room'. Returns cleared / fix_required / refused / abstained with reasons, evidence, coverage gaps and the Qloo call trace. Affinity is evidence, never a ticket forecast.",
    inputSchema: { line: z.string().min(3).max(500) },
  },
  async ({ line }) => {
    const result = await runCheck({ line });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      isError: !result.ok,
    };
  },
);

server.registerTool(
  "rulebook",
  {
    title: "Rulebook",
    description: `The versioned deterministic rulebook (${RULES_VERSION}) every verdict is computed against.`,
    inputSchema: {},
  },
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify({ version: RULES_VERSION, rules }, null, 2),
      },
    ],
  }),
);

server.registerTool(
  "endpoint_suite",
  {
    title: "Live Qloo endpoint suite",
    description:
      "Runs every Qloo endpoint Headliner depends on once and reports status and latency. Says so when no key is configured.",
    inputSchema: {},
  },
  async () => ({
    content: [
      { type: "text", text: JSON.stringify(await runSuite(), null, 2) },
    ],
  }),
);

async function main() {
  await server.connect(new StdioServerTransport());
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
