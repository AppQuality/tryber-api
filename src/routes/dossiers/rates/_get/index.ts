/** OPENAPI-CLASS: get-dossiers-rates */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-dossiers-rates"]["responses"]["200"]["content"]["application/json"];
}> {
  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (!this.campaignOlps) {
      this.setError(401, new OpenapiError("No access to campaign"));
      return false;
    }

    return true;
  }

  private async getDossierRates() {
    const rates = await tryber.tables.WorkRates.do().select("*");

    return rates;
  }

  protected async prepare() {
    try {
      const rates = await this.getDossierRates();

      this.setSuccess(200, {
        items: rates.map((rate) => ({
          id: rate.id,
          name: rate.name,
          rate: rate.daily_rate,
        })),
      });
    } catch (e) {
      this.setError(500, e as OpenapiError);
    }
  }
}
