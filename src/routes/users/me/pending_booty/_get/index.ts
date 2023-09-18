/**  OPENAPI-CLASS : get-users-me-pending-booty */

import { tryber } from "@src/features/database";
import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import UserRoute from "@src/features/routes/UserRoute";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-users-me-pending-booty"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-users-me-pending-booty"]["parameters"]["query"];
}> {
  private start: number = 0;
  private limit: number = 25;
  private explicitLimitIsRequested: boolean = false;
  private order: "ASC" | "DESC" = "DESC";
  private _orderBy: ReturnType<RouteItem["getQuery"]>["orderBy"] =
    "attributionDate";

  constructor(configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "pending booty" });
    const query = this.getQuery();
    if (query.start) this.start = parseInt(query.start as unknown as string);
    if (query.limit) {
      this.limit = parseInt(query.limit as unknown as string);
      this.explicitLimitIsRequested = true;
    }
    if (query.order) this.order = query.order;
    if (query.orderBy) this._orderBy = query.orderBy;
  }

  get orderBy() {
    return this._orderBy ?? "id";
  }

  protected async prepare() {
    try {
      const { results, total } = await this.getPendingBooties();
      this.setSuccess(200, {
        results: results.map((row) => {
          return {
            id: row.id,
            name: row.activityName,
            amount: {
              value: row.amount,
              currency: "EUR",
            },
            attributionDate: row.attributionDate.substring(0, 10),
          };
        }),
        limit: this.limit,
        size: results.length,
        start: this.start,
        total,
      });
    } catch (err) {
      debugMessage(err);
      this.setError(
        (err as OpenapiError).status_code || 400,
        err as OpenapiError
      );
    }
  }

  private getPendingBootiesOrderBy() {
    if (this.orderBy === "activityName") return "wp_appq_evd_campaign.id";
    if (this.orderBy === "id") return "wp_appq_payment.id";
    return this.orderBy;
  }
  private async getPendingBooties() {
    const WHERE = `WHERE 
    p.tester_id = ? and p.is_paid=0 and p.is_requested=0`;
    const data = [this.getTesterId()];

    const query = tryber.tables.WpAppqPayment.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_payment"),
        tryber.fn.charDate("creation_date", "attributionDate"),
        tryber.ref("amount").withSchema("wp_appq_payment"),
        tryber.ref("title").withSchema("wp_appq_evd_campaign").as("cp_title"),
        tryber.ref("id").withSchema("wp_appq_evd_campaign").as("cp_id")
      )
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_payment.campaign_id",
        "wp_appq_evd_campaign.id"
      )
      .where("wp_appq_payment.tester_id", this.getTesterId())
      .where("wp_appq_payment.is_paid", 0)
      .where("wp_appq_payment.is_requested", 0)
      .limit(this.limit)
      .offset(this.start);

    if (this.orderBy === "activityName") {
      query
        .orderBy("wp_appq_evd_campaign.id", this.order)
        .orderBy("wp_appq_evd_campaign.title", this.order);
    } else if (this.orderBy === "id") {
      query.orderBy("wp_appq_payment.id", this.order);
    } else {
      query.orderBy(this.orderBy, this.order);
    }

    const results = (await query).map((row) => {
      return {
        id: row.id,
        attributionDate: row.attributionDate.substring(0, 10),
        amount: row.amount,
        activityName: `[CP-${row.cp_id}] ${row.cp_title}`,
      };
    });

    if (!results.length) {
      throw {
        status_code: 404,
        message: "No booty until now",
      };
    }
    let total: number | undefined = undefined;
    if (this.explicitLimitIsRequested) {
      const countSql = `SELECT COUNT(p.id) as total
    FROM wp_appq_payment p 
      ${WHERE}`;
      const countResults = await db.query(db.format(countSql, data));
      total = countResults[0].total;
    }
    return { results, total };
  }
}
