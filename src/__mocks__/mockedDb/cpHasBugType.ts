import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_additional_bug_types";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "campaign_id INTEGER(11)",
      "bug_type_id INTEGER(2)",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type CpHasBugTypeParams = {
  id?: number;
  campaign_id?: number;
  bug_type_id?: number;
};
const data: {
  [key: string]: (
    params?: CpHasBugTypeParams
  ) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.cpBugType = async (params) => {
  const item = {
    id: 1,
    bug_type_id: 1,
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
