import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_additional_bug_severities";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "campaign_id INTEGER(11)",
      "bug_severity_id INTEGER(2)",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type SeverityParams = {
  id?: number;
  campaign_id?: number;
  bug_severity_id?: number;
};
const data: {
  [key: string]: (params?: SeverityParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.cpSeverity = async (params) => {
  const item = {
    id: 1,
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
