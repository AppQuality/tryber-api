import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_appq_exp_points", [
      "id INTEGER PRIMARY KEY",
      "tester_id INTEGER",
      "amount DECIMAL(11,0)",
      "creation_date TIMESTAMP",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_appq_exp_points");
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
} = {};

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
