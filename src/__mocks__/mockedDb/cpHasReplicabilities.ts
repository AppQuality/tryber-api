import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_additional_bug_replicabilities";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "campaign_id INTEGER(11)",
      "bug_replicability_id INTEGER(2)",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type ReplicabilityParams = {
  id?: number;
  campaign_id?: number;
  bug_replicability_id?: number;
};
const data: {
  [key: string]: (
    params?: ReplicabilityParams
  ) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.cpReplicability = async (params) => {
  const item = {
    id: 1,
    bug_replicability_id: 1,
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
