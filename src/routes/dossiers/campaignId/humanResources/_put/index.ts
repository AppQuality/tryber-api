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
    if (!(await this.validateHumanResources())) {
      return false;
    }
    return true;
  }

  private async isProfileValid(profileId: number) {
    const profile = await tryber.tables.WpAppqEvdProfile.do()
      .select("id")
      .where("id", profileId)
      .first();
    return !!profile;
  }

  private async isWorkRateValid(rateId: number) {
    const workRate = await tryber.tables.WorkRates.do()
      .select("id")
      .where("id", rateId)
      .first();
    return !!workRate;
  }

  private async validateHumanResources() {
    const body = this.getBody();
    for (const item of body) {
      if (!(await this.isProfileValid(item.assignee))) {
        this.setError(
          400,
          new OpenapiError(`Profile with id ${item.assignee} does not exist`)
        );
        return false;
      }
      if (!(await this.isWorkRateValid(item.rate))) {
        this.setError(
          400,
          new OpenapiError(`Work rate with id ${item.rate} does not exist`)
        );
        return false;
      }
    }
    return true;
  }

  private async updateHumanResources() {
    const body = this.getBody();

    try {
      await tryber.tables.CampaignHumanResources.do()
        .delete()
        .where("campaign_id", this.cp_id);

      if (body.length === 0) {
        return;
      }

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
