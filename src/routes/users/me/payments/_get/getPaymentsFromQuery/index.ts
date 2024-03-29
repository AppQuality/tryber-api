import { tryber } from "@src/features/database";

export default async (
  testerId: number,
  query: StoplightOperations["get-users-me-payments"]["parameters"]["query"]
): Promise<{
  results: {
    id: number;
    is_paid: 0 | 1;
    amount: number;
    amount_gross: number;
    net_multiplier: number;
    paypal_email?: string;
    iban?: string;
    paidDate: string;
    receipt: string;
  }[];
  total?: number;
}> => {
  const whereFunction = (q: any) => {
    q.where((q: any) => {
      q.where((q: any) => {
        q.whereNotNull("wp_appq_payment_request.paypal_email").andWhere(
          "wp_appq_payment_request.paypal_email",
          "<>",
          ""
        );
      }).orWhere((q: any) => {
        q.whereNotNull("wp_appq_payment_request.iban").andWhere(
          "wp_appq_payment_request.iban",
          "<>",
          ""
        );
      });
    }).andWhere("wp_appq_payment_request.tester_id", testerId);
  };

  const q = tryber.tables.WpAppqPaymentRequest.do()
    .select(
      "wp_appq_payment_request.id",
      "wp_appq_payment_request.is_paid",
      "wp_appq_payment_request.amount",
      "wp_appq_payment_request.amount_gross",
      "wp_appq_payment_request.net_multiplier",
      "wp_appq_payment_request.paypal_email",
      "wp_appq_payment_request.iban",
      tryber.raw("CAST(wp_appq_payment_request.paid_date as CHAR) as paidDate"),
      "wp_appq_receipt.url as receipt"
    )
    .leftJoin(
      "wp_appq_receipt",
      "wp_appq_payment_request.receipt_id",
      "wp_appq_receipt.id"
    )
    .andWhere(function () {
      whereFunction(this);
    });

  const orderBy = !query.orderBy ? "paidDate" : query.orderBy;
  if (orderBy === "updated") {
    q.orderBy("update_date", query.order || "DESC");
  } else if (orderBy === "created") {
    q.orderBy("request_date", query.order || "DESC");
  } else if (orderBy !== "paidDate") {
    q.orderBy(orderBy, query.order || "DESC");
  }

  let results = await q;
  if (orderBy === "paidDate") {
    results.sort((a, b) => {
      if (a.is_paid === 0) {
        return -1;
      }
      if (b.is_paid === 0) {
        return 1;
      }
      if (new Date(a.paidDate) < new Date(b.paidDate)) {
        return 1;
      }
      if (new Date(a.paidDate) > new Date(b.paidDate)) {
        return -1;
      }
      return b.id - a.id;
    });

    if (query.order === "ASC") {
      results.reverse();
    }
  }

  const limit = query.limit || 25;
  const start = query.start || 0;
  results = results.slice(start, start + limit);
  let total = undefined;
  if (query.limit) {
    const countQ = tryber.tables.WpAppqPaymentRequest.do()
      .count("wp_appq_payment_request.id as total")
      .where(function () {
        whereFunction(this);
      })
      .first();
    const countResults: any = await countQ;
    total = countResults.total
      ? Number(countResults.total)
      : Number(countResults);
  }
  return { results, total };
};
