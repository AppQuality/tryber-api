import sqlite3 from "@src/features/sqlite";

const tableName = "wp_crowd_appq_device";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "form_factor VARCHAR(255)",
      "model VARCHAR(255)",
      "manufacturer VARCHAR(255)",
      "pc_type VARCHAR(255)",
      "os_version_id INTEGER",
      "id_profile INTEGER",
      "source_id INTEGER",
      "platform_id INTEGER",
      "enabled INTEGER",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type TesterDeviceParams = {
  id?: number;
  id_profile?: number;
  enabled?: number;
};
const data: {
  [key: string]: (
    params?: TesterDeviceParams
  ) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

export { data };
