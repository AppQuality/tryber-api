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
    if (await this.invalidRolesSubmitted()) {
      this.setError(406, new OpenapiError("Invalid roles submitted"));
      return false;
    }
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

  private async invalidRolesSubmitted() {
    const { roles } = this.getBody();
    if (!roles) return false;
    const roleIds = [...new Set(roles.map((role) => role.role))];
    const rolesExist = await tryber.tables.CustomRoles.do()
      .select()
      .whereIn("id", roleIds);
    if (rolesExist.length !== roleIds.length) return true;

    const userIds = [...new Set(roles.map((role) => role.user))];
    const usersExist = await tryber.tables.WpAppqEvdProfile.do()
      .select()
      .whereIn("id", userIds);
    if (usersExist.length !== userIds.length) return true;
    return false;
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
      const campaignId = await this.createCampaign();
      await this.linkRolesToCampaign(campaignId);

      this.setSuccess(201, {
        id: campaignId,
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
        close_date: this.getCloseDate(),
        page_preview_id: 0,
        page_manual_id: 0,
        customer_id: 0,
        pm_id: this.getCsmId(),
        project_id: this.getBody().project,
        campaign_type_id: this.getBody().testType,
        customer_title: this.getBody().title.customer,
        os: os.join(","),
        form_factor: form_factor.join(","),
      })
      .returning("id");

    return results[0].id ?? results[0];
  }

  private async linkRolesToCampaign(campaignId: number) {
    const roles = this.getBody().roles;
    if (!roles) return;

    await tryber.tables.CampaignCustomRoles.do().insert(
      roles.map((role) => ({
        campaign_id: campaignId,
        custom_role_id: role.role,
        tester_id: role.user,
      }))
    );

    await this.assignOlps(campaignId);
  }

  private async assignOlps(campaignId: number) {
    const roles = this.getBody().roles;
    if (!roles) return;

    const roleOlps = await tryber.tables.CustomRoles.do()
      .select("id", "olp")
      .whereIn(
        "id",
        roles.map((role) => role.role)
      );
    const wpUserIds = await tryber.tables.WpAppqEvdProfile.do()
      .select("id", "wp_user_id")
      .whereIn(
        "id",
        roles.map((role) => role.user)
      );
    for (const role of roles) {
      const olp = roleOlps.find((r) => r.id === role.role)?.olp;
      const wpUserId = wpUserIds.find((r) => r.id === role.user);
      if (olp && wpUserId) {
        const olpObject = JSON.parse(olp);
        await tryber.tables.WpAppqOlpPermissions.do().insert(
          olpObject.map((olpType: string) => ({
            main_id: campaignId,
            main_type: "campaign",
            type: olpType,
            wp_user_id: wpUserId.wp_user_id,
          }))
        );
      }
    }
  }

  private getCsmId() {
    const { csm } = this.getBody();
    return csm ? csm : this.getTesterId();
  }

  private getEndDate() {
    if (this.getBody().endDate) return this.getBody().endDate;

    const startDate = new Date(this.getBody().startDate);
    startDate.setDate(startDate.getDate() + 7);
    return startDate.toISOString().replace(/\.\d+/, "");
  }

  private getCloseDate() {
    if (this.getBody().closeDate) return this.getBody().closeDate;

    const startDate = new Date(this.getBody().startDate);
    startDate.setDate(startDate.getDate() + 14);
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
