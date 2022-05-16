import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_appq_popups", [
      "id INTEGER(11) PRIMARY KEY",
      "title VARCHAR(128)",
      "content TEXT",
      "is_once INTEGER(1)",
      "targets VARCHAR(32)",
      "extras TEXT",
      "is_auto BOOLEAN NOT NULL DEFAULT FALSE",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_appq_popups");
  },
};

type PopupParams = {
  id?: number;
  title?: string;
  content?: string;
  is_once?: number;
  targets?: string;
  extras?: string;
  is_auto?: number;
};
const data: {
  [key: string]: (params?: PopupParams) => Promise<{ [key: string]: any }>;
} = {};

data.basicPopup = async (params) => {
  const item = {
    id: 1,
    title: "This is the POPUP title",
    targets: "list",
    extras: "",
    content: "eyJST09ertgetrerbsfgUIjp",
    is_auto: 0,
    ...params,
  };
  await sqlite3.insert("wp_appq_popups", item);
  return item;
};

export { data };
