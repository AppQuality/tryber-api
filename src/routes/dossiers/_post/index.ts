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

  protected async prepare(): Promise<void> {
    try {
      const endDate = new Date(this.getBody().startDate);
      endDate.setDate(endDate.getDate() + 7);

      const results = await tryber.tables.WpAppqEvdCampaign.do()
        .insert({
          title: this.getBody().title.tester,
          platform_id: 1,
          start_date: this.getBody().startDate,
          end_date: endDate.toISOString().replace(/\.\d+/, ""),
          page_preview_id: 0,
          page_manual_id: 0,
          customer_id: 0,
          pm_id: this.getTesterId(),
          project_id: this.getBody().project,
          campaign_type_id: this.getBody().testType,
          customer_title: this.getBody().title.customer,
        })
        .returning("id");

      this.setSuccess(201, {
        id: results[0].id ?? results[0],
      });
    } catch (e) {
      console.log(e);
      this.setError(500, new OpenapiError("PROBLEMI!"));
    }
  }
}
