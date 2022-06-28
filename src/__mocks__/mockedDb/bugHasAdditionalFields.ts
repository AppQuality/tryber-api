import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_campaign_additional_fields_data";
export const table = {
  create: async () => {
    await sqlite3.run(`
    CREATE TABLE ${tableName} (
      bug_id INTEGER(11) NOT NULL,
      type_id INTEGER(11) NOT NULL, 
      value VARCHAR(512),
      PRIMARY KEY (bug_id, type_id)
    )`);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};
type BugAdditionalFields = {
  bug_id?: number;
  type_id?: number; //id of additional field
  value?: string;
};

const data: {
  [key: string]: (
    params?: BugAdditionalFields
  ) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.bugAdditional1 = async (params) => {
  const item = {
    bug_id: 1,
    type_id: 1,
    value: "Value of additional-field1 on bug1",
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
