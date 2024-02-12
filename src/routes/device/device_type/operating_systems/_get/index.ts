import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

/** OPENAPI-CLASS: get-devices-operating-systems */

export default class Route extends UserRoute<{
  response: StoplightOperations["get-devices-operating-systems"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-devices-operating-systems"]["parameters"]["path"];
  query: StoplightOperations["get-devices-operating-systems"]["parameters"]["query"];
}> {
  private device_type: number;
  private filterBy: { manufacturer?: string; model?: string } | false = false;

  constructor(config: RouteClassConfiguration) {
    super(config);
    const { device_type } = this.getParameters();
    this.device_type = Number(device_type);

    this.filterBy = this.getFilterBy();
  }
  private getFilterBy() {
    const query = this.getQuery();
    if (!query.filterBy) return false;

    return {
      ...(query.filterBy?.manufacturer
        ? { manufacturer: query.filterBy.manufacturer as string }
        : {}),
      ...(query.filterBy?.model
        ? { model: query.filterBy.model as string }
        : {}),
    };
  }

  protected async prepare() {
    const results = await this.getOperativeSystems();

    if (!results.length) {
      this.setError(404, Error("Error on finding devices") as OpenapiError);
      return;
    }

    this.setSuccess(200, results);
  }

  private async getOperativeSystems() {
    const platformIds = await this.getDevicesPlatformIds();
    const query = tryber.tables.WpAppqEvdPlatform.do().select("id", "name");

    if (platformIds.length) {
      query.whereIn(
        "id",
        platformIds.map((row) => row.platform_id)
      );
    }

    return await query;
  }

  private async getDevicesPlatformIds() {
    const query = tryber.tables.WpDcAppqDevices.do()
      .select("platform_id")
      .where("device_type", this.device_type)
      .orderBy("manufacturer", "asc")
      .orderBy("model", "asc");

    if (this.filterBy) {
      if (this.filterBy?.manufacturer) {
        query.where("manufacturer", this.filterBy.manufacturer);
      }
      if (this.filterBy.model) {
        query.where("model", this.filterBy.model);
      }
    }

    return await query;
  }
}
