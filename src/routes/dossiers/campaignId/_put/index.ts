/** OPENAPI-CLASS: put-dossiers-campaign */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["put-dossiers-campaign"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["put-dossiers-campaign"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["put-dossiers-campaign"]["parameters"]["path"];
}> {
  private campaignId: number;
  private _campaign: { end_date: string; close_date: string } | undefined;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaignId = Number(this.getParameters().campaign);
  }

  protected async init(): Promise<void> {
    await super.init();
    this._campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("end_date", "close_date")
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

    if (await this.doesNotHaveAccessToCampaign()) {
      this.setError(403, new OpenapiError("No access to campaign"));
      return false;
    }

    if (!(await this.campaignExists())) {
      this.setError(403, new OpenapiError("Campaign does not exist"));
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

  private async doesNotHaveAccessToCampaign() {
    return !this.hasAccessToCampaign(this.campaignId);
  }

  private async campaignExists(): Promise<boolean> {
    try {
      this.campaign;
      return true;
    } catch (e) {
      return false;
    }
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
        start_date: this.getBody().startDate,
        end_date: this.getEndDate(),
        close_date: this.getCloseDate(),
        pm_id: this.getBody().csm ?? this.getTesterId(),
        project_id: this.getBody().project,
        campaign_type_id: this.getBody().testType,
        customer_title: this.getBody().title.customer,
        os: os.join(","),
        form_factor: form_factor.join(","),
      })
      .where({
        id: this.campaignId,
      });

    await this.linkRolesToCampaign();

    await this.updateCampaignDossierData();

    await this.updateCampaignDossierDataCountries();
    await this.updateCampaignDossierDataLanguages();
    await this.updateCampaignDossierDataBrowsers();
  }

  private async updateCampaignDossierData() {
    const dossierExists = await tryber.tables.CampaignDossierData.do()
      .select("id")
      .where({
        campaign_id: this.campaignId,
      })
      .first();
    if (!dossierExists) {
      await tryber.tables.CampaignDossierData.do().insert({
        campaign_id: this.campaignId,
        created_by: this.getTesterId(),
        updated_by: this.getTesterId(),
      });
    }

    await tryber.tables.CampaignDossierData.do()
      .update({
        description: this.getBody().description,
        ...(this.getBody().productLink && {
          link: this.getBody().productLink,
        }),
        goal: this.getBody().goal,
        out_of_scope: this.getBody().outOfScope,
        target_audience: this.getBody().target?.notes,
        ...(this.getBody().target?.size && {
          target_size: this.getBody().target?.size,
        }),
        ...(this.getBody().target?.cap && {
          cap: this.getBody().target?.cap,
        }),
        product_type_id: this.getBody().productType,
        target_devices: this.getBody().deviceRequirements,
        notes: this.getBody().notes,
        updated_by: this.getTesterId(),
      })
      .where({
        campaign_id: this.campaignId,
      });
  }

  private async updateCampaignDossierDataCountries() {
    const dossier = await tryber.tables.CampaignDossierData.do()
      .select("id")
      .where({
        campaign_id: this.campaignId,
      })
      .first();
    if (!dossier) return;

    const dossierId = dossier.id;
    await tryber.tables.CampaignDossierDataCountries.do()
      .delete()
      .where("campaign_dossier_data_id", dossierId);

    const countries = this.getBody().countries;
    if (!countries || !countries.length) return;

    await tryber.tables.CampaignDossierDataCountries.do().insert(
      countries.map((country) => ({
        campaign_dossier_data_id: dossierId,
        country_code: country,
      }))
    );
  }

  private async updateCampaignDossierDataLanguages() {
    const dossier = await tryber.tables.CampaignDossierData.do()
      .select("id")
      .where({
        campaign_id: this.campaignId,
      })
      .first();
    if (!dossier) return;

    const dossierId = dossier.id;
    await tryber.tables.CampaignDossierDataLanguages.do()
      .delete()
      .where("campaign_dossier_data_id", dossierId);

    const languages = this.getBody().languages;
    if (!languages || !languages.length) return;

    await tryber.tables.CampaignDossierDataLanguages.do().insert(
      languages.map((lang) => ({
        campaign_dossier_data_id: dossierId,
        language_id: lang,
      }))
    );
  }

  private async updateCampaignDossierDataBrowsers() {
    const dossier = await tryber.tables.CampaignDossierData.do()
      .select("id")
      .where({
        campaign_id: this.campaignId,
      })
      .first();
    if (!dossier) return;

    const dossierId = dossier.id;
    await tryber.tables.CampaignDossierDataBrowsers.do()
      .delete()
      .where("campaign_dossier_data_id", dossierId);

    const browsers = this.getBody().browsers;
    if (!browsers || !browsers.length) return;

    await tryber.tables.CampaignDossierDataBrowsers.do().insert(
      browsers.map((browser) => ({
        campaign_dossier_data_id: dossierId,
        browser_id: browser,
      }))
    );
  }

  private async linkRolesToCampaign() {
    await this.cleanupCurrentRoles();
    const roles = this.getBody().roles;
    if (!roles || !roles.length) return;

    await tryber.tables.CampaignCustomRoles.do().insert(
      roles.map((role) => ({
        campaign_id: this.campaignId,
        custom_role_id: role.role,
        tester_id: role.user,
      }))
    );

    await this.assignOlps();
  }

  private async cleanupCurrentRoles() {
    const currentRoles = await tryber.tables.CampaignCustomRoles.do()
      .select(
        "tester_id",
        "custom_role_id",
        tryber.ref("olp").withSchema("custom_roles"),
        "wp_user_id"
      )
      .join(
        "custom_roles",
        "custom_roles.id",
        "campaign_custom_roles.custom_role_id"
      )
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "campaign_custom_roles.tester_id"
      )
      .where({
        campaign_id: this.campaignId,
      });
    if (!currentRoles.length) return;
    await tryber.tables.CampaignCustomRoles.do().delete().where({
      campaign_id: this.campaignId,
    });

    for (const role of currentRoles) {
      const olpObject = JSON.parse(role.olp);
      await tryber.tables.WpAppqOlpPermissions.do()
        .delete()
        .where({
          main_id: this.campaignId,
          main_type: "campaign",
          wp_user_id: role.wp_user_id,
        })
        .whereIn("type", olpObject);
    }
  }

  private async assignOlps() {
    const roles = this.getBody().roles;
    if (!roles || !roles.length) return;

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
        if (!olpObject || !olpObject.length) continue;
        await tryber.tables.WpAppqOlpPermissions.do().insert(
          olpObject.map((olpType: string) => ({
            main_id: this.campaignId,
            main_type: "campaign",
            type: olpType,
            wp_user_id: wpUserId.wp_user_id,
          }))
        );
      }
    }
  }

  private getEndDate() {
    if (this.getBody().endDate) return this.getBody().endDate;

    return this.campaign.end_date;
  }

  private getCloseDate() {
    if (this.getBody().closeDate) return this.getBody().closeDate;

    return this.campaign.close_date;
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
