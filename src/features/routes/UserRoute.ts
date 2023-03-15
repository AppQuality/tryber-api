import Route from "./Route";

export default class UserRoute<T extends RouteClassTypes> extends Route<T> {
  private testerId: number;
  private wordpressId: number;
  private capabilities: string[];

  constructor(
    configuration: RouteClassConfiguration & {
      element?: string;
      id?: number;
    }
  ) {
    super({
      ...configuration,
      id: configuration.request.user.testerId,
    });
    this.testerId = this.configuration.request.user.testerId;
    this.wordpressId = parseInt(this.configuration.request.user.ID);
    this.capabilities = this.configuration.request.user.capabilities;
  }

  protected getTesterId() {
    return this.testerId;
  }
  protected getWordpressId() {
    return this.wordpressId;
  }
  protected getCapabilities() {
    return this.capabilities;
  }

  protected hasCapability(capability: string) {
    return !!(this.capabilities && this.capabilities.includes(capability));
  }

  protected hasAccessToCampaign(campaignId: number) {
    const olp = this.configuration.request.user.permission.admin?.appq_campaign;
    if (!olp) return false;
    return olp === true || olp?.includes(campaignId);
  }

  protected hasAccessToBugs(campaignId: number) {
    const olp = this.configuration.request.user.permission.admin?.appq_bug;
    if (!olp) return false;
    return olp === true || olp?.includes(campaignId);
  }
  protected hasAccessToProspect(campaignId: number) {
    const olp = this.configuration.request.user.permission.admin?.appq_prospect;
    if (!olp) return false;
    return olp === true || olp?.includes(campaignId);
  }
  protected hasAccessToProspect(campaignId: number) {
    const olp = this.configuration.request.user.permission.admin?.appq_prospect;
    if (!olp) return false;
    return olp === true || olp?.includes(campaignId);
  }

  protected hasAccessTesterSelection(campaignId: number) {
    const olp =
      this.configuration.request.user.permission.admin?.appq_tester_selection;
    if (!olp) return false;
    return olp === true || olp?.includes(campaignId);
  }
}
