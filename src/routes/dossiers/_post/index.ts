/** OPENAPI-CLASS: post-dossiers */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import AdminRoute from "@src/features/routes/AdminRoute";

export default class RouteItem extends AdminRoute<{
  response: StoplightOperations["post-dossiers"]["responses"]["201"]["content"]["application/json"];
  body: StoplightOperations["post-dossiers"]["requestBody"]["content"]["application/json"];
}> {
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
      this.setSuccess(201, {
        id: await this.createCampaign(),
      });
    } catch (e) {
      this.setError(500, e as OpenapiError);
    }
  }

  private async createCampaign() {
    const { os, form_factor } = await this.getDevices();

    const results = await tryber.tables.WpAppqEvdCampaign.do()
      .insert({
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
      .returning("id");

    return results[0].id ?? results[0];
  }

  private getEndDate() {
    if (this.getBody().endDate) return this.getBody().endDate;

    const startDate = new Date(this.getBody().startDate);
    startDate.setDate(startDate.getDate() + 7);
    return startDate.toISOString().replace(/\.\d+/, "");
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
