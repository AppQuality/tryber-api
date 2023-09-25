import { tryber } from "@src/features/database";
import * as db from "@src/features/db";

export default async (id: string) => {
  try {
    const data = await tryber.tables.WpAppqEvdProfile.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_employment"),
        tryber.ref("display_name").withSchema("wp_appq_employment").as("name")
      )
      .join(
        "wp_appq_employment",
        "wp_appq_employment.id",
        "wp_appq_evd_profile.employment_id"
      )
      .where("wp_appq_evd_profile.wp_user_id", id);

    if (!data.length) throw Error("Invalid employement data");
    return { profession: data[0] };
  } catch (e) {
    throw e;
  }
};
