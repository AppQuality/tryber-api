import { tryber } from "@src/features/database";
const useBasicData = () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      name: "tester",
      surname: "tester",
      email: "tester@example.com",
      pending_booty: 0,
      wp_user_id: 1,
      is_verified: 0,
      last_activity: new Date("01/01/2021").toISOString(),
      total_exp_pts: 1000,
      employment_id: 1,
      education_id: 1,
    });
    await tryber.tables.WpUsers.do().insert({
      ID: 1,
      user_login: "tester",
      user_email: "tester@example.com",
      user_pass: "pass",
    });
    /*await tryber.tables.WpAppqLang.do().insert([
      { id: 1, display_name: "Italiano", lang_code: "it" },
      { id: 2, display_name: "English", lang_code: "en" },
      { id: 3, display_name: "Itialian (Sicilian)", lang_code: "it-sc" },
      { id: 4, display_name: "Arabic", lang_code: "ar" },
      { id: 5, display_name: "Hindi", lang_code: "hi" },
    ]);*/
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqLang.do().delete();
    await tryber.tables.WpAppqProfileHasLang.do().delete();
  });
};

export default useBasicData;
