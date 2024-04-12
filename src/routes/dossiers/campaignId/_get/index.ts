/** OPENAPI-CLASS: get-dossiers-campaign */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import AdminRoute from "@src/features/routes/AdminRoute";

export default class RouteItem extends AdminRoute<{
  response: StoplightOperations["get-dossiers-campaign"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-dossiers-campaign"]["parameters"]["path"];
}> {
  private campaignId: number;
  private _campaign: Awaited<ReturnType<typeof this.getCampaign>> | undefined;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaignId = Number(this.getParameters().campaign);
  }

  protected async init(): Promise<void> {
    await super.init();
    try {
      this._campaign = await this.getCampaign();
    } catch (e) {
      this.setError(500, e as OpenapiError);
      throw e;
    }
  }

  private async getCampaign() {
    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select(
        "end_date",
        tryber.ref("id").withSchema("wp_appq_evd_campaign"),
        "title",
        "customer_title",
        "project_id",
        "start_date",
        "campaign_type_id",
        "os",
        tryber
          .ref("display_name")
          .withSchema("wp_appq_project")
          .as("project_name"),
        tryber
          .ref("name")
          .withSchema("wp_appq_campaign_type")
          .as("campaign_type_name"),
        tryber.ref("pm_id").withSchema("wp_appq_evd_campaign"),
        tryber.ref("name").withSchema("wp_appq_evd_profile").as("pm_name"),
        tryber
          .ref("surname")
          .withSchema("wp_appq_evd_profile")
          .as("pm_surname"),
        tryber
          .ref("company")
          .withSchema("wp_appq_customer")
          .as("customer_name"),
        tryber
          .ref("customer_id")
          .withSchema("wp_appq_project")
          .as("customer_id")
      )
      .join(
        "wp_appq_project",
        "wp_appq_project.id",
        "wp_appq_evd_campaign.project_id"
      )
      .join(
        "wp_appq_customer",
        "wp_appq_customer.id",
        "wp_appq_project.customer_id"
      )
      .join(
        "wp_appq_campaign_type",
        "wp_appq_campaign_type.id",
        "wp_appq_evd_campaign.campaign_type_id"
      )
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_evd_campaign.pm_id"
      )
      .where("wp_appq_evd_campaign.id", this.campaignId)
      .first();

    if (!campaign) return undefined;

    const devices = await tryber.tables.WpAppqEvdPlatform.do()
      .select("id", "name")
      .whereIn("id", campaign.os.split(","));

    const roles = await tryber.tables.CustomRoles.do()
      .join(
        "campaign_custom_roles",
        "campaign_custom_roles.custom_role_id",
        "custom_roles.id"
      )
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "campaign_custom_roles.tester_id"
      )
      .select(
        tryber.ref("id").withSchema("wp_appq_evd_profile").as("tester_id"),
        tryber.ref("name").withSchema("wp_appq_evd_profile").as("tester_name"),
        tryber
          .ref("surname")
          .withSchema("wp_appq_evd_profile")
          .as("tester_surname"),
        tryber.ref("id").withSchema("custom_roles").as("role_id"),
        tryber.ref("name").withSchema("custom_roles").as("role_name")
      )
      .where("campaign_custom_roles.campaign_id", this.campaignId);

    return { ...campaign, devices, roles };
  }

  get campaign() {
    if (!this._campaign) throw new Error("Campaign not found");
    return this._campaign;
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (!(await this.campaignExists())) {
      this.setError(403, new OpenapiError("Campaign does not exist"));
      return false;
    }

    return true;
  }

  private async campaignExists(): Promise<boolean> {
    try {
      this.campaign;
      return true;
    } catch (e) {
      return false;
    }
  }

  protected async prepare(): Promise<void> {
    try {
      this.setSuccess(200, {
        id: this.campaign.id,
        title: {
          customer: this.campaign.customer_title,
          tester: this.campaign.title,
        },
        customer: {
          id: this.campaign.customer_id,
          name: this.campaign.customer_name,
        },
        project: {
          id: this.campaign.project_id,
          name: this.campaign.project_name,
        },
        testType: {
          id: this.campaign.campaign_type_id,
          name: this.campaign.campaign_type_name,
        },
        startDate: this.campaign.start_date,
        endDate: this.campaign.end_date,
        deviceList: this.campaign.devices,
        csm: {
          id: this.campaign.pm_id,
          name: `${this.campaign.pm_name} ${this.campaign.pm_surname}`,
        },
        ...(this.campaign.roles.length
          ? {
              roles: this.campaign.roles.map((item) => {
                return {
                  role: {
                    id: item.role_id,
                    name: item.role_name,
                  },
                  user: {
                    id: item.tester_id,
                    name: item.tester_name,
                    surname: item.tester_surname,
                  },
                };
              }),
            }
          : {}),
      });
    } catch (e) {
      this.setError(500, e as OpenapiError);
    }
  }
}
