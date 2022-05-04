import * as db from "@src/features/db";

export default async function getMonthlyPoints(
  tester_id: number
): Promise<number> {
  const userMonthlyExpPoints = await db.query(
    db.format(
      `
  SELECT SUM(amount) AS points
  FROM wp_appq_exp_points
  WHERE tester_id = ? AND MONTH(creation_date) = MONTH(NOW()) ;`,
      [tester_id]
    )
  );
  if (!userMonthlyExpPoints.length || !userMonthlyExpPoints[0].points) {
    return 0;
  }
  return userMonthlyExpPoints[0].points;
}
