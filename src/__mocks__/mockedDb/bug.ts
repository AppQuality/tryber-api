import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_evd_bug";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY NOT NULL",
      "internal_id VARCHAR(45)",
      "wp_user_id INTEGER(11) NOT NULL",
      "message VARCHAR(255)",
      "description VARCHAR(255)",
      "expected_result VARCHAR(255)",
      "current_result VARCHAR(255)",
      "campaign_id INTEGER",
      "status_id INTEGER",
      "publish INTEGER DEFAULT 1",
      "status_reason VARCHAR(255)",
      "severity_id INTEGER DEFAULT 1",
      "created DATETIME",
      "bug_replicability_id INTEGER",
      "bug_type_id INTEGER",
      "application_section VARCHAR(255)",
      "application_section_id INTEGER",
      "note VARCHAR(3000)",
      "last_seen VARCHAR(30)",

      "dev_id INTEGER",
      "manufacturer VARCHAR(65)",
      "model VARCHAR(65)",
      "os VARCHAR(45)",
      "os_version VARCHAR(45)",
      "version_id INTEGER",
      "is_perfect INTEGER DEFAULT 1",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type BugParams = {
  id?: number;
  internal_id?: string;
  wp_user_id?: number;
  message?: string;
  description?: string;
  expected_result?: string;
  current_result?: string;
  campaign_id?: number;
  status_id?: number;
  publish?: number;
  status_reason?: string;
  severity_id?: number;
  created?: string;
  bug_replicability_id?: number;
  bug_type_id?: number;
  application_section?: string;
  application_section_id?: number;
  note?: string;
  last_seen?: string;

  dev_id?: number;
  manufacturer?: string;
  model?: string;
  os?: string;
  os_version?: string;
  version_id?: number;
  is_perfect?: number;
};
const data: {
  [key: string]: (params?: BugParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.basicBug = async (params) => {
  const item = {
    id: 1,
    wp_user_id: 1,
    campaign_id: 1,
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
