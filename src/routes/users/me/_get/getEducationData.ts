import { tryber } from "@src/features/database";

export default async (id: string) => {
  try {
    const data = await tryber.tables.WpAppqEvdProfile.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_education"),
        tryber.ref("display_name").withSchema("wp_appq_education").as("name")
      )
      .join(
        "wp_appq_education",
        "wp_appq_education.id",
        "wp_appq_evd_profile.education_id"
      )
      .where("wp_appq_evd_profile.wp_user_id", id);

    if (!data.length) return Promise.reject(Error("Invalid education data"));
    return { education: data[0] };
  } catch (e) {
    return Promise.reject(e);
  }
};
