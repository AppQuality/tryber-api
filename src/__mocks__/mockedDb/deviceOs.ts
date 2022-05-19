import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_os";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "display_name VARCHAR(255)",
      "version_number VARCHAR(255)",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type DeviceOsParams = {
  id?: number;
};
const data: {
  [key: string]: (params?: DeviceOsParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

export { data };
