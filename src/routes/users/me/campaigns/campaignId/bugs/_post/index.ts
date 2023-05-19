/** OPENAPI-CLASS: post-users-me-campaigns-campaign-bugs */

import OpenapiError from "@src/features/OpenapiError";
import Campaign from "@src/features/class/Campaign";
import Devices from "@src/features/class/Devices";
import { tryber } from "@src/features/database";
import getMimetypeFromS3 from "@src/features/getMimetypeFromS3";
import UserRoute from "@src/features/routes/UserRoute";
import {
  BugMedia,
  CampaignAdditional,
  CreateAdditionals,
  Media,
  Usecase,
  UserAdditionals,
  UserDevice,
} from "./types";

export default class PostBugsOnCampaignRoute extends UserRoute<{
  response: StoplightOperations["post-users-me-campaigns-campaign-bugs"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["post-users-me-campaigns-campaign-bugs"]["parameters"]["path"];
  body: StoplightOperations["post-users-me-campaigns-campaign-bugs"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number = parseInt(this.getParameters().campaignId);

  private candidature: Awaited<ReturnType<typeof this.getTesterCandidature>>;
  private device: Awaited<ReturnType<typeof this.getUserDevice>> | false =
    false;
  private usecase: Awaited<ReturnType<typeof this.getValidUsecase>> | undefined;

  constructor(protected configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "bugs" });
  }

  protected async init() {
    this.candidature = await this.getTesterCandidature();
    this.device = await this.getUserDevice();

    this.usecase = await this.getValidUsecase(
      this.candidature ? this.candidature.group_id : 0
    );
  }

  protected async filter() {
    if (!(await super.filter())) return false;
    if (await this.campaignDoesNotExists()) return false;
    if (this.lastSeenIsInvalid()) return false;
    if (await this.deviceDoesNotExists()) return false;
    if (await this.severityIsNotValid()) return false;
    if (await this.bugTypeIsNotValid()) return false;

    const candidature = await this.getTesterCandidature();

    if (!candidature) {
      this.setError(
        403,
        new OpenapiError(
          `T${this.getTesterId()} is not candidate on CP${this.campaignId}.`
        )
      );
      return false;
    }
    if (
      candidature.selected_device !== 0 &&
      candidature.selected_device !== this.getBody().device
    ) {
      this.setError(
        403,
        new OpenapiError(`Device is not candidate on CP${this.campaignId}.`)
      );
      return false;
    }

    if (!(await this.getValidUsecase(candidature ? candidature.group_id : 0))) {
      this.setError(
        403,
        new OpenapiError(
          `Usecase ${this.getBody().usecase} not found for CP${
            this.campaignId
          }.`
        )
      );
      return false;
    }

    return true;
  }

  private async campaignDoesNotExists() {
    const result = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .where({
        id: this.campaignId,
      })
      .first();
    if (result) return false;
    this.setError(
      404,
      new OpenapiError(`CP${this.campaignId}, does not exists.`)
    );
    return true;
  }

  private lastSeenIsInvalid() {
    if (this.lastSeenShouldBeIsoFormat()) return false;
    this.setError(403, new OpenapiError(`Date format is not correct.`));
    return true;
  }

  private lastSeenShouldBeIsoFormat() {
    const regexpISOString =
      /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}[+-][0-9]{2}:[0-9]{2}/gm;
    if (!regexpISOString.test(this.getBody().lastSeen)) {
      return false;
    }
    return true;
  }

  private async deviceDoesNotExists() {
    const device = await tryber.tables.WpCrowdAppqDevice.do()
      .select(tryber.ref("id").withSchema("wp_crowd_appq_device"))
      .where({ id: this.getBody().device, enabled: 1 })
      .first();
    if (device) return false;
    this.setError(403, new OpenapiError(`No device on your user`));
    return true;
  }

  private async severityIsNotValid() {
    try {
      const severity = await this.getSeverity();
      if (severity) return false;
    } catch (e) {}
    this.setError(
      403,
      new OpenapiError(
        `Severity ${this.getBody().severity} is not accepted from CP${
          this.campaignId
        }.`
      )
    );
    return true;
  }

  private async bugTypeIsNotValid() {
    try {
      const bugType = await this.getBugType();
      if (bugType) return false;
    } catch (e) {}
    this.setError(
      403,
      new OpenapiError(
        `BugType ${this.getBody().type} is not accepted from CP${
          this.campaignId
        }.`
      )
    );
    return true;
  }

  protected async prepare() {
    if (!this.usecase) throw new Error("Usecase not found");
    if (!this.device) throw new Error("Device not found");

    const body = this.getBody();

    let media: BugMedia, additional: CreateAdditionals;

    const severity = await this.getSeverity();
    const bugtype = await this.getBugType();
    media = await this.getMediaData();
    additional = await this.filterValidAdditionalFields();

    let insertedBugId: number;
    insertedBugId = await this.createBug(
      this.usecase,
      severity.id,
      bugtype.id,
      this.device
    );

    let internalBugID: string;
    internalBugID = await this.updateInternalBugId(insertedBugId);

    let insertedMedia: Media = [];
    if (body.media)
      insertedMedia = await this.createMediasBug(insertedBugId, media);

    let insertedAdditional: UserAdditionals;
    if (additional) {
      insertedAdditional = await this.createAdditionalFields(
        insertedBugId,
        additional
      );
    }

    this.setSuccess(200, {
      id: insertedBugId,
      testerId: this.getTesterId(),
      internalId: internalBugID,
      title: body.title,
      description: body.description,
      notes: body.notes,
      severity: severity.name,
      replicability: body.replicability,
      type: body.type,
      status: "PENDING",
      expected: body.expected,
      current: body.current,
      usecase: this.usecase.title,
      media: insertedMedia,
      device: this.device,
      additional: insertedAdditional,
    });
  }

  private async getTesterCandidature() {
    const result = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("group_id", "selected_device")
      .where("user_id", this.getWordpressId())
      .andWhere("campaign_id", this.campaignId)
      .first();
    return result;
  }

  private async getSeverity() {
    const campaign = new Campaign(this.campaignId);
    const severities = await campaign.getAvailableSeveritiesItems();
    const result = severities.valid.find(
      ({ name }) => name === this.getBody().severity
    );
    if (!result) throw new Error("Severity not found");

    return result;
  }

  private async getBugType() {
    const campaign = new Campaign(this.campaignId);
    const bugTypes = await campaign.getAvailableTypesItems();
    const result = bugTypes.valid.find(
      (item) => item.name === this.getBody().type
    );
    if (!result) throw new Error("BugType not found");
    return result;
  }

  private async getMediaData() {
    let media: BugMedia;
    if (this.getBody().media) {
      media = [];
      for (const url of this.getBody().media) {
        const mimeType = await getMimetypeFromS3({ url });
        if (!mimeType) media.push({ url: url, type: "other" });
        else {
          if (mimeType.startsWith("image"))
            media.push({ url: url, type: "image" });
          else if (mimeType.startsWith("video"))
            media.push({ url: url, type: "video" });
          else media.push({ url: url, type: mimeType });
        }
      }
    }
    return media;
  }

  private async getValidUsecase(group_id: number) {
    let usecase: Usecase;
    if (this.isNotSpecificUsecase())
      return { id: -1, title: "Not a specific use case" };

    let query =
      group_id === 0
        ? tryber.tables.WpAppqCampaignTask.do()
            .select(
              tryber.ref("id").withSchema("wp_appq_campaign_task"),
              "title"
            )
            .where("group_id", 0)
            .where("campaign_id", this.campaignId)
            .where("wp_appq_campaign_task.id", this.getBody().usecase)
        : tryber.tables.WpAppqCampaignTask.do()
            .select(
              tryber.ref("id").withSchema("wp_appq_campaign_task"),
              "title"
            )
            .join(
              "wp_appq_campaign_task_group",
              "wp_appq_campaign_task.id",
              "wp_appq_campaign_task_group.task_id"
            )
            .where((builder) => {
              builder
                .where("wp_appq_campaign_task_group.group_id", group_id)
                .orWhere("wp_appq_campaign_task_group.group_id", 0);
            })
            .where("campaign_id", this.campaignId)
            .where("wp_appq_campaign_task.id", this.getBody().usecase);

    let awaitedUusecase = await query;

    usecase = awaitedUusecase[0];

    return usecase;
  }

  private isNotSpecificUsecase() {
    return this.getBody().usecase === -1;
  }

  private async filterValidAdditionalFields() {
    let additionals = this.getBody().additional || [];
    let campaignAdditionalFields = await this.getCampaignAdditionalFields();

    if (!campaignAdditionalFields.length) {
      return undefined;
    }
    for (const campaignAdditionalField of campaignAdditionalFields) {
      if (
        !additionals.find((item) => item.slug === campaignAdditionalField.slug)
      ) {
        additionals.push({
          slug: campaignAdditionalField.slug,
          value: "",
        });
      }
    }
    const acceptedSlugs = campaignAdditionalFields.map(
      (item: { slug: string }) => item.slug
    );
    const bugSlugs = additionals.map((item: { slug: string }) => item.slug);
    //filter additionals in request that are acceptable
    return this.getValidAdditionalFields(
      additionals,
      bugSlugs,
      acceptedSlugs,
      campaignAdditionalFields
    );
  }

  private async getCampaignAdditionalFields() {
    return await tryber.tables.WpAppqCampaignAdditionalFields.do()
      .select("id", "slug", "type", "validation")
      .where("cp_id", this.campaignId);
  }

  private getValidAdditionalFields(
    bodyAdditional: { slug: string; value: string }[],
    bugSlugs: string[],
    acceptedSlugs: string[],
    campaignAdditionalFields: CampaignAdditional[]
  ) {
    let acceptableAdditional: CreateAdditionals = [];
    for (const slug of bugSlugs) {
      if (!acceptedSlugs.includes(slug)) continue;
      const currentBugAdditional = bodyAdditional.find(
        (item) => item.slug == slug
      );
      if (!currentBugAdditional) continue;
      const currentCpAdditional = campaignAdditionalFields.find(
        (item) => item.slug == slug
      );
      if (!currentCpAdditional) continue;
      if (
        isValidSelect(currentCpAdditional, currentBugAdditional) ||
        isValidRegex(currentCpAdditional, currentBugAdditional)
      ) {
        acceptableAdditional.push({
          id: currentCpAdditional.id,
          value: currentBugAdditional.value,
        });
      }
    }
    return acceptableAdditional.length ? acceptableAdditional : undefined;

    function isValidRegex(
      currentCpAdditional: CampaignAdditional,
      currentBugAdditional: any
    ) {
      return (
        isRegex(currentCpAdditional) &&
        respectRegex(currentBugAdditional, currentCpAdditional)
      );
      function isRegex(item: { type: string }) {
        return item.type === "regex";
      }
      function respectRegex(
        bugAdditional: { value: string },
        cpAdditional: { validation: string }
      ) {
        if (cpAdditional.validation === "") return true;
        if (cpAdditional.validation) {
          const regexp = new RegExp(
            cpAdditional.validation.replace(/(?:\\(.))/g, "$1")
          );
          return regexp.test(bugAdditional.value);
        }
        return false;
      }
    }

    function isValidSelect(
      currentCpAdditional: CampaignAdditional,
      currentBugAdditional: any
    ) {
      return (
        isSelect(currentCpAdditional) &&
        hasValidOption(currentBugAdditional, currentCpAdditional)
      );
      function isSelect(item: { type: string }) {
        return item.type === "select";
      }
      function hasValidOption(
        bugAdditional: { value: string },
        cpAdditional: { validation: string }
      ) {
        if (cpAdditional.validation) {
          const options = cpAdditional.validation
            .split(";")
            .map((s) => s.trim());
          return options.includes(bugAdditional.value);
        }
        return false;
      }
    }
  }

  private async createBug(
    usecase: { id: number; title: string },
    severityId: number,
    bugTypeId: number,
    device: UserDevice
  ): Promise<number> {
    const replicability = await this.getReplicability();
    const deviceData = device.device;
    const deviceOsData = device.operating_system;
    const isPC = (d: typeof deviceData): d is { pc_type: string } => {
      return !!d.hasOwnProperty("pc_type");
    };

    try {
      const result = await tryber.tables.WpAppqEvdBug.do()
        .insert({
          wp_user_id: this.getWordpressId(),
          message: this.getBody().title,
          description: this.getBody().description,
          expected_result: this.getBody().expected,
          current_result: this.getBody().current,
          campaign_id: this.campaignId,
          status_id: 3,
          publish: 1,
          status_reason: "Bug under review.",
          severity_id: severityId,
          created: tryber.fn.now(),
          bug_replicability_id: replicability.id,
          bug_type_id: bugTypeId,
          application_section: usecase.title,
          application_section_id: usecase.id,
          note: body.notes,
          dev_id: device.id,
          last_seen: this.getBody().lastSeen,
          manufacturer: isPC(deviceData) ? "-" : deviceData.manufacturer,
          model: isPC(deviceData) ? deviceData.pc_type : deviceData.model,
          os: deviceOsData.platform,
          os_version: deviceOsData.version,
          reviewer: 0,
          last_editor_id: 0,
        })
        .returning("id");
      return result[0]?.id ?? result[0];
    } catch (error) {
      throw {
        status_code: 403,
        message: `Error on uploading Bug`,
      };
    }
  }

  private async getReplicability() {
    const campaign = new Campaign(this.campaignId);
    const replicabilities = await campaign.getAvailableReplicabilitiesItems();
    const result = replicabilities.valid.find(
      ({ name }) => name === this.getBody().replicability
    );
    if (!result) {
      this.setError(
        403,
        new OpenapiError(
          `Replicability ${
            this.getBody().replicability
          } is not accepted from CP${this.campaignId}.`
        )
      );
      throw new OpenapiError("Replicability not found");
    }
    return result;
  }

  private async getUserDevice() {
    const device = await new Devices().getOne(this.getBody().device);
    return device;
  }
  private async updateInternalBugId(bugId: number) {
    const result = await tryber.tables.WpAppqEvdCampaign.do()
      .select(
        "base_bug_internal_id",
        tryber.ref("wp_appq_evd_bug.id").as("bug_id")
      )
      .join(
        "wp_appq_evd_bug",
        "wp_appq_evd_campaign.id",
        "wp_appq_evd_bug.campaign_id"
      )
      .where("wp_appq_evd_bug.id", bugId)
      .first();
    if (!result) throw Error("Error on updating internal bug id");

    const internalBugId = `${result.base_bug_internal_id}${result.bug_id}`;

    await tryber.tables.WpAppqEvdBug.do()
      .update({
        internal_id: internalBugId,
      })
      .where("id", bugId);
    return internalBugId;
  }
  private async createMediasBug(
    bugId: number,
    medias: BugMedia
  ): Promise<Media> {
    if (medias) {
      for (const media of medias) {
        await tryber.tables.WpAppqEvdBugMedia.do().insert({
          type: media.type,
          location: media.url,
          bug_id: bugId,
          uploaded: tryber.fn.now(),
        });
      }
    }
    const inserted = (
      await tryber.tables.WpAppqEvdBugMedia.do()
        .select(tryber.ref("location").as("url"))
        .join(
          "wp_appq_evd_bug",
          "wp_appq_evd_bug.id",
          "wp_appq_evd_bug_media.bug_id"
        )
        .where("wp_appq_evd_bug.wp_user_id", this.getWordpressId())
        .andWhere("wp_appq_evd_bug.id", bugId)
    ).map((item) => item.url);
    return inserted.length ? inserted : [];
  }
  private async createAdditionalFields(
    bugId: number,
    additionals: CreateAdditionals
  ): Promise<UserAdditionals> {
    if (!additionals) {
      return undefined;
    }

    for (const additional of additionals) {
      await tryber.tables.WpAppqCampaignAdditionalFieldsData.do().insert({
        bug_id: bugId,
        type_id: additional.id,
        value: additional.value,
      });
    }

    const inserted = await tryber.tables.WpAppqCampaignAdditionalFieldsData.do()
      .select(tryber.ref("value").as("value"), tryber.ref("slug").as("slug"))
      .join(
        "wp_appq_campaign_additional_fields",
        "wp_appq_campaign_additional_fields.id",
        "wp_appq_campaign_additional_fields_data.type_id"
      )
      .where("wp_appq_campaign_additional_fields_data.bug_id", bugId);
    return inserted.map((item) => ({
      slug: item.slug,
      value: item.value,
    }));
  }
}
