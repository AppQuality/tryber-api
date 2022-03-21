import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_options", [
      "option_id INTEGER PRIMARY KEY",
      "option_name VARCHAR(191)",
      "option_value LONGTEXT",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_options");
  },
};

const data: { [key: string]: (params?: any) => { [key: string]: any } } = {};

data.crowdWpOptions = () => {
  const item = {
    option_id: 1,
    option_name: "crowd_options_option_name",
    option_value:
      'a:17:{s:11:"facebook_id";s:3:"asd";s:20:"facebook_secret_code";s:3:"asd";s:11:"linkedin_id";s:3:"asd";s:20:"linkedin_secret_code";s:3:"asd";s:15:"paypal_live_env";s:15:"paypal_live_env";s:16:"paypal_client_id";s:3:"asd";s:18:"paypal_secret_code";s:3:"asd";s:22:"transfer_wise_live_env";s:22:"transfer_wise_live_env";s:25:"transfer_wise_secret_code";s:3:"asd";s:14:"analitycs_code";s:0:"";s:14:"minimum_payout";s:1:"2";s:13:"appq_cm_email";s:13:"a@example.com";s:9:"adv_email";s:13:"a@example.com";s:11:"adv_project";s:2:"59";s:21:"italian_payment_check";s:21:"italian_payment_check";s:15:"stamp_threshold";s:5:"77.47";s:15:"release_message";s:2:"[]";}',
  };
  sqlite3.insert("wp_options", item);
  return item;
};

export { data };
