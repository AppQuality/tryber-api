import sqlite3 from "@src/features/sqlite";

const tableName = "wp_users";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, ["ID INTEGER PRIMARY KEY"]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type WpUsersParams = {
  ID?: number;
};
const data: {
  [key: string]: (params?: WpUsersParams) => Promise<{ [key: string]: any }>;
} = {};

data.basicUser = async (params?: WpUsersParams) => {
  const item = {
    ID: 1,
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
