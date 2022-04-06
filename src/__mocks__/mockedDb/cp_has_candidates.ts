import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_crowd_appq_has_candidate", [
      "user_id INTEGER(11) NOT NULL PRIMARY KEY",
      "campaign_id INTEGER(11) NOT NULL",
      "subscription_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
      "accepted INTEGER(1)",
      "devices VARCHAR(600) NOT NULL DEFAULT 0",
      "selected_device INTEGER(100) NOT NULL DEFAULT 0",
      "results INTEGER(11) NOT NULL DEFAULT 0",
      "modified TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
      "group_id INTEGER(1) NOT NULL DEFAULT 1",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_crowd_appq_has_candidate");
  },
};

const data: {
  [key: string]: (params?: any) => Promise<{ [key: string]: any }>;
} = {};

data.candidate1 = async () => {
  const item = {
    user_id: 1,
    campaign_id: 1,
    subscription_date: new Date("01/01/2021").toISOString(),
    accepted: 0,
    devices: "",
    selected_device: 0,
    results: 0,
    modified: new Date("01/01/2021").toISOString(),
    group_id: 1,
  };
  await sqlite3.insert("wp_crowd_appq_has_candidate", item);
  return item;
};

export { data };
