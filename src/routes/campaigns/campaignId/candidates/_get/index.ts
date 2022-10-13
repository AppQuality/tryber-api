/** OPENAPI-CLASS: get-campaigns-campaign-candidates */
import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns-campaign-candidates"]["responses"][200]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-candidates"]["parameters"]["path"];
}> {
  private campaign_id: number;

  constructor(config: RouteClassConfiguration) {
    super(config);
    const parameters = this.getParameters();
    this.campaign_id = parseInt(parameters.campaign);
  }

  protected async filter() {
    if (this.hasAccessTesterSelection(this.campaign_id) === false) {
      this.setError(403, new Error("You are not authorized.") as OpenapiError);
      return false;
    }
    return true;
  }
  protected async prepare() {
    this.setSuccess(200, {
      results: [
        {
          id: 123,
          name: "Pippo",
          surname: "Franco",
          experience: 200,
          level: "Bronze",
          devices: [
            {
              manufacturer: "Apple",
              model: "iPhone",
              os: "iOS",
              osVersion: "9",
            },
            {
              os: "Windows",
              osVersion: "Windows 10 May 2021 Update",
            },
          ],
        },
      ],
      start: 0,
      size: 1,
    });
  }
}
