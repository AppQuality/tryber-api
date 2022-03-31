import * as db from "@src/features/db";

export default async (
  testerId: number,
  query: StoplightOperations["get-users-me-pending-booty"]["parameters"]["query"]
): Promise<{
  results: {
    id: number;
    name: string;
    amount: number;
    attributionDate: string;
    activityName: string;
  }[];
  total?: number;
}> => {
  const data = [];
  const WHERE = `WHERE 
    p.tester_id = ? and p.is_paid=0 and p.is_requested=0`;
  data.push(testerId);

  let pagination = ``;
  query.limit
    ? (pagination += `LIMIT ` + query.limit)
    : (pagination += `LIMIT 25`);
  query.start ? (pagination += ` OFFSET ` + query.start) : (pagination += ``);

  const sql = `
    SELECT 
        p.id as id, p.amount as amount, 
        CAST(p.creation_date as CHAR) as attributionDate, 
        CONCAT('[CP-', cp.id, '] ', cp.title) as activityName
    FROM wp_appq_payment p
    JOIN wp_appq_evd_campaign cp ON p.campaign_id = cp.id 
    ${WHERE} 
    ORDER BY ${query.orderBy || "attributionDate"} 
    ${query.order || "DESC"}, attributionDate ${query.order || "DESC"}
    ${pagination}
`;
  const results = await db.query(db.format(sql, data));

  let total = undefined;
  if (query.limit) {
    const countSql = `SELECT COUNT(p.id) as total
    FROM wp_appq_payment p 
      ${WHERE}`;
    const countResults = await db.query(db.format(countSql, data));
    total = countResults[0].total;
  }
  return { results, total };
};
