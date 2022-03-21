import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_appq_fiscal_profile", [
      "id INTEGER PRIMARY KEY",
      "tester_id INTEGER ",
      "is_active INTEGER DEFAULT 0",
      "is_verified INTEGER DEFAULT 0",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_appq_fiscal_profile");
  },
};

const data: { [key: string]: (params?: any) => { [key: string]: any } } = {};

data.inactiveFiscalProfile = ({ tester_id }: { tester_id: number }) => {
  const item = {
    id: 1,
    tester_id,
    is_active: 0,
    is_verified: 1,
  };
  sqlite3.insert("wp_appq_fiscal_profile", item);
  return item;
};

data.invalidFiscalProfile = ({ tester_id }: { tester_id: number }) => {
  const item = {
    id: 1,
    tester_id,
    is_active: 1,
    is_verified: 0,
  };
  sqlite3.insert("wp_appq_fiscal_profile", item);
  return item;
};
data.validFiscalProfile = ({ tester_id }: { tester_id: number }) => {
  const item = {
    id: 1,
    tester_id,
    is_active: 1,
    is_verified: 1,
  };
  sqlite3.insert("wp_appq_fiscal_profile", item);
  return item;
};

export { data };
