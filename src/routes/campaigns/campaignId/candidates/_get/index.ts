/** OPENAPI-CLASS: get-campaigns-campaign-candidates */
import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";
import Campaigns from "@src/features/db/class/Campaigns";
import Profile, { ProfileObject } from "@src/features/db/class/Profile";
import CampaignApplications, {
  CampaignApplicationObject,
} from "@src/features/db/class/CampaignApplications";
import Level from "@src/features/db/class/Level";
import UserLevel from "@src/features/db/class/UserLevel";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns-campaign-candidates"]["responses"][200]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-candidates"]["parameters"]["path"];
}> {
  private campaign_id: number;
  private db: {
    campaigns: Campaigns;
    applications: CampaignApplications;
    profile: Profile;
    userLevel: UserLevel;
    level: Level;
  };
  private applicationUsers: { [key: number]: ProfileObject } = {};
  private applications: CampaignApplicationObject[] | false = false;

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
      profile: new Profile([
        "id",
        "name",
        "surname",
        "wp_user_id",
        "total_exp_pts",
      ]),
      userLevel: new UserLevel(),
      level: new Level(),
    };
  }

  protected async init(): Promise<void> {
    const applications = await this.getApplications();
    this.initApplicationUsers(applications);
  }

  private async initApplicationUsers(
    applications: CampaignApplicationObject[]
  ) {
    const applicationWpUserIds = applications.map(
      (application) => application.user_id
    );
    const profiles = await this.db.profile.query({
      where: [{ wp_user_id: applicationWpUserIds }],
    });
    for (const profile of profiles) {
      if (profile.wp_user_id && profile.id) {
        this.applicationUsers[profile.wp_user_id] = profile;
      }
    }
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
    const applications = await this.getApplications();

    this.setSuccess(200, {
      results: await this.enhanceApplications(applications),
      size: 0,
      start: 0,
    });
  }

  private async enhanceApplications(applications: CampaignApplicationObject[]) {
    let results = [];
    for (const application of applications) {
      const profile = this.getProfile(application.user_id);
      if (profile) {
        let level = "No Level";
        const userLevel = await this.db.userLevel.query({
          where: [{ tester_id: profile.id }],
        });
        if (userLevel.length > 0) {
          const levelData = await this.db.level.query({
            where: [{ id: userLevel[0].level_id }],
          });
          if (levelData.length && levelData[0].name) {
            level = levelData[0].name;
          }
        }

        results.push({
          id: profile.id,
          name: profile.name,
          surname: profile.surname,
          experience: profile.experience,
          level: level,
          devices: [],
        });
      }
    }
    return results;
  }

  private getProfile(wp_user_id: number) {
    const profile = this.applicationUsers[wp_user_id];
    if (
      !profile ||
      !profile.id ||
      !profile.name ||
      !profile.surname ||
      typeof profile.total_exp_pts === "undefined"
    ) {
      return false;
    }
    return {
      id: profile.id,
      name: profile.name,
      surname: profile.surname,
      experience: profile.total_exp_pts,
    };
  }

  private async getApplications() {
    if (!this.applications) {
      this.applications = await this.db.applications.query({
        where: [{ campaign_id: this.campaign_id }],
      });
    }
    return this.applications;
  }
}
