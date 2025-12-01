/** OPENAPI-CLASS: post-dossiers */

import Unguess from "@src/features/class/Unguess";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";
import { WebhookTrigger } from "@src/features/webhookTrigger";
import { importPages } from "@src/features/wp/Pages/importPages";
import WordpressJsonApiTrigger from "@src/features/wp/WordpressJsonApiTrigger";
import { components } from "@src/schema";
import { AxiosError } from "axios";
import Province from "comuni-province-regioni/lib/province";

const MIN_TESTER_AGE = 14;

const VALID_PROVINCE_CODES = Object.values(Province).map((p) => String(p));

const isValidProvinceCode = (code: string): boolean => {
  return VALID_PROVINCE_CODES.includes(code);
};
export default class PostDossiers extends UserRoute<{
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
    if (!(await this.hasFullAccess())) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }
    if (await this.invalidRolesSubmitted()) {
      this.setError(406, new OpenapiError("Invalid roles submitted"));
      return false;
    }
    if (await this.invalidBugTypesSubmitted()) {
      this.setError(406, new OpenapiError("Invalid bug types submitted"));
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
    if (await this.invalidCufSubmitted()) {
      this.setError(
        406,
        new OpenapiError("Invalid Custom User Field submitted")
      );
      return false;
    }
    if (this.invalidAgeRangeSubmitted()) {
      this.setError(406, new OpenapiError("Invalid age range submitted"));
      return false;
    }
    if (this.invalidProvincesSubmitted()) {
      this.setError(406, new OpenapiError("Invalid provinces submitted"));
      return false;
    }
    if (this.invalidBugParadeSubmitted()) {
      this.setError(406, new OpenapiError("Invalid bug parade submitted"));
      return false;
    }
    if (this.invalidBugFormSubmitted()) {
      this.setError(406, new OpenapiError("Invalid bug form submitted"));
      return false;
    }

    return true;
  }

  protected async prepare(): Promise<void> {
    const { skipPagesAndTasks, bugLanguage, notify_everyone } = this.getBody();

    try {
      const campaignId = await this.createCampaign();
      await this.linkRolesToCampaign(campaignId);

      if (!skipPagesAndTasks) {
        await this.generateLinkedData(campaignId);
      }

      if (bugLanguage) {
        await this.setBugLanguage(campaignId);
      }

      if (notify_everyone === 1) {
        await this.setupNotifications(campaignId);
      }

      const webhook = new WebhookTrigger({
        type: "campaign_created",
        data: {
          campaignId,
        },
      });

      try {
        await webhook.trigger();
        this.setSuccess(201, {
          id: campaignId,
        });
      } catch (e) {
        this.setSuccess(201, {
          id: campaignId,
          message: "HOOK_FAILED",
        });
      }
    } catch (e) {
      this.setError(500, e as OpenapiError);
    }
  }

  private async hasFullAccess() {
    return this.campaignOlps === true;
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

  private invalidBugParadeSubmitted() {
    const { hasBugParade } = this.getBody();
    if (hasBugParade === undefined) return false;
    if ([0, 1].includes(hasBugParade) === false) return true;
  }

  private invalidBugFormSubmitted() {
    const { hasBugParade, hasBugForm } = this.getBody();
    if (hasBugForm === undefined) return false;
    if (hasBugParade !== undefined && hasBugParade === 1 && hasBugForm === 0)
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

  private async invalidBugTypesSubmitted() {
    const { bugTypes } = this.getBody();
    if (!bugTypes || !bugTypes.length) return false;
    const bugTypeIds = [...new Set(bugTypes)];
    const bugTypesExist = await tryber.tables.WpAppqEvdBugType.do()
      .select()
      .whereIn("id", bugTypeIds);
    if (bugTypesExist.length !== bugTypeIds.length) return true;
    return false;
  }

  private async invalidCufSubmitted() {
    const { visibilityCriteria } = this.getBody();
    if (!visibilityCriteria?.cuf || !visibilityCriteria.cuf.length)
      return false;

    const cufs = visibilityCriteria.cuf;

    const cufIds = [...new Set(cufs.map((cuf) => cuf.cufId))];
    const cufValuesIds = cufs.map((cuf) => cuf.cufValueIds).flat();
    const cufExist = await tryber.tables.WpAppqCustomUserField.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_custom_user_field"),
        tryber.ref("name").withSchema("wp_appq_custom_user_field_extras")
      )
      .join(
        "wp_appq_custom_user_field_extras",
        "wp_appq_custom_user_field.id",
        "wp_appq_custom_user_field_extras.custom_user_field_id"
      )
      .whereIn("wp_appq_custom_user_field.id", cufIds)
      .whereIn("wp_appq_custom_user_field_extras.id", cufValuesIds)
      .whereIn("wp_appq_custom_user_field.type", ["select", "multiselect"]);

    if (cufValuesIds.length !== cufExist.length) return true;
    return false;
  }

  private invalidAgeRangeSubmitted() {
    const { visibilityCriteria } = this.getBody();
    const ageRanges = visibilityCriteria?.ageRanges || [];
    if (!ageRanges || !ageRanges.length) return false;

    for (const ageRange of ageRanges) {
      if (
        typeof ageRange.min !== "number" ||
        typeof ageRange.max !== "number" ||
        ageRange.min < MIN_TESTER_AGE ||
        ageRange.max < MIN_TESTER_AGE ||
        ageRange.min > ageRange.max
      ) {
        return true;
      }
    }
    return false;
  }

  private invalidProvincesSubmitted() {
    const { visibilityCriteria } = this.getBody();

    const provinces = visibilityCriteria?.provinces || [];
    if (!provinces || provinces.length === 0) return false;

    const upperProvince = provinces.map((p) => String(p).toUpperCase());
    if (new Set(upperProvince).size !== provinces.length) return true;
    return upperProvince.some((p) => p.length !== 2 || !isValidProvinceCode(p));
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

  private async setBugLanguage(campaignId: number) {
    const bugLanguage = this.getBody().bugLanguage;
    if (!bugLanguage) return;

    if (typeof bugLanguage === "string" && bugLanguage.length === 2) {
      await tryber.tables.WpAppqCpMeta.do().insert({
        campaign_id: campaignId,
        meta_key: "bug_lang_code",
        meta_value: bugLanguage,
      });

      await tryber.tables.WpAppqCpMeta.do().insert({
        campaign_id: campaignId,
        meta_key: "bug_lang_message",
        meta_value: this.getTranslatedBugMessage(bugLanguage),
      });
    }
  }
  private getTranslatedBugMessage(
    bugLanguage: components["schemas"]["BugLang"]
  ) {
    const messages: Record<components["schemas"]["BugLang"], string> = {
      ES: "Los bugs deben ser reportados en idioma español",
      FR: "Les bugs doivent être signalés en langue française",
      DE: "Die Bugs müssen in deutscher Sprache gemeldet werden",
      GB: "Bugs must be reported in English",
      IT: "I bug devono essere inseriti in lingua italiana",
    };

    return messages[bugLanguage] ?? messages.IT; // fallback on IT
  }

  private async getCampaignToDuplicate() {
    const { duplicate } = this.getBody();
    if (!duplicate || !duplicate.campaign) return;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select(
        "id",
        "min_allowed_media",
        "cust_bug_vis",
        "campaign_type",
        "campaign_pts"
      )
      .where("id", duplicate.campaign)
      .first();

    return campaign;
  }

  private async duplicateMeta({
    campaignId,
    campaignToDuplicate,
  }: {
    campaignId: number;
    campaignToDuplicate: number;
  }) {
    const meta = await tryber.tables.WpAppqCpMeta.do()
      .select()
      .where("campaign_id", campaignToDuplicate);

    if (meta.length) {
      await tryber.tables.WpAppqCpMeta.do().insert(
        meta.map((metaItem) => {
          const { meta_id, ...rest } = metaItem;
          return {
            ...rest,
            campaign_id: campaignId,
          };
        })
      );
    }
  }

  private async createCampaignMeta(campaignId: number) {
    const meta = [
      { meta_key: "campaign_complete_bonus_eur", meta_value: "10" },
      { meta_key: "payout_limit", meta_value: "35" },
      { meta_key: "low_bug_payout", meta_value: "0.5" },
      { meta_key: "medium_bug_payout", meta_value: "1" },
      { meta_key: "high_bug_payout", meta_value: "3" },
      { meta_key: "critical_bug_payout", meta_value: "8" },
      { meta_key: "point_multiplier_low", meta_value: "0.05" },
      { meta_key: "point_multiplier_medium", meta_value: "0.1" },
      { meta_key: "point_multiplier_high", meta_value: "0.3" },
      { meta_key: "point_multiplier_critical", meta_value: "0.8" },
      { meta_key: "point_multiplier_perfect", meta_value: "0.2" },
      { meta_key: "point_multiplier_refused", meta_value: "0.3" },
      { meta_key: "percent_usecases", meta_value: "0" },
      { meta_key: "minimum_bugs", meta_value: "0" },
      { meta_key: "top_tester_bonus", meta_value: "0" },
    ];

    await tryber.tables.WpAppqCpMeta.do().insert(
      meta.map((metaItem) => {
        return {
          ...metaItem,
          campaign_id: campaignId,
        };
      })
    );
  }

  private async createCampaign() {
    const { os, form_factor } = await this.getDevices();

    const campaignToDuplicate = await this.getCampaignToDuplicate();

    const autoApply = await this.evaluateAutoApply();

    const pageVersion = this.getBody().pageVersion
      ? this.getBody().pageVersion
      : "v1";

    const autoApprove = this.getBody().autoApprove;

    const results = await tryber.tables.WpAppqEvdCampaign.do()
      .insert({
        title: this.getBody().title.tester,
        platform_id: 0,
        start_date:
          this.getBody().startDate?.toString().slice(0, 19).replace("T", " ") ||
          "",
        end_date:
          this.getEndDate()?.toString().slice(0, 19).replace("T", " ") || "",
        close_date:
          this.getCloseDate()?.toString().slice(0, 19).replace("T", " ") || "",
        page_preview_id: 0,
        page_manual_id: 0,
        customer_id: 0,
        description: "",
        pm_id: this.getCsmId(),
        project_id: this.getBody().project,
        campaign_type_id: this.getBody().testType,
        customer_title: this.getBody().title.customer,
        os: os.join(","),
        form_factor: form_factor.join(","),
        base_bug_internal_id: "UG",
        auto_apply: autoApply,
        auto_approve: autoApprove ?? 0,
        page_version: pageVersion,
        ...(this.getBody().bugLanguage ? { bug_lang: 1 } : {}),
        ...this.evaluateCampaignType(),
        ...(typeof this.getBody().target?.cap !== "undefined"
          ? { desired_number_of_testers: this.getBody().target?.cap }
          : {}),
        ...(campaignToDuplicate
          ? {
              min_allowed_media: campaignToDuplicate.min_allowed_media,
              cust_bug_vis: campaignToDuplicate.cust_bug_vis,
              campaign_type: campaignToDuplicate.campaign_type,
              campaign_pts: campaignToDuplicate.campaign_pts,
              duplicate_from: campaignToDuplicate.id,
            }
          : {}),
      })
      .returning("id");

    const campaignId = results[0].id ?? results[0];

    if (campaignToDuplicate) {
      await this.duplicateMeta({
        campaignId,
        campaignToDuplicate: campaignToDuplicate.id,
      });
    } else {
      await this.createCampaignMeta(campaignId);
    }

    await this.createAdditionals(campaignId);
    await this.setBugTypes(campaignId);

    const dossier = await tryber.tables.CampaignDossierData.do()
      .insert({
        campaign_id: campaignId,
        description: this.getBody().description,
        link: this.getBody().productLink || "",
        goal: this.getBody().goal,
        out_of_scope: this.getBody().outOfScope,
        target_audience: this.getBody().target?.notes,
        ...(typeof this.getBody().target?.size !== "undefined" && {
          target_size: this.getBody().target?.size,
        }),
        product_type_id: this.getBody().productType,
        target_devices: this.getBody().deviceRequirements,
        created_by: this.getTesterId(),
        updated_by: this.getTesterId(),
        notes: this.getBody().notes,
        gender_quote: this.getBody().target?.genderQuote || "",
      })
      .returning("id");

    const dossierId = dossier[0].id ?? dossier[0];

    await tryber.tables.CampaignPhaseHistory.do().insert({
      campaign_id: campaignId,
      phase_id: 1,
      created_by: this.getTesterId(),
    });

    // TODO: move countries, languages, browsers, into visibility criteria
    const countries = this.getBody().countries;
    if (countries?.length) {
      await tryber.tables.CampaignDossierDataCountries.do().insert(
        countries.map((country) => ({
          campaign_dossier_data_id: dossierId,
          country_code: country,
        }))
      );
    }

    const languages = this.getBody().languages;
    if (languages?.length) {
      await tryber.tables.CampaignDossierDataLanguages.do().insert(
        languages.map((language) => ({
          campaign_dossier_data_id: dossierId,
          language_id: -1,
          language_name: language,
        }))
      );
    }

    const browsers = this.getBody().browsers;
    if (browsers?.length) {
      await tryber.tables.CampaignDossierDataBrowsers.do().insert(
        browsers.map((browser) => ({
          campaign_dossier_data_id: dossierId,
          browser_id: browser,
        }))
      );
    }

    const visibilityCriteria = this.getBody().visibilityCriteria;

    const cufs = visibilityCriteria?.cuf || [];
    if (cufs?.length > 0) {
      for (const cuf of cufs) {
        const cufValueIds = cuf.cufValueIds;
        if (cufValueIds.length > 0) {
          await tryber.tables.CampaignDossierDataCuf.do().insert(
            cuf.cufValueIds.map((c) => ({
              campaign_dossier_data_id: dossierId,
              cuf_id: cuf.cufId,
              cuf_value_id: c,
            }))
          );
        }
      }
    }

    const ageRanges = visibilityCriteria?.ageRanges || [];
    if (ageRanges?.length > 0) {
      await tryber.tables.CampaignDossierDataAge.do().insert(
        ageRanges.map((range) => ({
          campaign_dossier_data_id: dossierId,
          max: range.max,
          min: range.min,
        }))
      );
    }

    const genders = visibilityCriteria?.gender || [];
    if (genders?.length > 0) {
      for (const g of genders) {
        if (g !== null) {
          await tryber.tables.CampaignDossierDataGender.do().insert({
            campaign_dossier_data_id: dossierId,
            gender: g,
          });
        }
      }
    }

    const provinces = visibilityCriteria?.provinces || [];
    if (provinces.length > 0) {
      for (const p of provinces) {
        await tryber.tables.CampaignDossierDataProvince.do().insert({
          campaign_dossier_data_id: dossierId,
          province: p.toUpperCase(),
        });
      }
    }

    return campaignId;
  }

  private evaluateCampaignType() {
    /**
     * campaign_type values: -1 | 0 | 1
     * -1 = no bug form
     * 0 = standard campaign bug form enabled
     * 1 = bug form with bug parade enabled
     */
    const { hasBugParade, hasBugForm } = this.getBody();
    if (hasBugParade === undefined && hasBugForm === undefined)
      return { campaign_type: 0 };

    if (hasBugParade === 1) {
      return { campaign_type: 1 };
    }

    if (hasBugForm === 0) {
      return { campaign_type: -1 };
    }

    return {};
  }

  private async createAdditionals(campaignId: number) {
    const { additionals } = this.getBody();
    if (!additionals || !additionals.length) return;

    await tryber.tables.WpAppqCampaignAdditionalFields.do().insert(
      additionals.map((additional) => ({
        cp_id: campaignId,
        type: additional.type === "text" ? "regex" : "select",
        slug: additional.slug,
        title: additional.name,
        validation:
          additional.type === "text"
            ? additional.regex
            : additional.options.join(";"),
        error_message: additional.error,
        stats: additional.showInStats ? 1 : 0,
      }))
    );
  }

  private async setBugTypes(campaignId: number) {
    const { bugTypes } = this.getBody();
    if (!bugTypes || !bugTypes.length) return;

    await tryber.tables.WpAppqAdditionalBugTypes.do().insert(
      bugTypes.map((bugType) => ({
        campaign_id: campaignId,
        bug_type_id: bugType,
      }))
    );
  }

  private async linkRolesToCampaign(campaignId: number) {
    const roles = this.getBody().roles;
    if (!roles?.length) return;

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
    const isV2 = this.getBody().pageVersion === "v2";
    if (!isV2) await apiTrigger.generateTasks();

    if (this.duplicate.fieldsFrom) await this.duplicateFields(campaignId);

    if (this.duplicate.useCasesFrom) await this.duplicateUsecases(campaignId);
    else if (!isV2) await apiTrigger.generateUseCase();

    if (this.duplicate.mailMergesFrom)
      await this.duplicateMailMerge(campaignId);
    else await apiTrigger.generateMailMerges();

    if (this.duplicate.pagesFrom) await this.duplicatePages(campaignId);
    else {
      if (!isV2) await apiTrigger.generatePages();
    }

    if (this.duplicate.testersFrom) await this.duplicateTesters(campaignId);
  }

  private async duplicateFields(campaignId: number) {
    if (!this.duplicate.fieldsFrom) return;

    const fields = await tryber.tables.WpAppqCampaignAdditionalFields.do()
      .select()
      .where({
        cp_id: this.duplicate.fieldsFrom,
      });

    if (!fields.length) return;

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

    if (!groups.length) return;

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

    if (!mailMerges.length) return;

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
    const pagesFrom = this.duplicate.pagesFrom;
    if (!pagesFrom) return;

    await importPages(pagesFrom, campaignId);
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

  private async assignOlps(campaignId: number) {
    const roles = this.getBody().roles;
    if (!roles?.length) return;

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

  private async evaluateAutoApply(): Promise<number> {
    const { autoApply, testType } = this.getBody();

    if (typeof autoApply === "number") {
      if (autoApply === 0 || autoApply === 1) return autoApply;
    }

    const autoApplyFromType = await tryber.tables.WpAppqCampaignType.do()
      .select("has_auto_apply")
      .where("id", testType)
      .first();

    if (!autoApplyFromType) return 0;
    return autoApplyFromType.has_auto_apply ? 1 : 0;
  }

  private async setupNotifications(campaignId: number) {
    const usersToNotify = await this.retrieveProjectAndWorkspaceUsers();

    if (!usersToNotify) return;
    const unguess = new Unguess();
    try {
      const result = await unguess.postCampaignWatchers({
        profileIds: usersToNotify,
        campaignId: campaignId,
      });
      return result;
    } catch (error: any) {
      console.error(
        "Error setting up notifications calling unguess api:",
        error
      );
      // @ts-ignore
      console.error("Error details: ", error?.response?.data);
      return;
    }
  }

  private async retrieveProjectAndWorkspaceUsers(): Promise<
    { users: { id: number }[] } | undefined
  > {
    const projectId = this.getBody().project;

    try {
      const projectUsers = await tryber.tables.WpAppqProject.do()
        .select(
          tryber.ref("profile_id").withSchema("wp_appq_user_to_project"),
          "wp_appq_project.customer_id"
        )
        .leftJoin(
          "wp_appq_user_to_project",
          "wp_appq_user_to_project.project_id",
          "wp_appq_project.id"
        )
        .where("wp_appq_project.id", projectId);

      if (!projectUsers.length) return;

      const workspaceUsers = await tryber.tables.WpAppqUserToCustomer.do()
        .select("profile_id")
        .whereIn(
          "customer_id",
          projectUsers.map((pu) => pu.customer_id)
        );

      const rawIds = [
        ...projectUsers.map((pu) => pu.profile_id),
        ...workspaceUsers.map((wu) => wu.profile_id),
      ];

      const validIds = Array.from(
        new Set(
          rawIds
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
        )
      );

      if (!validIds.length) return;

      return {
        users: validIds.map((id) => ({ id })),
      };
    } catch (e) {
      console.error(e);
    }
  }
}
