import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_appq_activity_level_definition", [
      "id INTEGER PRIMARY KEY",
      "name VARCHAR(64)",
      "reach_exp_pts INTEGER",
      "hold_exp_pts INTEGER",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_appq_activity_level_definition");
  },
};

type LevelParams = {
  id?: number;
  name?: string;
  reach_exp_pts?: number;
  hold_exp_pts?: number;
};
const data: {
  [key: string]: (params?: LevelParams) => Promise<{ [key: string]: any }>;
} = {};

data.basicLevel = async (params) => {
  const item = {
    id: 10,
    name: "Basic",
    reach_exp_pts: 0,
    hold_exp_pts: 0,
    ...params,
  };
  await sqlite3.insert("wp_appq_activity_level_definition", item);
  return item;
};

export { data };
