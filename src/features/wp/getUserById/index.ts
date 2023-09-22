import { tryber } from "@src/features/database";

export default async (userId: number) => {
  const results = await tryber.tables.WpAppqEvdProfile.do()
    .select(
      tryber.ref("id").withSchema("wp_appq_evd_profile").as("testerId"),
      tryber.ref("ID").withSchema("wp_users").as("ID"),
      tryber.ref("user_login").withSchema("wp_users").as("user_login"),
      tryber.ref("user_pass").withSchema("wp_users").as("user_pass")
    )
    .join("wp_users", "wp_users.ID", "wp_appq_evd_profile.wp_user_id")
    .where("wp_users.ID", userId)
    .first();

  if (!results) return new Error("No user with id " + userId);

  return { ...results, ID: results.ID.toString() };
};
