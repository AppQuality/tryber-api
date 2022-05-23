import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_custom_user_field_data";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "profile_id INTEGER NOT NULL",
      "value VARCHAR(512)",
      "custom_user_field_id INTEGER",
      "candidate BOOL",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type CUFDataParams = {
  id?: number;
  profile_id?: number;
  value?: string;
  custom_user_field_id?: number;
  candidate?: number;
};
const data: {
  [key: string]: (params?: CUFDataParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.insertCufData = async (params) => {
  const item = {
    id: 1,
    custom_user_field_id: 1,
    profile_id: 1,
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};
export { data };
