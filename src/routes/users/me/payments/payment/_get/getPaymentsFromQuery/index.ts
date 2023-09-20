import * as db from "@src/features/db";

export default async (
  testerId: number,
  requestId: number,
  query: StoplightOperations["get-users-me-payments"]["parameters"]["query"]
): Promise<{
  results: {
    id: number;
    amount: number;
    date: string;
    activity: string;
    type: string;
  }[];
  total?: number;
}> => {
  const data = [];
  const WHERE = `WHERE request_id = ? AND req.tester_id = ? `;
  data.push(requestId);
  data.push(testerId);

  let pagination = ``;
  query.limit
    ? (pagination += `LIMIT ` + query.limit)
    : (pagination += `LIMIT 25`);
  query.start ? (pagination += ` OFFSET ` + query.start) : (pagination += ``);

  let orderBy = query.orderBy || "date";
  if (orderBy === "net" || orderBy === "gross") orderBy = "amount";

  const sql = `
    SELECT 
        p.id, p.amount as amount,p.creation_date as date,
        CONCAT("[CP-",cp.id,"] ",cp.title) as activity,
        wt.work_type as type
    FROM 
        wp_appq_payment p
    JOIN 
        wp_appq_evd_campaign cp ON p.campaign_id = cp.id
    JOIN 
        wp_appq_payment_request req ON req.id = p.request_id
    JOIN 
        wp_appq_evd_profile t ON t.id = req.tester_id
    JOIN 
        wp_appq_payment_work_types wt ON p.work_type_id = wt.id
    ${WHERE} 
    ORDER BY ${orderBy || "date"} 
    ${query.order || "DESC"} 
    ${pagination}
`;

  const results = await db.query(db.format(sql, data));

  let total = undefined;
  if (query.limit) {
    const countSql = `
    SELECT 
        COUNT(p.id) as total
    FROM 
        wp_appq_payment p
    JOIN 
        wp_appq_evd_campaign cp ON p.campaign_id = cp.id
    JOIN 
        wp_appq_payment_request req ON req.id = p.request_id
    JOIN 
        wp_appq_evd_profile t ON t.id = req.tester_id
    JOIN 
        wp_appq_payment_work_types wt ON p.work_type_id = wt.id
      ${WHERE}`;
    const countResults = await db.query(db.format(countSql, data));
    total = countResults[0].total;
  }
  return { results, total };
};
