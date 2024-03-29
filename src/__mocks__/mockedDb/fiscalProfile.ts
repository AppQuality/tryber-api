import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_fiscal_profile";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "tester_id INTEGER ",
      "is_active INTEGER DEFAULT 0",
      "is_verified INTEGER DEFAULT 0",
      "fiscal_category INTEGER",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type FiscalProfileParams = {
  id?: number;
  tester_id?: number;
  fiscal_category?: number;
};
const data: {
  [key: string]: (
    params?: FiscalProfileParams
  ) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.inactiveFiscalProfile = async (params?: FiscalProfileParams) => {
  const item = {
    id: 1,
    tester_id: 1,
    is_active: 0,
    is_verified: 1,
    fiscal_category: 1,
    name: "",
    surname:"",
    birth_date:"",
    sex: -1,
    ...params,
  };
  await sqlite3.insert("wp_appq_fiscal_profile", item);
  return item;
};

data.invalidFiscalProfile = async (params?: FiscalProfileParams) => {
  const item = {
    id: 1,
    tester_id: params,
    is_active: 1,
    is_verified: 0,
    fiscal_category: 1,
    name: "",
    surname:"",
    birth_date:"",
    sex: -1,
    ...params,
  };
  await sqlite3.insert("wp_appq_fiscal_profile", item);
  return item;
};
data.validFiscalProfile = async (params?: FiscalProfileParams) => {
  const item = {
    id: 1,
    tester_id: 1,
    is_active: 1,
    is_verified: 1,
    fiscal_category: 1,
    name: "",
    surname:"",
    birth_date:"",
    sex: -1,
    ...params,
  };
  await sqlite3.insert("wp_appq_fiscal_profile", item);
  return item;
};

export { data };
