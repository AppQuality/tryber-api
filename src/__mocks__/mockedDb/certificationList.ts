import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_certifications_list";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "name VARCHAR(255)",
      "area VARCHAR(255)",
      "institute VARCHAR(255)",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type UsersDeletionReasonParams = {
  ID?: number;
};
const data: {
  [key: string]: (
    params?: UsersDeletionReasonParams
  ) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

export { data };
