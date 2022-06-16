import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_campaign_task_group";
export const table = {
  create: async () => {
    await sqlite3.run(`
    CREATE TABLE ${tableName} (
      task_id INTEGER(1) NOT NULL,
      group_id INTEGER(1) NOT NULL DEFAULT 0,
      PRIMARY KEY (task_id, group_id)
    )`);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};
type GroupsParams = {
  task_id?: number;
  group_id?: number;
};

const data: {
  [key: string]: (params?: GroupsParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.group1 = async (params) => {
  const item = {
    task_id: 1,
    group_id: 1,
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
