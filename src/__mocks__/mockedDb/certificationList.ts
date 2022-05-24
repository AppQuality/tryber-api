import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_certifications_list";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "name VARCHAR(255)",
      "area VARCHAR(255)",
      "institute VARCHAR(255)",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type CertificationParams = {
  id?: number;
  name?: string;
  area?: string;
  institute?: string;
};
const data: {
  [key: string]: (
    params?: CertificationParams
  ) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.certification1 = async (params) => {
  const item = {
    id: 1,
    name: "Best Tryber Ever",
    area: "Testing 360",
    institute: "Tryber",
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
