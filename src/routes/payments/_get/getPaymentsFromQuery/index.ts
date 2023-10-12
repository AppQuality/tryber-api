import { tryber } from "@src/features/database";

export default async (
  query: StoplightOperations["get-payments"]["parameters"]["query"]
): Promise<{
  results: {
    id: number;
    paypal_email?: string;
    iban?: string;
    amount: number;
    created: string;
    updated?: string;
    error_message?: string;
    tester_id: number;
    tester_name: string;
    tester_surname: string;
  }[];
  total?: number;
}> => {
  const q = tryber.tables.WpAppqPaymentRequest.do()
    .select(
      tryber.ref("id").withSchema("wp_appq_evd_profile").as("tester_id"),
      tryber.ref("name").withSchema("wp_appq_evd_profile").as("tester_name"),
      tryber
        .ref("surname")
        .withSchema("wp_appq_evd_profile")
        .as("tester_surname"),
      tryber.ref("id").withSchema("wp_appq_payment_request").as("id"),
      tryber.ref("amount").withSchema("wp_appq_payment_request").as("amount"),
      tryber
        .ref("request_date")
        .withSchema("wp_appq_payment_request")
        .as("created"),
      tryber.ref("iban").withSchema("wp_appq_payment_request").as("iban"),
      tryber
        .ref("paypal_email")
        .withSchema("wp_appq_payment_request")
        .as("paypal_email"),
      tryber
        .ref("update_date")
        .withSchema("wp_appq_payment_request")
        .as("updated"),
      tryber
        .ref("error_message")
        .withSchema("wp_appq_payment_request")
        .as("error_message")
    )
    .join(
      "wp_appq_evd_profile",
      "wp_appq_evd_profile.id",
      "wp_appq_payment_request.tester_id"
    )
    .whereIn("wp_appq_payment_request.fiscal_category", [1, 3])
    .where("wp_appq_evd_profile.name", "<>", "Deleted User")
    .where((q) => {
      q.where((q2) => {
        q2.whereNotNull("wp_appq_payment_request.paypal_email").where(
          "wp_appq_payment_request.paypal_email",
          "<>",
          ""
        );
      }).orWhere((q2) => {
        q2.whereNotNull("wp_appq_payment_request.iban").where(
          "wp_appq_payment_request.iban",
          "<>",
          ""
        );
      });
    })
    .limit(query.limit || 25)
    .offset(query.start || 0);

  if (query.status === "failed") {
    q.whereRaw("wp_appq_payment_request.error_message IS NOT NULL");
  } else if (query.status == "pending") {
    q.whereRaw(
      "wp_appq_payment_request.error_message IS NULL AND wp_appq_payment_request.is_paid = 0"
    );
  }

  if (query.orderBy) {
    q.orderBy(query.orderBy, query.order || "ASC");
  } else {
    q.orderBy("wp_appq_payment_request.id", query.order || "ASC");
  }

  if (query.filterBy?.paymentMethod === "paypal") {
    q.whereRaw(`wp_appq_payment_request.paypal_email IS NOT NULL`);
  } else if (query.filterBy?.paymentMethod === "transferwise") {
    q.whereRaw(`wp_appq_payment_request.iban IS NOT NULL`);
  }

  const results = await q;

  let total = undefined;
  if (query.limit) {
    const q = tryber.tables.WpAppqPaymentRequest.do()

      .count({
        count: tryber.ref("id").withSchema("wp_appq_payment_request"),
      })
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_payment_request.tester_id"
      )
      .where("wp_appq_evd_profile.name", "<>", "Deleted User")
      .where((q) => {
        q.where((q2) => {
          q2.whereNotNull("wp_appq_payment_request.paypal_email").where(
            "wp_appq_payment_request.paypal_email",
            "<>",
            ""
          );
        }).orWhere((q2) => {
          q2.whereNotNull("wp_appq_payment_request.iban").where(
            "wp_appq_payment_request.iban",
            "<>",
            ""
          );
        });
      });

    if (query.status === "failed") {
      q.whereRaw("wp_appq_payment_request.error_message IS NOT NULL");
    } else if (query.status == "pending") {
      q.whereRaw(
        "wp_appq_payment_request.error_message IS NULL AND wp_appq_payment_request.is_paid = 0"
      );
    }

    if (query.filterBy?.paymentMethod === "paypal") {
      q.whereRaw(`wp_appq_payment_request.paypal_email IS NOT NULL`);
    } else if (query.filterBy?.paymentMethod === "transferwise") {
      q.whereRaw(`wp_appq_payment_request.iban IS NOT NULL`);
    }
    let countResults = await q;
    total = Number(countResults[0].count);
  }

  return { results, total };
};
