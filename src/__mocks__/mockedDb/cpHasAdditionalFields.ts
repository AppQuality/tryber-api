import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_campaign_additional_fields";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER(11) NOT NULL PRIMARY KEY",
      "cp_id INTEGER(11) NOT NULL",
      "slug VARCHAR(32) NOT NULL",
      "title VARCHAR(32) NOT NULL",
      "type VARCHAR(6) NOT NULL", //enum("regex", "select")
      "validation VARCHAR(512)",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};
type AdditionalFields = {
  id?: number;
  cp_id?: number;
  slug?: string;
  title?: string;
  type?: string;
  validation?: string;
};

const data: {
  [key: string]: (params?: AdditionalFields) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.additional1 = async (params) => {
  const item = {
    id: 1,
    cp_id: 1,
    title: "Title of additional Field",
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
