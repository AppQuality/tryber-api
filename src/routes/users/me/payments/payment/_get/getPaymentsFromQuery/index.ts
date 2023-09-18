import { tryber } from "@src/features/database";
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

  const q = tryber.tables.WpAppqPayment.do()
    .select(
      tryber.ref("id").withSchema("wp_appq_payment"),
      tryber.ref("amount").withSchema("wp_appq_payment"),
      tryber.ref("creation_date").withSchema("wp_appq_payment").as("date"),
      tryber.ref("id").withSchema("wp_appq_evd_campaign").as("cp_id"),
      tryber.ref("title").withSchema("wp_appq_evd_campaign").as("cp_title"),
      tryber
        .ref("work_type")
        .withSchema("wp_appq_payment_work_types")
        .as("type")
    )
    .join(
      "wp_appq_evd_campaign",
      "wp_appq_evd_campaign.id",
      "wp_appq_payment.campaign_id"
    )
    .join(
      "wp_appq_payment_request",
      "wp_appq_payment_request.id",
      "wp_appq_payment.request_id"
    )
    .join(
      "wp_appq_payment_work_types",
      "wp_appq_payment_work_types.id",
      "wp_appq_payment.work_type_id"
    )
    .where("request_id", requestId)
    .where("wp_appq_payment_request.tester_id", testerId)
    .limit(query.limit || 25)
    .offset(query.start || 0);

  if (query.orderBy) {
    if (query.orderBy === "amount") {
      q.orderBy("wp_appq_payment.amount", query.order || "DESC");
    } else if (query.orderBy === "activity") {
      q.orderBy("wp_appq_evd_campaign.id", query.order || "DESC").orderBy(
        "wp_appq_evd_campaign.title",
        query.order || "DESC"
      );
    } else {
      q.orderBy(query.orderBy, query.order || "DESC");
    }
  } else {
    q.orderBy("date", query.order || "DESC");
  }

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
    ORDER BY ${query.orderBy || "date"} 
    ${query.order || "DESC"} 
    ${pagination}
`;

  const results = (await q).map((row) => {
    return {
      id: row.id,
      amount: row.amount,
      date: row.date,
      activity: `[CP-${row.cp_id}] ${row.cp_title}`,
      type: row.type,
    };
  });

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
