import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

/** OPENAPI-CLASS: get-devices-operating-systems */

export default class Route extends UserRoute<{
  response: StoplightOperations["get-devices-operating-systems"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-devices-operating-systems"]["parameters"]["path"];
  query: StoplightOperations["get-devices-operating-systems"]["parameters"]["query"];
}> {
  private deviceType: number;
  private filterBy:
    | {
        manufacturer?: string | string[];
        model?: string | string[];
      }
    | false = false;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const { device_type } = this.getParameters();
    this.deviceType = Number(device_type);
    const { filterBy } = this.getQuery();
    if (filterBy) {
      this.filterBy = {
        ...("manufacturer" in filterBy
          ? { manufacturer: filterBy.manufacturer as string | string[] }
          : {}),
        ...("model" in filterBy
          ? { model: filterBy.model as string | string[] }
          : {}),
      };
    }
  }

  protected async prepare(): Promise<void> {
    try {
      const results = await this.getData();

      if (!results.length) {
        const fallbackResults = await this.getFallback();
        if (!fallbackResults.length) throw Error("Error on finding devices");
        this.setSuccess(200, fallbackResults);
        return;
      }

      return this.setSuccess(200, results);
    } catch (error) {
      this.setError(404, error as OpenapiError);
    }
  }

  private async getData() {
    const subQueryIds = await this.getSubQuery();
    if (!subQueryIds.length) return [];

    const results = tryber.tables.WpAppqEvdPlatform.do()
      .distinct("id")
      .select("name")
      .whereIn("id", subQueryIds);

    return results;
  }

  private async getSubQuery() {
    const query = tryber.tables.WpDcAppqDevices.do()
      .distinct("platform_id")
      .where("device_type", this.deviceType);

    if (this.filterBy) {
      if (this.filterBy.manufacturer) {
        if (typeof this.filterBy.manufacturer === "string") {
          query.where("manufacturer", this.filterBy.manufacturer);
        } else {
          query.whereIn("manufacturer", this.filterBy.manufacturer);
        }
      }
      if (this.filterBy.model) {
        if (typeof this.filterBy.model === "string") {
          query.where("model", this.filterBy.model);
        } else {
          query.whereIn("model", this.filterBy.model);
        }
      }
    }

    return (await query).map((row: { platform_id: number }) => row.platform_id);
  }

  private async getFallback() {
    return await tryber.tables.WpAppqEvdPlatform.do()
      .distinct("id")
      .select("name")
      .where("form_factor", this.deviceType);
  }
}
