/** OPENAPI-CLASS: get-devices-devices-type-model */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class Route extends UserRoute<{
  response: StoplightOperations["get-devices-devices-type-model"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-devices-devices-type-model"]["parameters"]["path"];
  query: StoplightOperations["get-devices-devices-type-model"]["parameters"]["query"];
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
    const results = await this.getDevices();

    if (!results.length) {
      this.setError(404, new OpenapiError("Error on finding devices"));
      return;
    }

    const modelsByManufacturer = results.reduce((acc, cur) => {
      if (!(cur.manufacturer in acc)) {
        acc[cur.manufacturer] = [];
      }
      acc[cur.manufacturer].push({
        id: cur.id,
        name: cur.model,
      });
      return acc;
    }, {} as { [key: string]: { id: number; name: string }[] });

    const models = Object.entries(modelsByManufacturer).map(
      ([manufacturer, models]) => ({
        manufacturer,
        models,
      })
    );

    this.setSuccess(200, models);
  }

  private async getDevices() {
    const query = tryber.tables.WpDcAppqDevices.do()
      .select("id", "manufacturer", "model")
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
