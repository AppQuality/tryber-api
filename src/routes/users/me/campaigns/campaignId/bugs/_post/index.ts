/** OPENAPI-ROUTE: post-users-me-campaigns-campaign-bugs */

import Devices from "@src/features/class/Devices";
import { tryber } from "@src/features/database";
import debugMessage from "@src/features/debugMessage";
import getMimetypeFromS3 from "@src/features/getMimetypeFromS3";
import { Context } from "openapi-backend";
import {
  Bug,
  BugMedia,
  BugType,
  CampaignAdditional,
  CreateAdditionals,
  CreateBugError,
  Media,
  Replicability,
  RequestParams,
  Severity,
  Usecase,
  UserAdditionals,
  UserDevice,
} from "./types";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
): Promise<Bug | CreateBugError> => {
  const params = c.request.params as RequestParams;
  const campaignId = parseInt(params.campaignId);
  const body: StoplightOperations["post-users-me-campaigns-campaign-bugs"]["requestBody"]["content"]["application/json"] =
    req.body;

  let candidature,
    usecase: Usecase,
    severity: Severity,
    replicability: Replicability,
    bugtype: BugType,
    media: BugMedia,
    device: UserDevice,
    additional: CreateAdditionals;
  try {
    await campaignExists();
    candidature = await getTesterCandidature();
    usecase = await usecaseIsValid(candidature.group_id);
    severity = await getSeverity();
    replicability = await getReplicability();
    bugtype = await getBugType();
    media = await getMediaData();
    device = await getUserDevice(body.device);
    additional = await filterValidAdditionalFields();
    checkIsoStringDate();
  } catch (error) {
    debugMessage(error);
    res.status_code = (error as OpenapiError).status_code || 400;
    return {
      element: "bugs",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
  let insertedBugId: number;
  try {
    insertedBugId = await createBug(
      usecase,
      severity.id,
      replicability.id,
      bugtype.id,
      device
    );
  } catch (error) {
    debugMessage(error);
    res.status_code = 500;
    return {
      element: "bugs",
      id: 0,
      message: "Error creating bug",
    };
  }

  let internalBugID: string;
  try {
    internalBugID = await updateInternalBugId(insertedBugId);
  } catch (error) {
    debugMessage(error);
    res.status_code = 500;
    return {
      element: "bugs",
      id: 0,
      message: "Error updating internal bug id",
    };
  }

  let insertedMedia: Media = [];
  try {
    if (body.media) insertedMedia = await createMediasBug(insertedBugId, media);
  } catch (error) {
    debugMessage(error);
    res.status_code = 500;
    return {
      element: "bugs",
      id: 0,
      message: "Error on insert media",
    };
  }
  let insertedAdditional: UserAdditionals;
  if (additional) {
    try {
      insertedAdditional = await createAdditionalFields(
        insertedBugId,
        additional
      );
    } catch (error) {
      debugMessage(error);
      res.status_code = 500;
      return {
        element: "bugs",
        id: 0,
        message: "Error on insert additional fields",
      };
    }
  }

  res.status_code = 200;
  return {
    id: insertedBugId,
    testerId: req.user.testerId,
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
    usecase: usecase.title,
    media: insertedMedia,
    device: device,
    additional: insertedAdditional,
  };

  async function campaignExists() {
    const result = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .where({
        id: campaignId,
      })
      .first();
    if (!result) {
      throw {
        status_code: 404,
        message: `CP${campaignId}, does not exists.`,
      };
    }
  }
  async function getTesterCandidature() {
    const result = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("group_id", "selected_device")
      .where("user_id", req.user.ID)
      .andWhere("campaign_id", campaignId);
    if (!result.length) {
      throw {
        status_code: 403,
        message: `T${req.user.testerId} is not candidate on CP${campaignId}.`,
      };
    }
    if (
      result[0].selected_device !== 0 &&
      result[0].selected_device !== body.device
    ) {
      throw {
        status_code: 403,
        message: `Device is not candidate on CP${campaignId}.`,
      };
    }
    return result[0];
  }
  async function getSeverity() {
    const severities = await getSeverities();
    const result = severities.find((item) => item.name === body.severity);
    if (result) return result;
    throw {
      status_code: 403,
      message: `Severity ${body.severity} is not accepted from CP${campaignId}.`,
    };
    async function getSeverities(): Promise<Severity[]> {
      const data = await getCampaignAdditionalSeverities();
      const query = tryber.tables.WpAppqEvdSeverity.do().select("id", "name");
      if (data.length) query.whereIn("id", data);
      const result = await query;
      return result.map((item) => ({ ...item, name: item.name } as Severity));
    }
    async function getCampaignAdditionalSeverities(): Promise<number[]> {
      const result = await tryber.tables.WpAppqAdditionalBugSeverities.do()
        .select("bug_severity_id")
        .where("campaign_id", campaignId);
      return result.map((item) => item.bug_severity_id);
    }
  }
  async function getReplicability() {
    const replicabilities = await getReplicabilities();
    const result = replicabilities.find(
      (item) => item.name === body.replicability
    );
    if (result) return result;
    throw {
      status_code: 403,
      message: `Replicability ${body.replicability} is not accepted from CP${campaignId}.`,
    };
    async function getReplicabilities(): Promise<Replicability[]> {
      const data = await getCampaignAdditionalReplicabilities();

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
    async function getCampaignAdditionalReplicabilities(): Promise<number[]> {
      const result = await tryber.tables.WpAppqAdditionalBugReplicabilities.do()
        .select("bug_replicability_id")
        .where("campaign_id", campaignId);
      return result.map((item) => item.bug_replicability_id);
    }
  }
  async function getBugType() {
    const bugtypes = await getBugTypes();
    const result = bugtypes.find((item) => item.name === body.type);
    if (result) return result;
    throw {
      status_code: 403,
      message: `BugType ${body.type} is not accepted from CP${campaignId}.`,
    };
    async function getBugTypes(): Promise<BugType[]> {
      const data = await getCampaignAdditionalBugTypes();

      const query = tryber.tables.WpAppqEvdBugType.do().select("id", "name");
      if (data.length) query.whereIn("id", data);
      const result = await query;

      return result.map(
        (item) => ({ ...item, name: item.name.toUpperCase() } as BugType)
      );
    }
    async function getCampaignAdditionalBugTypes(): Promise<number[]> {
      const result = await tryber.tables.WpAppqAdditionalBugTypes.do()
        .select("bug_type_id")
        .where("campaign_id", campaignId);
      return result.map((item) => item.bug_type_id);
    }
  }
  async function getMediaData() {
    let media: BugMedia;
    if (body.media) {
      media = [];
      for (const url of body.media) {
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
  async function usecaseIsValid(group_id: number): Promise<Usecase> {
    let usecase: Usecase;
    if (isNotSpecificUsecase())
      return { id: -1, title: "Not a specific use case" };

    let query =
      group_id === 0
        ? tryber.tables.WpAppqCampaignTask.do()
            .select(
              tryber.ref("id").withSchema("wp_appq_campaign_task"),
              "title"
            )
            .join(
              "wp_appq_campaign_task_group",
              "wp_appq_campaign_task.id",
              "wp_appq_campaign_task_group.task_id"
            )
            .where("group_id", 0)
            .where("campaign_id", campaignId)
            .where("wp_appq_campaign_task.id", body.usecase)
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
            .where("campaign_id", campaignId)
            .where("wp_appq_campaign_task.id", body.usecase);

    let usecases = await query;
    if (!usecases.length) {
      throw {
        status_code: 403,
        message: `Usecase ${body.usecase} not found for CP${campaignId}.`,
      };
    }
    usecase = usecases[0];

    return usecase;

    function isNotSpecificUsecase() {
      return body.usecase === -1;
    }
  }
  async function filterValidAdditionalFields(): Promise<CreateAdditionals> {
    let additionals = body.additional || [];
    let campaignAdditionalFields = await getCampaignAdditionalFields();

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
    return getValidAdditionalFields(additionals);

    async function getCampaignAdditionalFields(): Promise<
      CampaignAdditional[]
    > {
      return await tryber.tables.WpAppqCampaignAdditionalFields.do()
        .select("id", "slug", "type", "validation")
        .where("cp_id", campaignId);
    }
    function getValidAdditionalFields(
      bodyAdditional: { slug: string; value: string }[]
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
      }

      function isValidSelect(
        currentCpAdditional: CampaignAdditional,
        currentBugAdditional: any
      ) {
        return (
          isSelect(currentCpAdditional) &&
          hasValidOption(currentBugAdditional, currentCpAdditional)
        );
      }
    }
    function isSelect(item: { type: string }) {
      return item.type === "select";
    }
    function isRegex(item: { type: string }) {
      return item.type === "regex";
    }
    function hasValidOption(
      bugAdditional: { value: string },
      cpAdditional: { validation: string }
    ) {
      if (cpAdditional.validation) {
        const options = cpAdditional.validation.split(";").map((s) => s.trim());
        return options.includes(bugAdditional.value);
      }
      return false;
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
  function checkIsoStringDate() {
    const regexpISOString =
      /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}[+-][0-9]{2}:[0-9]{2}/gm;
    if (!regexpISOString.test(body.lastSeen)) {
      throw {
        status_code: 403,
        message: `Date format is not correct.`,
      };
    }
  }
  async function createBug(
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
          wp_user_id: Number(req.user.ID),
          message: body.title,
          description: body.description,
          expected_result: body.expected,
          current_result: body.current,
          campaign_id: campaignId,
          status_id: 3,
          publish: 1,
          status_reason: "Bug under review.",
          severity_id: severityId,
          created: tryber.fn.now(),
          bug_replicability_id: replicabilityId,
          bug_type_id: bugTypeId,
          application_section: usecase.title,
          application_section_id: usecase.id === -1 ? 0 : usecase.id,
          note: "",
          dev_id: device.id,
          last_seen: body.lastSeen,
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
  async function getUserDevice(deviceId: number): Promise<UserDevice> {
    try {
      const device = await new Devices().getOne(deviceId);
      if (!device) throw Error("No device on your user");
      return device;
    } catch (error) {
      debugMessage(error);
      throw {
        status_code: 403,
        message: (error as OpenapiError).message,
      };
    }
  }
  async function updateInternalBugId(bugId: number): Promise<string> {
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
  async function createMediasBug(
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
        .where("wp_appq_evd_bug.wp_user_id", req.user.ID)
        .andWhere("wp_appq_evd_bug.id", bugId)
    ).map((item) => item.url);
    return inserted.length ? inserted : [];
  }
  async function createAdditionalFields(
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
};
