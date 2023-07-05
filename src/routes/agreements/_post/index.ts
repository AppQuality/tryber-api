/** OPENAPI-CLASS: post-agreements */
import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class Route extends UserRoute<{
  response: StoplightOperations["post-agreements"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["post-agreements"]["requestBody"]["content"]["application/json"];
}> {
  protected async filter() {
    if ((await super.filter()) === false) return false;

    if (this.campaignOlps !== true) {
      this.setError(403, new OpenapiError("Forbidden"));
      return false;
    }
    if ((await this.customerExists()) === false) {
      this.setError(403, new OpenapiError("Customer not found"));
      return false;
    }
    if ((await this.dateIsAcceptable(this.getBody().startDate)) === false) {
      return this.badRequestResponse();
    }

    if (
      (await this.dateIsAcceptable(this.getBody().expirationDate)) === false
    ) {
      return this.badRequestResponse();
    }
    return true;
  }

  private async dateIsAcceptable(date: string) {
    //startDate respect regular expression  "YYYY-mm-dd";
    const dateRegex = new RegExp(
      "^(19|20)\\d\\d[-](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])$"
    );
    //startDate respect datetime  regular expression  "YYYY-mm-dd hh:mm:ss";
    const dateTimeRegex = new RegExp(
      "^(19|20)\\d\\d[-](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])[ ]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$"
    );

    return dateRegex.test(date) || dateTimeRegex.test(date);
  }

  private async customerExists() {
    const customer = await tryber.tables.WpAppqCustomer.do()
      .select("id")
      .where({
        id: this.getBody().customerId,
      });
    return customer.length !== 0;
  }
  private badRequestResponse() {
    this.setError(400, new OpenapiError("Bad Request"));
    return false;
  }

  protected async prepare() {
    const agreementId = await this.createAgreement();
    this.setSuccess(200, {
      agreementId,
    });
  }

  private async createAgreement() {
    const agreement = await tryber.tables.FinanceAgreements.do()
      .insert({
        customer_id: this.getBody().customerId,
        title: this.getBody().title,
        tokens: this.getBody().tokens,
        token_unit_price: this.getBody().unitPrice,
        agreement_date: this.getBody().startDate,
        agreement_close_date: this.getBody().expirationDate,
        additional_note: this.getBody().note || "",
        is_token_based: this.getBody().isTokenBased ? 1 : 0,
        last_editor_id: this.getTesterId(),
      })
      .returning("id");
    return agreement[0].id ?? agreement[0];
  }
}
