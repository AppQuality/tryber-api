import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_profile_has_lang";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "profile_id INTEGER",
      "language_id INTEGER",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type TesterLanguageParams = {
  id?: number;
  profile_id?: number;
  language_id?: number;
};
const data: {
  [key: string]: (
    params?: TesterLanguageParams
  ) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};
data.assignLanguage = async (params) => {
  const item = {
    id: 1,
    profile_id: 1,
    language_id: 1,
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
