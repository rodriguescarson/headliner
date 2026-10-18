import rulesJson from "./rules-v1.json";

export type Rules = typeof rulesJson;
export const rules: Rules = rulesJson;
export const RULES_VERSION = `${rulesJson.id}@${rulesJson.version}`;
