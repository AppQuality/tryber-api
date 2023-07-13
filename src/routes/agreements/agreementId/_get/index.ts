/** OPENAPI-CLASS: get-agreements-agreement-id*/
import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class Route extends UserRoute<{
  response: StoplightOperations["get-agreements-agreement-id"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-agreements-agreement-id"]["parameters"]["path"];
}> {
  private agreementId: number;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.agreementId = Number(this.getParameters().agreementId);
  }

  protected async filter() {
    if ((await super.filter()) === false) return false;

    if (this.campaignOlps !== true) {
      return this.forbiddenResponse();
    }
    if ((await this.agreementExists()) === false) {
      return this.forbiddenResponse();
    }
    return true;
  }

  private async agreementExists() {
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("id")
      .where({
        id: this.agreementId,
      });
    return agreement.length !== 0;
  }

  private forbiddenResponse() {
    this.setError(403, new OpenapiError("Forbidden"));
    return false;
  }

  protected async prepare() {
    const agreement = await this.getAgreement();
    this.setSuccess(200, {
      id: agreement.id,
      customer: {
        id: agreement.customer_id,
        company: agreement.customer_name,
      },
      title: agreement.title,
      tokens: agreement.tokens,
      unitPrice: agreement.token_unit_price,
      startDate: agreement.agreement_date.split(" ")[0],
      expirationDate: agreement.agreement_close_date.split(" ")[0],
      note:
        agreement.additional_note !== ""
          ? agreement.additional_note
          : undefined,
      isTokenBased: agreement.is_token_based ? true : false,
    });
  }

  private async getAgreement() {
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select(
        tryber.ref("id").withSchema("finance_agreements"),
        "title",
        tryber.raw("CAST(agreement_date AS CHAR) as agreement_date"),
        tryber.raw(
          "CAST(agreement_close_date AS CHAR) as agreement_close_date"
        ),
        tryber.ref("tokens").withSchema("finance_agreements"),
        "token_unit_price",
        tryber.ref("id").withSchema("wp_appq_customer").as("customer_id"),
        tryber
          .ref("company")
          .withSchema("wp_appq_customer")
          .as("customer_name"),
        "additional_note",
        "is_token_based"
      )
      .join(
        "wp_appq_customer",
        "wp_appq_customer.id",
        "finance_agreements.customer_id"
      )
      .where("finance_agreements.id", this.agreementId)
      .first();
    if (!agreement) throw new Error("Agreement not found");
    return agreement as typeof agreement & {
      agreement_date: string;
      agreement_close_date: string;
    };
  }
}
