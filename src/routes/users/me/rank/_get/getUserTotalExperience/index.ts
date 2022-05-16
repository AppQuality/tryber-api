import * as db from "@src/features/db";

export default async function getUserTotalExperience(
  tester_id: number
): Promise<number> {
  const results = await db.query(
    db.format(
      ` SELECT total_exp_pts 
        FROM wp_appq_evd_profile 
        WHERE id = ? `,
      [tester_id]
    )
  );
  if (!results.length) {
    throw new Error("No user found");
  }
  return results[0].total_exp_pts;
}
