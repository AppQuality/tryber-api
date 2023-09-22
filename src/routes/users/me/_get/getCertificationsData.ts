import { tryber } from "@src/features/database";

export default async (id: string) => {
  try {
    const data = await tryber.tables.WpAppqProfileCertifications.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_certifications_list"),
        tryber.ref("name").withSchema("wp_appq_certifications_list"),
        tryber.ref("area").withSchema("wp_appq_certifications_list"),
        tryber.ref("institute").withSchema("wp_appq_certifications_list"),
        tryber
          .ref("achievement_date")
          .withSchema("wp_appq_profile_certifications")
      )
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_profile_certifications.tester_id"
      )
      .join(
        "wp_appq_certifications_list",
        "wp_appq_certifications_list.id",
        "wp_appq_profile_certifications.cert_id"
      )
      .where("wp_appq_evd_profile.wp_user_id", id);

    if (!data.length) {
      const emptyCerts = await tryber.tables.WpUsermeta.do()
        .select()
        .where("user_id", id)
        .andWhere("meta_key", "emptyCerts")
        .andWhere("meta_value", "true");

      if (!emptyCerts.length) {
        return Promise.reject(Error("Invalid certification data"));
      }
      return { certifications: false };
    }
    return {
      certifications: data.map((d) => {
        const item = {
          ...d,
          achievement_date: new Date(d.achievement_date)
            .toISOString()
            .substring(0, 10),
        };
        return item;
      }),
    };
  } catch (e) {
    if (process.env && process.env.DEBUG) console.log(e);
    return Promise.reject(e);
  }
};
