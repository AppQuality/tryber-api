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
  private order: "ASC" | "DESC" = "ASC";

  private filterBy: {
    customer?: number[];
  } = {};

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);

    const query = this.getQuery();
    if (query.filterBy) {
      if ((query.filterBy as any).customer) {
        this.filterBy.customer = (query.filterBy as any).customer
          .split(",")
          .map((id: string) => parseInt(id));
      }
    }

    if (query.start) this.start = parseInt(query.start as unknown as string);
    if (query.limit) {
      this.limit = parseInt(query.limit as unknown as string);
    } else if (query.start) {
      this.limit = 10;
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
    return this.setSuccess(200, {
      items: await this.getAgreements(),
      start: 0,
      total: 0,
      limit: 0,
      size: 0,
    });
  }

  private hasNotCampaignFullOlp() {
    return !this.campaignOlps === true;
  }

  private async getAgreements() {
    const agreements = tryber.tables.FinanceAgreements.do()
      .select(
        tryber.ref("id").withSchema("finance_agreements"),
        "title",
        tryber.ref("tokens").withSchema("finance_agreements"),
        tryber
          .ref("token_unit_price")
          .withSchema("finance_agreements")
          .as("unitPrice"),
        tryber
          .ref("agreement_date")
          .withSchema("finance_agreements")
          .as("startDate"),
        tryber
          .ref("agreement_close_date")
          .withSchema("finance_agreements")
          .as("expirationDate"),
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
      );

    if (this.filterBy.customer) {
      agreements.whereIn("customer_id", this.filterBy.customer);
    }

    const filteredAgreements = await agreements;

    if (filteredAgreements.length === 0) return [];

    return filteredAgreements.map((agreement) => ({
      id: agreement.id,
      title: agreement.title,
      tokens: agreement.tokens,
      unitPrice: agreement.unitPrice,
      startDate: agreement.startDate,
      expirationDate: agreement.expirationDate,
      customer: {
        id: agreement.customer_id,
        company: agreement.company,
      },
      note: agreement.note.length > 0 ? agreement.note : undefined,
      isTokenBased: agreement.isTokenBased > 0 ? true : false,
    }));
  }
}
