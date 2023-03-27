/** OPENAPI-CLASS: get-campaigns-campaign */
import CampaignRoute from "@src/features/routes/CampaignRoute";
export default class SingleCampaignRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign"]["parameters"]["path"];
}> {
  protected async prepare(): Promise<void> {
    return this.setSuccess(200, {});
  }
}
