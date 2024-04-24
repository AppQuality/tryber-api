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
        tryber.fn.charDate("start_date"),
        tryber.fn.charDate("end_date"),
        tryber.fn.charDate("close_date"),
        tryber.ref("id").withSchema("wp_appq_evd_campaign"),
        "title",
        "customer_title",
        "project_id",
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

    const dossierData = await tryber.tables.CampaignDossierData.do()
      .select(
        tryber.ref("id").withSchema("campaign_dossier_data").as("dossier_id"),
        "description",
        "link",
        "goal",
        "out_of_scope",
        "target_audience",
        "target_size",
        "target_devices",
        "product_type_id",
        tryber.ref("name").withSchema("product_types").as("product_type_name")
      )
      .leftJoin(
        "product_types",
        "product_types.id",
        "campaign_dossier_data.product_type_id"
      )
      .where("campaign_id", this.campaignId)
      .first();

    const targetCountries = dossierData
      ? await tryber.tables.CampaignDossierDataCountries.do()
          .select("country_code")
          .where("campaign_dossier_data_id", dossierData.dossier_id)
      : [];

    const targetLanguages = dossierData
      ? await tryber.tables.CampaignDossierDataLanguages.do()
          .join(
            "wp_appq_lang",
            "wp_appq_lang.id",
            "campaign_dossier_data_languages.language_id"
          )
          .select("language_id")
          .select("display_name")
          .where("campaign_dossier_data_id", dossierData.dossier_id)
      : [];

    const targetBrowsers = dossierData
      ? await tryber.tables.CampaignDossierDataBrowsers.do()
          .join(
            "browsers",
            "browsers.id",
            "campaign_dossier_data_browsers.browser_id"
          )
          .select("browser_id")
          .select("name")
          .where("campaign_dossier_data_id", dossierData.dossier_id)
      : [];

    return {
      ...campaign,
      devices,
      roles,
      ...dossierData,
      countries: targetCountries,
      languages: targetLanguages,
      browsers: targetBrowsers,
    };
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
        startDate: this.formatDate(this.campaign.start_date),
        endDate: this.formatDate(this.campaign.end_date),
        closeDate: this.formatDate(this.campaign.close_date),
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
        ...(this.campaign.description && {
          description: this.campaign.description,
        }),
        productLink: this.campaign.link,
        ...(this.campaign.goal && {
          goal: this.campaign.goal,
        }),
        ...(this.campaign.out_of_scope && {
          outOfScope: this.campaign.out_of_scope,
        }),
        ...((this.campaign.target_audience || this.campaign.target_size) && {
          target: {
            ...(this.campaign.target_audience && {
              notes: this.campaign.target_audience,
            }),
            ...(this.campaign.target_size && {
              size: this.campaign.target_size,
            }),
          },
        }),
        ...(this.campaign.target_devices && {
          deviceRequirements: this.campaign.target_devices,
        }),
        ...(this.campaign.countries.length > 0 && {
          countries: this.campaign.countries?.map((item) => item.country_code),
        }),
        ...(this.campaign.languages.length > 0 && {
          languages: this.campaign.languages?.map((item) => ({
            id: item.language_id,
            name: item.display_name,
          })),
        }),
        ...(this.campaign.browsers.length > 0 && {
          browsers: this.campaign.browsers?.map((item) => ({
            id: item.browser_id,
            name: item.name,
          })),
        }),

        ...(this.campaign.product_type_id &&
          this.campaign.product_type_name && {
            productType: {
              id: this.campaign.product_type_id,
              name: this.campaign.product_type_name,
            },
          }),
      });
    } catch (e) {
      this.setError(500, e as OpenapiError);
    }
  }

  private formatDate(dateTime: string) {
    const [date, time] = dateTime.split(" ");
    if (!date || !time) return dateTime;
    return `${date}T${time}Z`;
  }
}
