/** OPENAPI-CLASS: get-agreements */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";
export default class SingleCampaignRoute extends UserRoute<{
  response: StoplightOperations["get-agreements"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-agreements"]["parameters"]["query"];
}> {
  private limit: number | false = false;
  private start: number = 0;
  private order: "ASC" | "DESC" = "DESC";
  private orderBy: "id" = "id";

  private filterBy: {
    customer?: number[];
  } = {};

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);

    const query = this.getQuery();
    if (query.filterBy) {
      if (query.filterBy.customer) {
        this.filterBy.customer = (query.filterBy.customer as string)
          .split(",")
          .map((id: string) => parseInt(id));
      }
    }

    if (query.start) {
      this.start = parseInt(query.start as unknown as string);
      this.limit = 10;
    }
    if (query.limit) {
      this.limit = parseInt(query.limit as unknown as string);
    }
  }

  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    if (this.hasNotCampaignFullOlp()) {
      this.setError(403, new OpenapiError("Access denied"));
      return false;
    }
    return true;
  }

  protected async prepare(): Promise<void> {
    const { data: items, total } = await this.getAgreements();
    return this.setSuccess(200, {
      items: items,
      start: this.start ? this.start : 0,
      total: total,
      limit: this.limit ? this.limit : undefined,
      size: items.length,
    });
  }

  private hasNotCampaignFullOlp() {
    return !this.campaignOlps === true;
  }

  private async getAgreements() {
    const agreementsQuery = tryber.tables.FinanceAgreements.do()
      .select(
        tryber.ref("id").withSchema("finance_agreements"),
        "title",
        tryber.ref("tokens").withSchema("finance_agreements"),
        tryber
          .ref("token_unit_price")
          .withSchema("finance_agreements")
          .as("unitPrice"),
        tryber.raw("CAST(agreement_date AS CHAR) as startDate"),
        tryber.raw("CAST(agreement_close_date AS CHAR) as expirationDate"),
        "customer_id",
        tryber.ref("company").withSchema("wp_appq_customer"),
        tryber
          .ref("is_token_based")
          .withSchema("finance_agreements")
          .as("isTokenBased"),
        tryber
          .ref("additional_note")
          .withSchema("finance_agreements")
          .as("note")
      )
      .join(
        "wp_appq_customer",
        "wp_appq_customer.id",
        "=",
        "finance_agreements.customer_id"
      )
      .orderBy("finance_agreements." + this.orderBy, this.order);

    this.filterQuery(agreementsQuery);

    if (this.start) {
      agreementsQuery.offset(this.start);
    }

    if (this.limit) {
      agreementsQuery.limit(this.limit);
    }

    const total = await this.getTotal();

    const agreements = await agreementsQuery;

    if (agreements.length === 0) return { data: [], total };

    const data = (
      agreements as (typeof agreements[number] & {
        startDate: string;
        expirationDate: string;
      })[]
    ).map((agreement) => ({
      id: agreement.id,
      title: agreement.title,
      tokens: agreement.tokens,
      unitPrice: agreement.unitPrice,
      startDate: agreement.startDate.split(" ")[0],
      expirationDate: agreement.expirationDate.split(" ")[0],
      customer: {
        id: agreement.customer_id,
        company: agreement.company,
      },
      note: agreement.note.length > 0 ? agreement.note : undefined,
      isTokenBased: agreement.isTokenBased > 0 ? true : false,
    }));

    return { data, total };
  }

  private async getTotal() {
    if (!this.limit) return undefined;
    const agreementsCounterQuery = tryber.tables.FinanceAgreements.do()
      .join(
        "wp_appq_customer",
        "wp_appq_customer.id",
        "=",
        "finance_agreements.customer_id"
      )
      .count({
        count: tryber.ref("id").withSchema("finance_agreements"),
      });

    this.filterQuery(agreementsCounterQuery);

    const agreementsCounter = await agreementsCounterQuery;

    const totalCount = agreementsCounter[0].count;
    return typeof totalCount === "number" ? totalCount : 0;
  }

  private filterQuery<T>(
    query: T & { whereIn: (column: string, value: number[]) => T }
  ) {
    if (this.filterBy.customer) {
      query.whereIn("customer_id", this.filterBy.customer);
    }
  }
}
