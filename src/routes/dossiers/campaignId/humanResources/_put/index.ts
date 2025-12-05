/** OPENAPI-CLASS: put-dossiers-campaign-humanResources */
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";

export default class RouteItem extends CampaignRoute<{
  response: StoplightOperations["put-dossiers-campaign-humanResources"]["responses"]["200"];
  parameters: StoplightOperations["put-dossiers-campaign-humanResources"]["parameters"]["path"];
  body: StoplightOperations["put-dossiers-campaign-humanResources"]["requestBody"]["content"]["application/json"];
}> {
  protected async filter() {
    if (!(await super.filter())) return false;

    if (!this.hasAccessToCampaign(this.cp_id)) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }
    if (this.isInvalidBody()) {
      this.setError(400, new OpenapiError("Invalid request body"));
      return false;
    }

    return true;
  }

  private isInvalidBody(): boolean {
    const body = this.getBody();

    for (const item of body) {
      if (typeof item !== "object" || item === null) return true;

      const { assignee, days, rate } = item;
      if (
        typeof assignee !== "number" ||
        !Number.isInteger(assignee) ||
        assignee <= 0
      ) {
        return true;
      }

      if (typeof days !== "number" || days < 0) {
        return true;
      }
      if (typeof rate !== "number" || !Number.isInteger(rate) || rate < 0) {
        return true;
      }
    }
    return false;
  }

  private async updateHumanResources() {
    const body = this.getBody();

    try {
      await tryber.tables.CampaignHumanResources.do()
        .delete()
        .where("campaign_id", this.cp_id);

      await tryber.tables.CampaignHumanResources.do().insert([
        ...body.map((item) => ({
          campaign_id: this.cp_id,
          profile_id: item.assignee,
          days: item.days,
          work_rate_id: item.rate,
        })),
      ]);
    } catch (error) {
      throw new OpenapiError("Failed to update human resources");
    }
  }

  protected async prepare() {
    try {
      await this.updateHumanResources();
    } catch (error: OpenapiError | any) {
      this.setError(500, {
        message: error.message,
      } as OpenapiError);
      return;
    }
    this.setSuccess(200, {});
  }
}
