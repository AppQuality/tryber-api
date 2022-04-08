import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_appq_evd_campaign", [
      "id INTEGER(11) PRIMARY KEY",
      "title VARCHAR(256) NOT NULL",
      "description VARCHAR(512)",
      "platform_id INTEGER(11) NOT NULL",
      "start_date DATETIME NOT NULL",
      "end_date DATETIME NOT NULL",
      "close_date DATETIME",
      "desired_number_of_testers INTEGER(4) DEFAULT 20",
      "customer VARCHAR(45)",
      "platform_version INTEGER(11)",
      "test_fairy_project VARCHAR(45)",
      "test_fairy_build VARCHAR(45)",
      "jot_form_prj VARCHAR(45)",
      "base_bug_internal_id VARCHAR(45)",
      "number_of_test_case INTEGER(2)",
      "status_id INTEGER(1) DEFAULT 1",
      "is_public INTEGER(1) DEFAULT 0",
      "manual_link VARCHAR(256)",
      "preview_link VARCHAR(256)",
      "page_preview_id INTEGER(20) NOT NULL",
      "page_manual_id INTEGER(20) NOT NULL",
      "campaign_type INTEGER(1) DEFAULT 0",
      "os VARCHAR(3000) DEFAULT 0",
      "form_factor VARCHAR(3000) DEFAULT 0",
      "low_bug_pts INTEGER(1) NOT NULL DEFAULT 0",
      "medium_bug_pts INTEGER(1) NOT NULL DEFAULT 0",
      "high_bug_pts INTEGER(1) NOT NULL DEFAULT 0",
      "critical_bug_pts INTEGER(1) NOT NULL DEFAULT 0",
      "campaign_pts INTEGER(1) NOT NULL DEFAULT 200",
      "customer_id INTEGER(11) NOT NULL",
      "pm_id INTEGER(11) NOT NULL",
      "custom_link VARCHAR(256)",
      "min_allowed_media INTEGER(11) NOT NULL DEFAULT 3",
      "campaign_type_id INTEGER(11) DEFAULT 0",
      "project_id INTEGER(11) NOT NULL",
      "customer_title VARCHAR(256) NOT NULL",
      "screen_on_every_step INTEGER(2) NOT NULL DEFAULT 0",
      "tb_link VARCHAR(2048)",
      "cust_bug_vis INTEGER(1) NOT NULL DEFAULT 0",
      "bug_lang INTEGER(1) DEFAULT 0",
      "aq_index FLOAT NOT NULL DEFAULT 1",
      "effort FLOAT",
      "tokens_usage FLOAT",
      "ux_effort FLOAT",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_appq_evd_campaign");
  },
};

const data: {
  [key: string]: (params?: any) => Promise<{ [key: string]: any }>;
} = {};

data.runningCp = async () => {
  const item = {
    id: 1,
    title: "Running Campaign",
    description: "",
    platform_id: 1,
    start_date: new Date("01/01/2021").toISOString(),
    end_date: new Date("01/01/2021").toISOString(),
    close_date: new Date("01/01/2021").toISOString(),
    desired_number_of_testers: 20,
    customer: "",
    platform_version: 0,
    test_fairy_project: "",
    test_fairy_build: "",
    jot_form_prj: "",
    base_bug_internal_id: "",
    number_of_test_case: 0,
    status_id: 1,
    is_public: 0,
    manual_link: "",
    preview_link: "",
    page_preview_id: 0,
    page_manual_id: 0,
    campaign_type: 0,
    os: "",
    form_factor: "",
    low_bug_pts: 0,
    medium_bug_pts: 0,
    high_bug_pts: 0,
    critical_bug_pts: 0,
    campaign_pts: 200,
    customer_id: 0,
    pm_id: 0,
    custom_link: "",
    min_allowed_media: 3,
    campaign_type_id: 0,
    project_id: 0,
    customer_title: "",
    screen_on_every_step: 0,
    tb_link: "",
    cust_bug_vis: 0,
    bug_lang: 0,
    aq_index: 1,
    effort: 0,
    tokens_usage: 0,
    ux_effort: 0,
  };
  await sqlite3.insert("wp_appq_evd_campaign", item);
  return item;
};

export { data };
