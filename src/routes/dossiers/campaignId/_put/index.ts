/** OPENAPI-CLASS: put-dossiers-campaign */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import AdminRoute from "@src/features/routes/AdminRoute";

export default class RouteItem extends AdminRoute<{
  response: StoplightOperations["put-dossiers-campaign"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["put-dossiers-campaign"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["put-dossiers-campaign"]["parameters"]["path"];
}> {
  private campaignId: number;
  private _campaign: { end_date: string } | undefined;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaignId = Number(this.getParameters().campaign);
  }

  protected async init(): Promise<void> {
    await super.init();
    this._campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("end_date")
      .where({
        id: this.campaignId,
      })
      .first();
  }

  get campaign() {
    if (!this._campaign) throw new Error("Campaign not found");
    return this._campaign;
  }
  protected async filter() {
    if (!(await super.filter())) return false;
    if (!(await this.projectExists())) {
      this.setError(400, new OpenapiError("Project does not exist"));
      return false;
    }
    if (!(await this.testTypeExists())) {
      this.setError(400, new OpenapiError("Test type does not exist"));
      return false;
    }
    if (!(await this.deviceExists())) {
      this.setError(400, new OpenapiError("Invalid devices"));
      return false;
    }

    return true;
  }

  private async projectExists(): Promise<boolean> {
    const { project: projectId } = this.getBody();
    const project = await tryber.tables.WpAppqProject.do()
      .select()
      .where({
        id: projectId,
      })
      .first();
    return !!project;
  }

  private async testTypeExists(): Promise<boolean> {
    const { testType: testTypeId } = this.getBody();
    const testType = await tryber.tables.WpAppqCampaignType.do()
      .select()
      .where({
        id: testTypeId,
      })
      .first();
    return !!testType;
  }

  private async deviceExists(): Promise<boolean> {
    const { deviceList } = this.getBody();
    const devices = await tryber.tables.WpAppqEvdPlatform.do()
      .select()
      .whereIn("id", deviceList);
    return devices.length === deviceList.length;
  }

  protected async prepare(): Promise<void> {
    try {
      await this.updateCampaign();
      this.setSuccess(200, {
        id: this.campaignId,
      });
    } catch (e) {
      this.setError(500, e as OpenapiError);
    }
  }

  private async updateCampaign() {
    const { os, form_factor } = await this.getDevices();

    await tryber.tables.WpAppqEvdCampaign.do()
      .update({
        title: this.getBody().title.tester,
        platform_id: 0,
        start_date: this.getBody().startDate,
        end_date: this.getEndDate(),
        page_preview_id: 0,
        page_manual_id: 0,
        customer_id: 0,
        pm_id: this.getTesterId(),
        project_id: this.getBody().project,
        campaign_type_id: this.getBody().testType,
        customer_title: this.getBody().title.customer,
        os: os.join(","),
        form_factor: form_factor.join(","),
      })
      .where({
        id: this.campaignId,
      });
  }

  private getEndDate() {
    if (this.getBody().endDate) return this.getBody().endDate;

    return this.campaign.end_date;
  }

  private async getDevices() {
    const devices = await tryber.tables.WpAppqEvdPlatform.do()
      .select("id", "form_factor")
      .whereIn("id", this.getBody().deviceList);

    const os = devices.map((device) => device.id);
    const form_factor = devices.map((device) => device.form_factor);

    return { os, form_factor };
  }
}
