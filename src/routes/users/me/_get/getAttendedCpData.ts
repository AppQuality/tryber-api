import { tryber } from "@src/features/database";

export default async (id: string) => {
  try {
    const query = tryber.tables.WpAppqExpPoints.do()
      .select(tryber.raw("COUNT(DISTINCT campaign_id) AS attended_cp"))
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_exp_points.tester_id"
      )
      .where("wp_appq_exp_points.activity_id", 1)
      .andWhere("wp_appq_exp_points.amount", ">", 0)
      .andWhere("wp_appq_evd_profile.wp_user_id", id)
      .first();

    const data = (await query) as unknown as { attended_cp: number };
    if (!data) return Promise.reject(Error("Invalid cp data"));
    return { attended_cp: Number(data.attended_cp) };
  } catch (e) {
    return Promise.reject(e);
  }
};
