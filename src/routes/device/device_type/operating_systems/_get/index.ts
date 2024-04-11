import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

/** OPENAPI-CLASS: get-devices-operating-systems */

export default class Route extends UserRoute<{
  response: StoplightOperations["get-devices-operating-systems"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-devices-operating-systems"]["parameters"]["path"];
  query: StoplightOperations["get-devices-operating-systems"]["parameters"]["query"];
}> {
  private deviceType: "all" | number;
  private filterBy:
    | {
        manufacturer?: string | string[];
        model?: string | string[];
      }
    | false = false;
  private readonly DEVICE_TYPES = {
    0: "Smartphone",
    1: "Tablet",
    2: "PC",
    3: "Smartwatch",
    4: "Console",
    5: "SmartTV",
  };

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const { device_type } = this.getParameters();
    this.deviceType = device_type === "all" ? device_type : Number(device_type);
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

      if (results.length)
        return this.setSuccess(
          200,
          results.map((row) => ({
            id: row.id,
            name: row.name,
            type: row.type,
          }))
        );

      const fallbackResults = await this.getFallback();
      if (!fallbackResults.length) throw Error("Error on finding devices");
      this.setSuccess(
        200,
        fallbackResults.map((row) => ({
          id: row.id,
          name: row.name,
          type: row.type,
        }))
      );
    } catch (error) {
      this.setError(404, error as OpenapiError);
    }
  }

  private async getData() {
    const osFromFilters = await this.getOsFromFilters();
    if (!osFromFilters.length) return [];

    const results = await tryber.tables.WpAppqEvdPlatform.do()
      .distinct("id")
      .select("name")
      .select("form_factor")
      .whereIn("id", osFromFilters);

    return results.map((row) => ({
      ...row,
      type: this.mapDeviceTypeToFormFactor(row.form_factor),
    }));
  }

  private async getOsFromFilters() {
    const query = tryber.tables.WpDcAppqDevices.do().distinct("platform_id");

    if (this.deviceType !== "all") query.where("device_type", this.deviceType);

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
    const query = tryber.tables.WpAppqEvdPlatform.do()
      .distinct("id")
      .select("name")
      .select("form_factor");

    if (this.deviceType !== "all") query.where("form_factor", this.deviceType);

    const results = await query;

    return results.map((row) => ({
      ...row,
      type: this.mapDeviceTypeToFormFactor(row.form_factor),
    }));
  }

  private mapDeviceTypeToFormFactor(deviceType: number) {
    if (deviceType in this.DEVICE_TYPES)
      return this.DEVICE_TYPES[deviceType as keyof typeof this.DEVICE_TYPES];
    return "Unknown";
  }
}
