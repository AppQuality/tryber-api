/** OPENAPI-CLASS: get-campaigns-campaign-candidates */
import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";
import Campaigns from "@src/features/db/class/Campaigns";
import Selector from "./Selector";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns-campaign-candidates"]["responses"][200]["content"]["application/json"];
  query: StoplightOperations["get-campaigns-campaign-candidates"]["parameters"]["query"];
  parameters: StoplightOperations["get-campaigns-campaign-candidates"]["parameters"]["path"];
}> {
  private campaign_id: number;
  private db: {
    campaigns: Campaigns;
  };
  private start: number;
  private limit: number;
  private hasLimit: boolean = false;
  private selector: Selector;

  constructor(config: RouteClassConfiguration) {
    super(config);
    const parameters = this.getParameters();
    this.campaign_id = parseInt(parameters.campaign);
    this.db = {
      campaigns: new Campaigns(),
    };
    this.selector = new Selector(this.campaign_id);
    const query = this.getQuery();
    this.start = parseInt(query.start as unknown as string) || 0;
    this.limit = 10;
    if (query.limit) {
      this.limit = parseInt(query.limit as unknown as string);
      this.hasLimit = true;
    }
  }

  protected async init(): Promise<void> {
    await this.selector.init();
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
    const applications = await this.selector.getApplications();
    const sortedApplications = this.sortApplications(applications);
    const paginatedApplications = this.paginateApplications(sortedApplications);
    const formattedApplications = await this.formatApplications(
      paginatedApplications
    );

    this.setSuccess(200, {
      results: formattedApplications,
      size: paginatedApplications.length,
      start: this.start,
      limit: this.hasLimit ? this.limit : undefined,
      total: this.hasLimit ? applications.length : undefined,
    });
  }

  private async formatApplications(
    applications: Awaited<ReturnType<typeof this.selector.getApplications>>
  ) {
    let results = [];
    for (const application of applications) {
      results.push({
        id: application.id,
        name: application.name,
        surname: application.surname,
        experience: application.experience,
        level: this.getLevel(application.id),
        devices: application.devices,
      });
    }

    return results;
  }

  private paginateApplications(
    applications: Awaited<ReturnType<typeof this.selector.getApplications>>
  ) {
    return applications.slice(this.start, this.start + this.limit);
  }

  private sortApplications(
    applications: Awaited<ReturnType<typeof this.selector.getApplications>>
  ) {
    return applications.sort((a, b) => {
      const aId = a.id;
      const bId = b.id;
      const aLevelId = this.selector.getUserLevel(aId).id;
      const bLevelId = this.selector.getUserLevel(bId).id;
      return bLevelId - aLevelId;
    });
  }

  private getLevel(testerId: number) {
    const userLevel = this.selector.getUserLevel(testerId);
    return userLevel.name;
  }
}
