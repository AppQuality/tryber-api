import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_campaign_task";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER(11) NOT NULL PRIMARY KEY",
      "title VARCHAR(140) NOT NULL",
      "content TEXT NOT NULL",
      "campaign_id INTEGER(11) NOT NULL",
      "is_required INTEGER(1) NOT NULL",
      "group_id INTEGER(1) NOT NULL DEFAULT 1",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};
type UsecasesParams = {
  id?: number;
  title?: string;
  content?: string;
  campaign_id?: number;
  is_required?: number;
  group_id?: number;
};

const data: {
  [key: string]: (params?: UsecasesParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.usecase1 = async (params) => {
  const item = {
    id: 1,
    title: "Title of usecase1",
    content: "Content of usecase1",
    campaign_id: 1,
    is_required: 0,
    group_id: 1,
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
