/** OPENAPI-CLASS : get-campaigns-campaign-usecases */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";

class GetUsecasesRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-usecases"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-usecases"]["parameters"]["path"];
}> {
  protected async filter() {
    if ((await super.filter()) === false) return false;

    if (this.isNotAdmin()) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }

    return true;
  }

  protected async prepare(): Promise<void> {
    const tasks = await this.getUsecases();
    return this.setSuccess(200, tasks);
  }

  private isNotAdmin() {
    return this.configuration.request.user.role !== "administrator";
  }

  private async getUsecases() {
    return [];
  }
}

export default GetUsecasesRoute;
