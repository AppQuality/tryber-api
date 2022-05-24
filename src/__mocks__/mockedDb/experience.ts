import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_exp_points";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "tester_id INTEGER",
      "amount DECIMAL(11,0)",
      "creation_date TIMESTAMP",
      "activity_id INTEGER",
      "reason VARCHAR(255)",
      "campaign_id INTEGER",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type ExpParams = {
  id?: number;
  tester_id?: number;
  amount?: number;
  creation_date?: string;
};
const data: {
  [key: string]: (params?: ExpParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.basicExperience = async (params) => {
  const item = {
    id: 1,
    tester_id: 1,
    amount: 100,
    creation_date: new Date().toISOString().split(".")[0].replace("T", " "),
    ...params,
  };
  await sqlite3.insert("wp_appq_exp_points", item);
  return item;
};

export { data };
