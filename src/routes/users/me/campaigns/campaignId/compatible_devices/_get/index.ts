/** OPENAPI-CLASS: get-users-me-campaigns-campaignId-compatible-devices */

import UserRoute from "@src/features/routes/UserRoute";
import { tryber } from "@src/features/database";
import { UserTargetChecker } from "@src/routes/users/me/campaigns/_get/UserTargetChecker";

class RouteItem extends UserRoute<{
  parameters: StoplightOperations["get-users-me-campaigns-campaignId-compatible-devices"]["parameters"]["path"];
  response: StoplightOperations["get-users-me-campaigns-campaignId-compatible-devices"]["responses"]["200"]["content"]["application/json"];
}> {
  private campaign_id: number;
  private campaign:
    | {
        id: number;
        page_preview_id: number;
        is_public: number;
        start_date: string;
        os: string | null;
      }
    | undefined;
  private devices:
    | {
        id: number;
        form_factor: string;
        manufacturer: string | null;
        model: string | null;
        pc_type: string | null;
        source_id: number | null;
        os_version_id: number;
        os: string;
        display_name: string;
        version_number: string;
      }[]
    | undefined;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaign_id = parseInt(this.getParameters().campaign);
  }

  protected async filter() {
    try {
      await this.getCampaign();
    } catch {
      return this.setUnauthorized();
    }
    if ((await this.candidatureIsAvailable()) === false) {
      return this.setUnauthorized();
    }
    if ((await this.userCanAccessToForm()) === false) {
      return this.setUnauthorized();
    }
    if ((await this.getCompatibleDevices()).length === 0) {
      this.setError(
        404,
        new Error("There are no compatible devices") as OpenapiError
      );
      return false;
    }

    return true;
  }

  private setUnauthorized() {
    this.setError(
      403,
      new Error("You cannot access to this campaign") as OpenapiError
    );
    return false;
  }

  protected async prepare() {
    try {
      this.setSuccess(200, await this.getEnhancedDevices());
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      this.setError(500, e as OpenapiError);
    }
  }

  private async candidatureIsAvailable(): Promise<boolean> {
    const campaign = await this.getCampaign();
    const today = new Date().toISOString().split(".")[0].replace("T", " ");
    return new Date(campaign.start_date) >= new Date(today);
  }

  private async userCanAccessToForm() {
    const campaign = await this.getCampaign();
    if (campaign.is_public === 1) return true;
    if (campaign.is_public === 3) {
      const access = await tryber.tables.WpAppqLcAccess.do()
        .select("id")
        .where("tester_id", this.getTesterId())
        .where("view_id", campaign.page_preview_id)
        .first();
      return !!access;
    }
    if (campaign.is_public === 4) {
      const checker = new UserTargetChecker({ testerId: this.getTesterId() });
      await checker.init();
      return checker.inTarget(await this.getTargetRules());
    }
    return false;
  }

  private async getCampaign() {
    if (!this.campaign) {
      const campaign = await tryber.tables.WpAppqEvdCampaign.do()
        .select("id", "page_preview_id", "is_public", "start_date", "os")
        .where("id", this.campaign_id)
        .first();
      if (!campaign) throw new Error("Campaign not found");
      this.campaign = campaign;
    }
    return this.campaign;
  }

  private async getCompatibleDevices() {
    if (!this.devices) {
      const campaign = await this.getCampaign();
      const acceptedOs = campaign.os
        ? campaign.os.split(",").map((o) => parseInt(o))
        : [];

      const query = tryber.tables.WpCrowdAppqDevice.do()
        .select(
          tryber.ref("id").withSchema("wp_crowd_appq_device"),
          tryber.ref("form_factor").withSchema("wp_crowd_appq_device"),
          "manufacturer",
          "model",
          "pc_type",
          "source_id",
          "os_version_id",
          tryber.ref("wp_appq_evd_platform.name").as("os"),
          tryber.ref("display_name").withSchema("wp_appq_os"),
          tryber.ref("version_number").withSchema("wp_appq_os")
        )
        .join(
          "wp_appq_evd_platform",
          "wp_crowd_appq_device.platform_id",
          "wp_appq_evd_platform.id"
        )
        .join(
          "wp_appq_os",
          "wp_crowd_appq_device.os_version_id",
          "wp_appq_os.id"
        )
        .where("id_profile", this.getTesterId())
        .where("enabled", 1);

      if (acceptedOs.length > 0) {
        query.whereIn("wp_crowd_appq_device.platform_id", acceptedOs);
      }

      this.devices = await query;
    }
    return this.devices;
  }

  private async getEnhancedDevices() {
    const devices = await this.getCompatibleDevices();
    return devices.map((device) => ({
      id: device.id,
      type: device.form_factor,
      device:
        device.form_factor === "PC" && device.pc_type
          ? { pc_type: device.pc_type }
          : {
              id: device.source_id || 0,
              manufacturer: device.manufacturer || "",
              model: device.model || "",
            },
      operating_system: {
        id: device.os_version_id,
        platform: device.os,
        version: `${device.display_name} (${device.version_number})`,
      },
    }));
  }

  private async getTargetRules() {
    const allowedLanguages =
      await tryber.tables.CampaignDossierDataLanguages.do()
        .select("language_name")
        .join(
          "campaign_dossier_data",
          "campaign_dossier_data.id",
          "campaign_dossier_data_languages.campaign_dossier_data_id"
        )
        .where("campaign_dossier_data.campaign_id", this.campaign_id);

    const allowedCountries =
      await tryber.tables.CampaignDossierDataCountries.do()
        .select("country_code")
        .join(
          "campaign_dossier_data",
          "campaign_dossier_data.id",
          "campaign_dossier_data_countries.campaign_dossier_data_id"
        )
        .where("campaign_dossier_data.campaign_id", this.campaign_id);

    return {
      languages: allowedLanguages.map((l) => l.language_name),
      countries: allowedCountries.map((c) => c.country_code),
    };
  }
}

export default RouteItem;
