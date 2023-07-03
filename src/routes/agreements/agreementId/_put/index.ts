/** OPENAPI-CLASS: put-agreements-agreement-id */
import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class Route extends UserRoute<{
  response: StoplightOperations["put-agreements-agreement-id"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["put-agreements-agreement-id"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["put-agreements-agreement-id"]["parameters"]["path"];
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

    if ((await this.customerExists()) === false) {
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

  private async customerExists() {
    const customer = await tryber.tables.WpAppqCustomer.do()
      .select("id")
      .where({
        id: this.getBody().customerId,
      });
    return customer.length !== 0;
  }

  private forbiddenResponse() {
    this.setError(403, new OpenapiError("Forbidden"));
    return false;
  }

  protected async prepare() {
    const agreement = await this.updateAgreement();
    this.setSuccess(200, {
      id: agreement.id,
      title: agreement.title,
      tokens: agreement.tokens,
      unitPrice: agreement.token_unit_price,
      startDate: agreement.agreement_date,
      expirationDate: agreement.agreement_close_date,
      note: agreement.additional_note,
      isTokenBased: agreement.is_token_based === 1,
      customer: {
        id: agreement.customer_id,
        company: agreement.customer_company,
      },
    });
  }

  private async updateAgreement() {
    await tryber.tables.FinanceAgreements.do()
      .update({
        title: this.getBody().title,
        tokens: this.getBody().tokens,
        token_unit_price: this.getBody().unitPrice,
        agreement_date: this.getBody().startDate,
        agreement_close_date: this.getBody().expirationDate,
        additional_note: this.getBody().note || "",
        is_token_based: this.getBody().isTokenBased ? 1 : 0,
        customer_id: this.getBody().customerId,
        last_editor_id: this.getTesterId(),
      })
      .where({
        id: this.agreementId,
      });

    const agreement = await tryber.tables.FinanceAgreements.do()
      .select(
        tryber.ref("id").withSchema("finance_agreements").as("id"),
        "title",
        tryber.ref("tokens").withSchema("finance_agreements").as("tokens"),
        "token_unit_price",

        tryber.raw("CAST(agreement_date AS CHAR) as agreement_date"),
        tryber.raw(
          "CAST(agreement_close_date AS CHAR) as agreement_close_date"
        ),
        "additional_note",
        "is_token_based",
        tryber.ref("id").withSchema("wp_appq_customer").as("customer_id"),
        tryber
          .ref("company")
          .withSchema("wp_appq_customer")
          .as("customer_company")
      )
      .join(
        "wp_appq_customer",
        "wp_appq_customer.id",
        "finance_agreements.customer_id"
      )
      .where("finance_agreements.id", this.agreementId)
      .first();
    if (!agreement) throw new Error("Error updating agreement");

    return agreement as typeof agreement & {
      agreement_date: string;
      agreement_close_date: string;
    };
  }
}
