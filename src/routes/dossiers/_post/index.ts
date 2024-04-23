/** OPENAPI-CLASS: post-dossiers */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import AdminRoute from "@src/features/routes/AdminRoute";
import WordpressJsonApiTrigger from "@src/features/wp/WordpressJsonApiTrigger";
import { unserialize } from "php-unserialize";

export default class RouteItem extends AdminRoute<{
  response: StoplightOperations["post-dossiers"]["responses"]["201"]["content"]["application/json"];
  body: StoplightOperations["post-dossiers"]["requestBody"]["content"]["application/json"];
}> {
  private duplicate: {
    fieldsFrom?: number;
    useCasesFrom?: number;
    mailMergesFrom?: number;
    pagesFrom?: number;
    testersFrom?: number;
  } = {};

  constructor(config: RouteClassConfiguration) {
    super(config);

    const { duplicate } = this.getBody();

    if (duplicate) {
      if (duplicate.fields) this.duplicate.fieldsFrom = duplicate.fields;
      if (duplicate.useCases) this.duplicate.useCasesFrom = duplicate.useCases;
      if (duplicate.mailMerges)
        this.duplicate.mailMergesFrom = duplicate.mailMerges;
      if (duplicate.pages) this.duplicate.pagesFrom = duplicate.pages;
      if (duplicate.testers) this.duplicate.testersFrom = duplicate.testers;
    }
  }

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
    if (await this.campaignToDuplicateDoesNotExist()) {
      this.setError(400, new OpenapiError("Invalid campaign to duplicate"));
      return false;
    }

    return true;
  }

  private async campaignToDuplicateDoesNotExist() {
    const ids = [
      ...new Set([
        ...(this.duplicate.fieldsFrom ? [this.duplicate.fieldsFrom] : []),
        ...(this.duplicate.useCasesFrom ? [this.duplicate.useCasesFrom] : []),
        ...(this.duplicate.mailMergesFrom
          ? [this.duplicate.mailMergesFrom]
          : []),
        ...(this.duplicate.pagesFrom ? [this.duplicate.pagesFrom] : []),
        ...(this.duplicate.testersFrom ? [this.duplicate.testersFrom] : []),
      ]),
    ];
    const campaigns = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .whereIn("id", ids);

    return campaigns.length !== ids.length;
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

      await this.generateLinkedData(campaignId);

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

    const campaignId = results[0].id ?? results[0];

    const dossier = await tryber.tables.CampaignDossierData.do()
      .insert({
        campaign_id: campaignId,
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
        product_type_id: this.getBody().productType,
        target_devices: this.getBody().deviceRequirements,
        created_by: this.getTesterId(),
        updated_by: this.getTesterId(),
      })
      .returning("id");

    const dossierId = dossier[0].id ?? dossier[0];

    const countries = this.getBody().countries;
    if (countries) {
      await tryber.tables.CampaignDossierDataCountries.do().insert(
        countries.map((country) => ({
          campaign_dossier_data_id: dossierId,
          country_code: country,
        }))
      );
    }

    const languages = this.getBody().languages;
    if (languages) {
      await tryber.tables.CampaignDossierDataLanguages.do().insert(
        languages.map((language) => ({
          campaign_dossier_data_id: dossierId,
          language_id: language,
        }))
      );
    }

    const browsers = this.getBody().browsers;
    if (browsers) {
      await tryber.tables.CampaignDossierDataBrowsers.do().insert(
        browsers.map((browser) => ({
          campaign_dossier_data_id: dossierId,
          browser_id: browser,
        }))
      );
    }

    return campaignId;
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

  private async generateLinkedData(campaignId: number) {
    const apiTrigger = new WordpressJsonApiTrigger(campaignId);

    await apiTrigger.generateTasks();

    if (this.duplicate.fieldsFrom) await this.duplicateFields(campaignId);

    if (this.duplicate.useCasesFrom) await this.duplicateUsecases(campaignId);
    else await apiTrigger.generateUseCase();

    if (this.duplicate.mailMergesFrom)
      await this.duplicateMailMerge(campaignId);
    else await apiTrigger.generateMailMerges();

    if (this.duplicate.pagesFrom) await this.duplicatePages(campaignId);
    else await apiTrigger.generatePages();

    if (this.duplicate.testersFrom) await this.duplicateTesters(campaignId);
  }

  private async duplicateFields(campaignId: number) {
    if (!this.duplicate.fieldsFrom) return;

    const fields = await tryber.tables.WpAppqCampaignAdditionalFields.do()
      .select()
      .where({
        cp_id: this.duplicate.fieldsFrom,
      });

    await tryber.tables.WpAppqCampaignAdditionalFields.do().insert(
      fields.map((field) => {
        const { id, ...rest } = field;
        return {
          ...rest,
          cp_id: campaignId,
        };
      })
    );
  }

  private async duplicateUsecases(campaignId: number) {
    if (!this.duplicate.useCasesFrom) return;

    const tasks = await tryber.tables.WpAppqCampaignTask.do().select().where({
      campaign_id: this.duplicate.useCasesFrom,
    });

    const taskMap = new Map<number, number>();

    for (const task of tasks) {
      const { id, ...rest } = task;
      const newItem = await tryber.tables.WpAppqCampaignTask.do()
        .insert({
          ...rest,
          campaign_id: campaignId,
        })
        .returning("id");
      taskMap.set(id, newItem[0].id ?? newItem[0]);
    }

    const groups = await tryber.tables.WpAppqCampaignTaskGroup.do()
      .select()
      .whereIn(
        "task_id",
        tasks.map((task) => task.id)
      );

    await tryber.tables.WpAppqCampaignTaskGroup.do().insert(
      groups.map((group) => ({
        ...group,
        task_id: taskMap.get(group.task_id),
      }))
    );
  }

  private async duplicateMailMerge(campaignId: number) {
    if (!this.duplicate.mailMergesFrom) return;

    const mailMerges = await tryber.tables.WpAppqCronJobs.do()
      .select(
        "display_name",
        "email_template_id",
        "template_text",
        "template_json",
        "last_editor_id",
        "template_id"
      )
      .where("campaign_id", this.duplicate.mailMergesFrom)
      .where("email_template_id", ">", 0);

    await tryber.tables.WpAppqCronJobs.do().insert(
      mailMerges.map((mailMerge) => ({
        ...mailMerge,
        campaign_id: campaignId,
        creation_date: tryber.fn.now(),
        update_date: tryber.fn.now(),
        executed_on: "",
      }))
    );
  }

  private async duplicatePages(campaignId: number) {
    if (!this.duplicate.pagesFrom) return;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("page_manual_id", "page_preview_id")
      .where("id", this.duplicate.pagesFrom);

    if (!campaign.length) return;

    const { page_manual_id, page_preview_id } = campaign[0];

    const manualId = await this.duplicatePage({
      pageId: page_manual_id,
      campaignId,
    });

    if (manualId) {
      await tryber.tables.WpAppqEvdCampaign.do().update({
        page_manual_id: manualId,
      });
    }

    const previewId = await this.duplicatePage({
      pageId: page_preview_id,
      campaignId,
    });

    if (previewId) {
      await tryber.tables.WpAppqEvdCampaign.do().update({
        page_preview_id: previewId,
      });
    }

    if (manualId || previewId) {
      const defaultLanguage = await this.getDefaultLanguage();
      if (!defaultLanguage) return;
      if (manualId) {
        const parsedTranslations = await this.getPageTranslationIds({
          pageId: page_manual_id,
          defaultLanguage,
        });
        for (const t in parsedTranslations) {
          await this.duplicatePage({
            pageId: parsedTranslations[t],
            campaignId,
          });
        }
      }

      if (previewId) {
        const parsedTranslations = await this.getPageTranslationIds({
          pageId: page_preview_id,
          defaultLanguage,
        });
        for (const t in parsedTranslations) {
          await this.duplicatePage({
            pageId: parsedTranslations[t],
            campaignId,
          });
        }
      }
    }
  }

  private async duplicatePage({
    pageId,
    campaignId,
  }: {
    pageId: number;
    campaignId: number;
  }) {
    if (!this.duplicate.pagesFrom) return;

    const page = await tryber.tables.WpPosts.do()
      .select()
      .where("ID", pageId)
      .first();

    if (!page) return null;

    const { ID, ...rest } = page;
    const newPage = await tryber.tables.WpPosts.do()
      .insert({
        ...rest,
        post_title: rest.post_title.replace(
          this.duplicate.pagesFrom.toString(),
          campaignId.toString()
        ),
      })
      .returning("ID");

    const meta = await tryber.tables.WpPostmeta.do()
      .select()
      .where("post_id", ID);

    if (meta.length) {
      await tryber.tables.WpPostmeta.do().insert(
        meta.map((metaItem) => {
          const { meta_id, ...rest } = metaItem;
          return {
            ...rest,
            post_id: newPage[0].ID ?? newPage[0],
          };
        })
      );
    }

    const newId = newPage[0].ID ?? newPage[0];
    return newId;
  }

  private async duplicateTesters(campaignId: number) {
    if (!this.duplicate.testersFrom) return;

    const testers = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select(
        "user_id",
        "subscription_date",
        "accepted",
        "devices",
        "selected_device",
        "modified",
        "group_id"
      )
      .where("campaign_id", this.duplicate.testersFrom);

    if (!testers.length) return;

    await tryber.tables.WpCrowdAppqHasCandidate.do().insert(
      testers.map((tester) => ({
        ...tester,
        campaign_id: campaignId,
      }))
    );
  }

  private async getDefaultLanguage() {
    const polylangOptions = await tryber.tables.WpOptions.do()
      .select("option_value")
      .where("option_name", "polylang")
      .first();

    if (!polylangOptions) return false;
    let parsedOptions: { [key: string]: any } = {};
    try {
      parsedOptions = unserialize(polylangOptions.option_value);
    } catch (e) {
      return false;
    }
    if (!("default_lang" in parsedOptions)) return false;
    return parsedOptions.default_lang;
  }

  private async getPageTranslationIds({
    pageId,
    defaultLanguage,
  }: {
    pageId: number;
    defaultLanguage: string;
  }) {
    const translations = await tryber.tables.WpTermRelationships.do()
      .select("object_id", "description")
      .join(
        "wp_term_taxonomy",
        "wp_term_taxonomy.term_taxonomy_id",
        "wp_term_relationships.term_taxonomy_id"
      )
      .where("object_id", pageId)
      .where("taxonomy", "post_translations")
      .first();

    if (!translations) return {};

    let parsedTranslations: { [key: string]: any } = {};
    try {
      parsedTranslations = unserialize(translations.description);
    } catch (e) {
      return;
    }

    if (defaultLanguage in parsedTranslations)
      delete parsedTranslations[defaultLanguage];
    return parsedTranslations;
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
