import * as db from "@src/features/db";

export default async (
  testerId: number,
  query: StoplightOperations["get-users-me-payments"]["parameters"]["query"]
): Promise<{
  results: {
    id: number;
    is_paid: 0 | 1;
    amount: number;
    amount_gross: number;
    paypal_email?: string;
    iban?: string;
    paidDate: string;
    receipt: string;
  }[];
  total?: number;
}> => {
  const data = [];
  const WHERE = `WHERE 
    pr.tester_id = ? AND (
        (pr.paypal_email IS NOT NULL AND pr.paypal_email <> "") 
        OR (pr.iban IS NOT NULL AND pr.iban <> "")
    )`;
  data.push(testerId);

  let pagination = ``;
  query.limit
    ? (pagination += `LIMIT ` + query.limit)
    : (pagination += `LIMIT 25`);
  query.start ? (pagination += ` OFFSET ` + query.start) : (pagination += ``);

  const sql = `
    SELECT 
        pr.id, pr.is_paid, pr.amount, pr.amount_gross, pr.paypal_email, pr.iban,
        CASE 
            WHEN pr.is_paid=0 THEN NOW()
            ELSE CAST(pr.paid_date as CHAR) 
        END as paidDate, 
        rcpt.url AS receipt
    FROM wp_appq_payment_request pr
    LEFT JOIN wp_appq_receipt rcpt ON pr.receipt_id = rcpt.id 
    ${WHERE} 
    ORDER BY ${query.orderBy || "paidDate"} 
    ${query.order || "DESC"} 
    ${pagination}
`;

  const results = await db.query(db.format(sql, data));

  let total = undefined;
  if (query.limit) {
    const countSql = `SELECT COUNT(pr.id) as total
    FROM wp_appq_payment_request pr 
      ${WHERE}`;
    const countResults = await db.query(db.format(countSql, data));
    total = countResults[0].total;
  }
  return { results, total };
};
