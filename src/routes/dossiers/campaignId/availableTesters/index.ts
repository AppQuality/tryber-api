/** OPENAPI-CLASS: get-dossiers-campaign-availableTesters */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";
import { UserTargetChecker } from "@src/features/target/UserTargetChecker";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-dossiers-campaign-availableTesters"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-dossiers-campaign-availableTesters"]["parameters"]["path"];
  query: StoplightOperations["get-dossiers-campaign-availableTesters"]["parameters"]["query"];
}> {
  private campaignId: number;
  private shouldRefreshCache = false;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaignId = Number(this.getParameters().campaign);
    if (this.getQuery().refresh) {
      this.shouldRefreshCache = true;
    }
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (await this.doesNotHaveAccessToCampaign()) {
      this.setError(403, new OpenapiError("No access to campaign"));
      return false;
    }

    if (!(await this.campaignExists())) {
      this.setError(403, new OpenapiError("Campaign does not exist"));
      return false;
    }

    return true;
  }

  private async doesNotHaveAccessToCampaign() {
    return !this.hasAccessToCampaign(this.campaignId);
  }

  private async campaignExists(): Promise<boolean> {
    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .where({
        id: this.campaignId,
      })
      .first();
    if (!campaign) return false;

    return true;
  }

  protected async prepare(): Promise<void> {
    if (!this.shouldRefreshCache) {
      const cachedValue = await this.getCachedValue();
      if (cachedValue) {
        this.setSuccess(200, {
          count: cachedValue.count,
          lastUpdate: cachedValue.lastUpdate,
        });
        return;
      }
    }

    const userTargetChecker = new UserTargetChecker();

    const count = await userTargetChecker.countAvailableTesters({
      campaignId: this.campaignId,
    });
    await this.cacheValue(count);

    this.setSuccess(200, {
      count,
      lastUpdate: new Date().toISOString(),
    });
  }

  private async getCachedValue() {
    const cachedValue = await tryber.tables.WpAppqCpMeta.do()
      .select("meta_value")
      .where("campaign_id", this.campaignId)
      .whereIn("meta_key", [
        "dossier_available_testers_count",
        "dossier_available_testers_last_update",
      ]);
    if (cachedValue.length !== 2) return false;
    const [count, lastUpdate] = cachedValue.map((item) => item.meta_value);
    return {
      count: Number(count),
      lastUpdate: new Date(lastUpdate).toISOString(),
    };
  }

  private async cacheValue(count: number) {
    await tryber.tables.WpAppqCpMeta.do()
      .delete()
      .where("campaign_id", this.campaignId)
      .whereIn("meta_key", [
        "dossier_available_testers_count",
        "dossier_available_testers_last_update",
      ]);
    await tryber.tables.WpAppqCpMeta.do().insert([
      {
        campaign_id: this.campaignId,
        meta_key: "dossier_available_testers_count",
        meta_value: count.toString(),
      },
      {
        campaign_id: this.campaignId,
        meta_key: "dossier_available_testers_last_update",
        meta_value: new Date().toISOString(),
      },
    ]);
  }
}
