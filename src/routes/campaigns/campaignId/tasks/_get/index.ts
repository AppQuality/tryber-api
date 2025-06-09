/** OPENAPI-CLASS : get-campaigns-campaign-tasks */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";

class GetUsecasesRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-tasks"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-tasks"]["parameters"]["path"];
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
    const { campaign } = this.getParameters();
    const usecases = await tryber.tables.WpAppqCampaignTask.do()
      .select("id", "title", "content", "campaign_id")
      .where("campaign_id", campaign);
    if (!usecases || usecases.length < 1) return [];

    return usecases.map((usecase) => ({
      id: usecase.id,
      name: usecase.title,
      content: usecase.content,
      campaign_id: usecase.campaign_id,
    }));
  }
}

export default GetUsecasesRoute;
