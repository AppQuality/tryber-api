import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_appq_evd_campaign", [
      "id INTEGER(11) PRIMARY KEY",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_appq_evd_campaign");
  },
};

type CampaignParams = {
  id?: number;
};
const data: {
  [key: string]: (params?: CampaignParams) => Promise<{ [key: string]: any }>;
} = {};

data.basicCampaign = async (params) => {
  const item = {
    id: 1,
    ...params,
  };
  await sqlite3.insert("wp_appq_evd_campaign", item);
  return item;
};

export { data };
