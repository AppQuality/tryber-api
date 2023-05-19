/** OPENAPI-CLASS: post-users-me-campaigns-campaign-bugs */

import Devices from "@src/features/class/Devices";
import { tryber } from "@src/features/database";
import getMimetypeFromS3 from "@src/features/getMimetypeFromS3";
import {
  BugMedia,
  BugType,
  CampaignAdditional,
  CreateAdditionals,
  Media,
  Replicability,
  Severity,
  Usecase,
  UserAdditionals,
  UserDevice,
} from "./types";
import UserRoute from "@src/features/routes/UserRoute";

export default class PostBugsOnCampaignRoute extends UserRoute<{
  response: StoplightOperations["post-users-me-campaigns-campaign-bugs"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["post-users-me-campaigns-campaign-bugs"]["parameters"]["path"];
  body: StoplightOperations["post-users-me-campaigns-campaign-bugs"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number = parseInt(this.getParameters().campaignId);
  private wpUserId: number = this.getWordpressId();
  private reqBody: StoplightOperations["post-users-me-campaigns-campaign-bugs"]["requestBody"]["content"]["application/json"] =
    this.getBody();

  private candidature: Awaited<ReturnType<typeof this.getTesterCandidature>>;
  private device: Awaited<ReturnType<typeof this.getUserDevice>> | false =
    false;
  private replicability: Awaited<ReturnType<typeof this.getReplicability>>;
  private severity: Awaited<ReturnType<typeof this.getSeverity>>;
  private bugType: Awaited<ReturnType<typeof this.getBugType>>;
  private usecase: Awaited<ReturnType<typeof this.getValidUsecase>> | undefined;

  constructor(protected configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "bugs" });
  }

  protected async init(): Promise<void> {
    this.candidature = await this.getTesterCandidature();
    this.device = await this.getUserDevice(this.reqBody.device);
    this.replicability = await this.getReplicability();

    this.severity = await this.getSeverity();
    this.bugType = await this.getBugType();
    this.usecase = await this.getValidUsecase(
      this.candidature ? this.candidature.group_id : 0
    );
  }

  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;
    if (!(await this.campaignExists())) {
      this.setError(404, {
        message: `CP${this.campaignId}, does not exists.`,
      } as OpenapiError);
      return false;
    }
    if (!this.candidature) {
      this.setError(403, {
        message: `T${this.getTesterId()} is not candidate on CP${
          this.campaignId
        }.`,
      } as OpenapiError);
      return false;
    }
    if (
      this.candidature.selected_device !== 0 &&
      this.candidature.selected_device !== this.getBody().device
    ) {
      console.log("fail");
      this.setError(403, {
        message: `Device is not candidate on CP${this.campaignId}.`,
      } as OpenapiError);
      return false;
    }
    if (!this.lastSeenIsValid()) {
      this.setError(403, {
        message: `Date format is not correct.`,
      } as OpenapiError);
      return false;
    }
    if (!this.device) {
      this.setError(403, { message: `No device on your user` } as OpenapiError);
      return false;
    }
    if (!this.replicability) {
      this.setError(403, {
        message: `Replicability ${this.reqBody.replicability} is not accepted from CP${this.campaignId}.`,
      } as OpenapiError);
      return false;
    }

    if (!this.severity) {
      this.setError(403, {
        message: `Severity ${this.reqBody.severity} is not accepted from CP${this.campaignId}.`,
      } as OpenapiError);
      return false;
    }
    if (!this.bugType) {
      this.setError(403, {
        message: `BugType ${this.reqBody.type} is not accepted from CP${this.campaignId}.`,
      } as OpenapiError);
      return false;
    }

    if (!this.usecase) {
      this.setError(403, {
        message: `Usecase ${this.reqBody.usecase} not found for CP${this.campaignId}.`,
      } as OpenapiError);
      return false;
    }

    return true;
  }
  protected async prepare() {
    if (!this.usecase) throw new Error("Usecase not found");
    if (!this.device) throw new Error("Device not found");

    const body = this.getBody();

    let severity: Severity,
      bugtype: BugType,
      media: BugMedia,
      additional: CreateAdditionals;

    severity = (await this.getSeverity()) as Severity;
    bugtype = (await this.getBugType()) as BugType;
    media = await this.getMediaData();
    additional = await this.filterValidAdditionalFields();

    let insertedBugId: number;
    insertedBugId = await this.createBug(
      this.usecase,
      severity.id,
      (this.replicability as Replicability).id,
      bugtype.id,
      this.device as UserDevice
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

  private async campaignExists() {
    const result = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .where({
        id: this.campaignId,
      })
      .first();
    if (!result) return false;
    return true;
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
    const severities = await this.getSeverities();
    const result = severities.find(
      (item) => item.name === this.reqBody.severity
    );
    if (result) return result;
  }
  private async getSeverities(): Promise<Severity[]> {
    const data = await this.getCampaignAdditionalSeverities();
    const query = tryber.tables.WpAppqEvdSeverity.do().select("id", "name");
    if (data.length) query.whereIn("id", data);
    const result = await query;
    return result.map((item) => ({ ...item, name: item.name } as Severity));
  }
  private async getCampaignAdditionalSeverities(): Promise<number[]> {
    const result = await tryber.tables.WpAppqAdditionalBugSeverities.do()
      .select("bug_severity_id")
      .where("campaign_id", this.campaignId);
    return result.map((item) => item.bug_severity_id);
  }
  private async getReplicability() {
    const replicabilities = await this.getReplicabilities();
    const result = replicabilities.find(
      (item) => item.name === this.reqBody.replicability
    );
    if (result) return result;
  }

  private async getReplicabilities(): Promise<Replicability[]> {
    const data = await this.getCampaignAdditionalReplicabilities();

    const query = tryber.tables.WpAppqEvdBugReplicability.do().select(
      "id",
      "name"
    );
    if (data.length) query.whereIn("id", data);
    const result = await query;

    return result.map(
      (item) => ({ ...item, name: item.name.toUpperCase() } as Replicability)
    );
  }
  private async getCampaignAdditionalReplicabilities(): Promise<number[]> {
    const result = await tryber.tables.WpAppqAdditionalBugReplicabilities.do()
      .select("bug_replicability_id")
      .where("campaign_id", this.campaignId);
    return result.map((item) => item.bug_replicability_id);
  }
  private async getBugType() {
    const bugtypes = await this.getBugTypes();
    const result = bugtypes.find((item) => item.name === this.reqBody.type);
    if (result) return result;
  }
  private async getBugTypes(): Promise<BugType[]> {
    const data = await this.getCampaignAdditionalBugTypes();

    const query = tryber.tables.WpAppqEvdBugType.do().select("id", "name");
    if (data.length) query.whereIn("id", data);
    const result = await query;

    return result.map(
      (item) => ({ ...item, name: item.name.toUpperCase() } as BugType)
    );
  }
  private async getCampaignAdditionalBugTypes(): Promise<number[]> {
    const result = await tryber.tables.WpAppqAdditionalBugTypes.do()
      .select("bug_type_id")
      .where("campaign_id", this.campaignId);
    return result.map((item) => item.bug_type_id);
  }
  private async getMediaData() {
    let media: BugMedia;
    if (this.reqBody.media) {
      media = [];
      for (const url of this.reqBody.media) {
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
  private async getValidUsecase(group_id: number): Promise<Usecase> {
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
            .where("wp_appq_campaign_task.id", this.reqBody.usecase)
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
            .where("wp_appq_campaign_task.id", this.reqBody.usecase);

    let awaitedUusecase = await query;

    usecase = awaitedUusecase[0];

    return usecase;
  }
  private isNotSpecificUsecase() {
    return this.reqBody.usecase === -1;
  }
  private async filterValidAdditionalFields(): Promise<CreateAdditionals> {
    let additionals = this.reqBody.additional || [];
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
  private async getCampaignAdditionalFields(): Promise<CampaignAdditional[]> {
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
  private lastSeenIsValid() {
    return this.checkIsoStringDate(this.reqBody.lastSeen);
  }

  private checkIsoStringDate(ISOString: string) {
    const regexpISOString =
      /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}[+-][0-9]{2}:[0-9]{2}/gm;
    if (!regexpISOString.test(ISOString)) {
      return false;
    }
    return true;
  }
  private async createBug(
    usecase: { id: number; title: string },
    severityId: number,
    replicabilityId: number,
    bugTypeId: number,
    device: UserDevice
  ): Promise<number> {
    const deviceData = device.device;
    const deviceOsData = device.operating_system;
    const isPC = (d: typeof deviceData): d is { pc_type: string } => {
      return !!d.hasOwnProperty("pc_type");
    };

    try {
      const result = await tryber.tables.WpAppqEvdBug.do()
        .insert({
          wp_user_id: this.wpUserId,
          message: this.reqBody.title,
          description: this.reqBody.description,
          expected_result: this.reqBody.expected,
          current_result: this.reqBody.current,
          campaign_id: this.campaignId,
          status_id: 3,
          publish: 1,
          status_reason: "Bug under review.",
          severity_id: severityId,
          created: tryber.fn.now(),
          bug_replicability_id: replicabilityId,
          bug_type_id: bugTypeId,
          application_section: usecase.title,
          application_section_id: usecase.id,
          note: body.notes,
          dev_id: device.id,
          last_seen: this.reqBody.lastSeen,
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
  private async getUserDevice(deviceId: number): Promise<UserDevice | false> {
    const device = await new Devices().getOne(deviceId);
    return device;
  }
  private async updateInternalBugId(bugId: number): Promise<string> {
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
        .where("wp_appq_evd_bug.wp_user_id", this.wpUserId)
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
