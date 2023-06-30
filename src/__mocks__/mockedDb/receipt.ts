import sqlite3 from "@src/features/sqlite";
const tableName = "wp_appq_receipt";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "url VARCHAR(256)",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type ReceiptParams = {
  id?: number;
  url?: string;
};
const data: {
  [key: string]: (params?: ReceiptParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.basicReceipt = async (params) => {
  const item = { tester_id: 1 };
  await sqlite3.insert(tableName, { ...item, ...params });
  return item;
};

export { data };
