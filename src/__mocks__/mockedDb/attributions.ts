import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_appq_payment", [
      "id INTEGER PRIMARY KEY",
      "tester_id INTEGER",
      "amount DECIMAL(11,2)",
      "is_requested INTEGER DEFAULT 0",
      "creation_date DATETIME",
      "work_type_id INTEGER",
      "request_id INTEGER DEFAULT NULL",
      "campaign_id INTEGER",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_appq_payment");
  },
};

type AttributionParams = {
  id?: number;
  tester_id?: number;
  amount?: number;
  request_id?: number;
  creation_date?: string;
  work_type_id?: number;
  campaign_id?: number;
};
const data: {
  [key: string]: (
    params?: AttributionParams
  ) => Promise<{ [key: string]: any }>;
} = {};

data.validAttribution = async (params?: AttributionParams) => {
  const item = {
    id: 1,
    tester_id: 1,
    amount: 1,
    campaign_id: 1,
    work_type_id: 1,
    creation_date: "2020-01-01",
    ...params,
  };
  await sqlite3.insert("wp_appq_payment", item);
  return item;
};

export { data };
