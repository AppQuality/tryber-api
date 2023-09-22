import sqlite3 from "@src/features/sqlite";

const tableName = "wp_usermeta";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "user_id INTEGER NOT NULL",
      "meta_key VARCHAR(255)",
      "meta_value LONGTEXT",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type WpUsersMetaParams = {
  id?: number;
  user_id?: number;
  meta_key?: string;
  meta_value?: string;
};
const data: {
  [key: string]: (
    params?: WpUsersMetaParams
  ) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.basicMeta = async (params?: WpUsersMetaParams) => {
  const item = {
    user_id: 1,
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
