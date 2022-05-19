import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_payment_work_types";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "work_type VARCHAR(255)",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type WorkTypeParams = {
  id?: number;
};
const data: {
  [key: string]: (params?: WorkTypeParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

export { data };
