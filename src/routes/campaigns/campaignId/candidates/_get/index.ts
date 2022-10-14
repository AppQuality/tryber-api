/** OPENAPI-CLASS: get-campaigns-campaign-candidates */
import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";
import Campaigns from "@src/features/db/class/Campaigns";
import Profile from "@src/features/db/class/Profile";
import CampaignApplications from "@src/features/db/class/CampaignApplications";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns-campaign-candidates"]["responses"][200]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-candidates"]["parameters"]["path"];
}> {
  private campaign_id: number;
  private db: {
    campaigns: Campaigns;
    applications: CampaignApplications;
    profile: Profile;
  };

  constructor(config: RouteClassConfiguration) {
    super(config);
    const parameters = this.getParameters();
    this.campaign_id = parseInt(parameters.campaign);
    this.db = {
      campaigns: new Campaigns(),
      applications: new CampaignApplications([
        "user_id",
        "selected_device",
        "devices",
      ]),
      profile: new Profile(["id", "name"]),
    };
  }

  protected async filter() {
    if (this.hasAccessTesterSelection(this.campaign_id) === false) {
      this.setError(403, new OpenapiError("You are not authorized."));
      return false;
    }
    if ((await this.campaignExists()) === false) {
      this.setError(404, new OpenapiError("Campaign does not exists."));
      return false;
    }
    return true;
  }

  private async campaignExists() {
    return await this.db.campaigns.exists(this.campaign_id);
  }

  protected async prepare() {
    let applications = await this.db.applications.query({
      where: [{ campaign_id: this.campaign_id }],
    });
    applications.map(async (application) => {
      const current = await this.db.profile.query({
        where: [{ wp_user_id: application.user_id }],
      });
      return {
        id: current[0].id,
        name: "Pippo",
        surname: "Franco",
        experience: 200,
        level: "Bronze",
        devices: [],
      };
    });
    let results: StoplightOperations["get-campaigns-campaign-candidates"]["responses"][200]["content"]["application/json"]["results"] =
      [];
    for (const application of applications) {
      const current = await this.db.profile.query({
        where: [{ wp_user_id: application.user_id }],
      });
      if (current.length) {
        if (current[0].id) {
          results.push({
            id: current[0].id,
            name: "Pippo",
            surname: "Franco",
            experience: 200,
            level: "Bronze",
            devices: [],
          });
        }
      }
    }
    this.setSuccess(200, { results, size: 0, start: 0 });
  }
}
