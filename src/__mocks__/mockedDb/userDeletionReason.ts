import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_user_deletion_reason";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "tester_id INTEGER NOT NULL",
      "reason TEXT NOT NULL",
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
