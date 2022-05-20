import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_evd_bug";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "message VARCHAR(255)",
      "campaign_id INTEGER",
      "status_id INTEGER",
      "wp_user_id INTEGER",
      "severity_id INTEGER",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type BugParams = {
  id?: number;
  message?: string;
  campaign_id?: number;
  status_id?: number;
  wp_user_id?: number;
  severity_id?: number;
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
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
