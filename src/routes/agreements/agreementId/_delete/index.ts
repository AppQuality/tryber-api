/** OPENAPI-CLASS: delete-agreements-agreement-id */
import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class Route extends UserRoute<{
  response: {};
  parameters: StoplightOperations["delete-agreements-agreement-id"]["parameters"]["path"];
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

  private forbiddenResponse() {
    this.setError(403, new OpenapiError("Forbidden"));
    return false;
  }

  private async agreementExists() {
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("id")
      .where({
        id: this.agreementId,
      });
    return agreement.length !== 0;
  }

  protected async prepare() {
    await tryber.tables.FinanceAgreements.do().delete().where({
      id: this.agreementId,
    });
    this.setSuccess(200, {});
  }
}
