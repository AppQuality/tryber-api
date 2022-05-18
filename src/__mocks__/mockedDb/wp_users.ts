import sqlite3 from '@src/features/sqlite';

const tableName = "wp_users";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "ID INTEGER PRIMARY KEY",
      "user_login VARCHAR(255)",
      "user_email VARCHAR(100)",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type WpUsersParams = {
  ID?: number;
  user_login?: string;
  user_email?: string;
};
const data: {
  [key: string]: (params?: WpUsersParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.basicUser = async (params?: WpUsersParams) => {
  const item = {
    ID: 1,
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
