import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_profile_certifications";
export const table = {
  create: async () => {
    await sqlite3.run(`
    CREATE TABLE ${tableName} (
      id INTEGER PRIMARY KEY,
      tester_id INTEGER,
      cert_id INTEGER,
      achievement_date TIMESTAMP,
      UNIQUE( tester_id, cert_id )
    )`);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type TesterHasCertificationParams = {
  id?: number;
  tester_id?: number;
  cert_id?: number;
  achievement_date?: string;
};
const data: {
  [key: string]: (
    params?: TesterHasCertificationParams
  ) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.assignCertification = async (params) => {
  const item = {
    id: 1,
    tester_id: 1,
    cert_id: 1,
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
