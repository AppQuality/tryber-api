import * as db from "@src/features/db";

export default async (
  query: StoplightOperations["get-payments"]["parameters"]["query"]
): Promise<
  {
    id: number;
    paypal_email?: string;
    iban?: string;
    amount: number;
    created: string;
    updated?: string;
    error_message?: string;
    tester_id: string;
    tester_name: string;
    tester_surname: string;
  }[]
> => {
  let WHERE = ``;
  if (query.status == "failed") {
    WHERE += ` WHERE p.error_message IS NOT NULL `;
  }

  const sql = `SELECT 
      t.id   as tester_id,
      t.name as tester_name,
      t.surname as tester_surname,
      p.id as id, 
      p.amount,
      p.request_date as created,
      p.iban,
      p.paypal_email,
      p.update_date as updated,
      p.error_message
    FROM wp_appq_payment_request p
    JOIN wp_appq_evd_profile t ON (t.id = p.tester_id) 
    ${WHERE}
    ORDER BY ${query.orderBy || "p.id"} ${query.order || "ASC"}
    `;

  return await db.query(sql);
};
