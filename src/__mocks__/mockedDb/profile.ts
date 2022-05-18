import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_appq_evd_profile", [
      "id INTEGER PRIMARY KEY",
      "name VARCHAR(255)",
      "surname VARCHAR(255)",
      "email VARCHAR(255)",
      "wp_user_id INTEGER ",
      "is_verified INTEGER DEFAULT 0",
      "booty DECIMAL(11,2)",
      "pending_booty DECIMAL(11,2)",
      "total_exp_pts INTEGER DEFAULT 0",
      "birth_date DATETIME",
      "phone_number VARCHAR(15)",
      "sex INTEGER",
      "country VARCHAR(45)",
      "city VARCHAR(45)",
      "onboarding_complete INTEGER",
      "employment_id INTEGER",
      "education_id INTEGER",
      "last_activity TIMESTAMP",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_appq_evd_profile");
  },
};

type TesterParams = {
  id?: number;
  name?: string;
  surname?: string;
  email?: string;
  wp_user_id?: number;
  is_verified?: number;
  booty?: number;
  pending_booty?: number;
  total_exp_pts?: number;
  birth_date?: string;
  phone_number?: string;
  sex?: number;
  country?: string;
  city?: string;
  onboarding_complete?: number;
  employment_id?: number;
  education_id?: number;
  last_activity?: string;
};
const data: {
  [key: string]: (params?: TesterParams) => Promise<{ [key: string]: any }>;
} = {};

data.basicTester = async (params) => {
  const item = {
    id: 1,
    name: "tester",
    surname: "tester",
    email: "tester@example.com",
    pending_booty: 0,
    wp_user_id: 1,
    is_verified: 0,
    last_activity: new Date("01/01/2021").toISOString(),
    total_exp_pts: 1000,
    ...params,
  };
  await sqlite3.insert("wp_appq_evd_profile", item);
  return item;
};

data.testerWithoutBooty = async () => {
  const item = {
    id: 1,
    name: "tester",
    surname: "tester",
    email: "tester@example.com",
    pending_booty: 0,
    wp_user_id: 1,
    is_verified: 0,
    last_activity: new Date("01/01/2021").toISOString(),
  };
  await sqlite3.insert("wp_appq_evd_profile", item);
  return item;
};

data.testerWithBooty = async (params?: { pending_booty?: number }) => {
  const item = {
    id: 1,
    name: "tester",
    surname: "tester",
    email: "tester@example.com",
    pending_booty: 100,
    wp_user_id: 1,
    is_verified: 0,
    last_activity: new Date("01/01/2021").toISOString(),
    ...params,
  };
  await sqlite3.insert("wp_appq_evd_profile", item);
  return item;
};

export { data };
