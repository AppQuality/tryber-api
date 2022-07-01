import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import getMimetypeFromS3 from "@src/features/getMimetypeFromS3";
import { Context } from "openapi-backend";

import getUserDevice from "./getUserDevice";
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

/** OPENAPI-ROUTE: post-users-me-campaigns-campaign-bugs */
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
    device = await getUserDevice(body.device, parseInt(req.user.ID));
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
    const result = await db.query(
      db.format(`SELECT id FROM wp_appq_evd_campaign WHERE id=? ;`, [
        campaignId,
      ])
    );
    if (!result.length) {
      throw {
        status_code: 404,
        message: `CP${campaignId}, does not exists.`,
      };
    }
  }
  async function getTesterCandidature() {
    const result = await db.query(
      db.format(
        `SELECT group_id, selected_device 
          FROM wp_crowd_appq_has_candidate 
          WHERE user_id=? AND campaign_id=? 
        ;`,
        [req.user.ID, campaignId]
      )
    );
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
      const result = (await db.query(
        "SELECT id,name FROM wp_appq_evd_severity " +
          (data.length ? `WHERE id IN (${data.join(",")})` : "")
      )) as { id: number; name: string }[];
      return result.map((item) => ({ ...item, name: item.name } as Severity));
    }
    async function getCampaignAdditionalSeverities(): Promise<number[]> {
      return (
        (await db.query(
          db.format(
            "SELECT bug_severity_id AS id FROM wp_appq_additional_bug_severities WHERE campaign_id = ?",
            [campaignId]
          )
        )) as { id: number }[]
      ).map((item) => item.id);
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
      const result = (await db.query(
        "SELECT id,name FROM wp_appq_evd_bug_replicability " +
          (data.length ? `WHERE id IN (${data.join(",")})` : "")
      )) as { id: number; name: string }[];
      return result.map(
        (item) => ({ ...item, name: item.name.toUpperCase() } as Replicability)
      );
    }
    async function getCampaignAdditionalReplicabilities(): Promise<number[]> {
      return (
        (await db.query(
          db.format(
            "SELECT bug_replicability_id AS id FROM wp_appq_additional_bug_replicabilities WHERE campaign_id = ?",
            [campaignId]
          )
        )) as { id: number }[]
      ).map((item) => item.id);
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
      const result = (await db.query(
        "SELECT id,name FROM wp_appq_evd_bug_type " +
          (data.length ? `WHERE id IN (${data.join(",")})` : "")
      )) as { id: number; name: string }[];
      return result.map(
        (item) => ({ ...item, name: item.name.toUpperCase() } as BugType)
      );
    }
    async function getCampaignAdditionalBugTypes(): Promise<number[]> {
      return (
        (await db.query(
          db.format(
            "SELECT bug_type_id AS id FROM wp_appq_additional_bug_types WHERE campaign_id = ?",
            [campaignId]
          )
        )) as { id: number }[]
      ).map((item) => item.id);
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

    let query = db.format(
      `SELECT tsk.id AS id, tsk.title AS title
        FROM wp_appq_campaign_task tsk
                 JOIN wp_appq_campaign_task_group tskgrp ON tskgrp.task_id = tsk.id
        WHERE tsk.campaign_id = ?
          AND (tskgrp.group_id = 0 OR tskgrp.group_id = ?)
          AND tsk.id = ?
       ;`,
      [campaignId, group_id, body.usecase]
    );

    if (group_id === 0) {
      query = db.format(
        `SELECT id, title
          FROM wp_appq_campaign_task usecase
          WHERE campaign_id = ?
            AND group_id = 0 
            AND tsk.id = ?
         ;`,
        [campaignId, body.usecase]
      );
    }

    let usecases = await db.query(query);
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
    if (!body.additional) return undefined;

    let campaignAdditionalFields = await getCampaignAdditionalFields();

    if (!campaignAdditionalFields.length) {
      throw {
        status_code: 403,
        message: `CP${campaignId} has not additional fields.`,
      };
    }
    const acceptedSlugs = campaignAdditionalFields.map(
      (item: { slug: string }) => item.slug
    );
    const bugSlugs = body.additional.map((item: { slug: string }) => item.slug);
    //filter additionals in request that are acceptable
    return getValidAdditionalFields(body.additional);

    async function getCampaignAdditionalFields(): Promise<
      CampaignAdditional[]
    > {
      return await db.query(
        db.format(
          `SELECT id, slug, type, validation 
          FROM wp_appq_campaign_additional_fields 
          WHERE cp_id = ?
         ;`,
          [campaignId]
        )
      );
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
      /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}\+[0-9]{2}:[0-9]{2}/gm;
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

    let format = db.format(
      `INSERT INTO wp_appq_evd_bug (
        wp_user_id, message, description, expected_result, current_result, campaign_id,
        status_id, publish, status_reason, severity_id, created,
        bug_replicability_id, bug_type_id, application_section, application_section_id,note, 
        dev_id, last_seen
        ,manufacturer,model,os,os_version
           )
      VALUES (
        ?,?,?,?,?,?,3,1,"Bug under review.",?,NOW(),?,?,?,?,?,
        ?,?
        ,?,?,?,?
        )
       ;`,
      [
        req.user.ID,
        body.title,
        body.description,
        body.expected,
        body.current,
        campaignId,
        severityId,
        replicabilityId,
        bugTypeId,
        usecase.title,
        usecase.id,
        body.notes,

        device.id,
        body.lastSeen,
        isPC(deviceData) ? "-" : deviceData.manufacturer,
        isPC(deviceData) ? deviceData.pc_type : deviceData.model,
        deviceOsData.platform,
        deviceOsData.version,
      ]
    );
    let inserted = await db.query(format);
    if (inserted.affectedRows === 0) {
      throw {
        status_code: 403,
        message: `Error on uploading Bug`,
      };
    }
    return inserted.insertId;
  }
  async function updateInternalBugId(bugId: number): Promise<string> {
    const internalBugId = (
      await db.query(
        db.format(
          `SELECT CONCAT(cp.base_bug_internal_id, bug.id) AS internal
          FROM wp_appq_evd_campaign cp
                   JOIN wp_appq_evd_bug bug ON cp.id = bug.campaign_id
          where bug.id = ?
         ;`,
          [bugId]
        )
      )
    )[0].internal;

    await db.query(
      db.format(
        `UPDATE wp_appq_evd_bug
          SET internal_id = ?
          WHERE id = ?          
         ;`,
        [internalBugId, bugId]
      )
    );
    return internalBugId;
  }
  async function createMediasBug(
    bugId: number,
    medias: BugMedia
  ): Promise<Media> {
    if (medias) {
      for (const media of medias) {
        await db.query(
          db.format(
            `INSERT INTO wp_appq_evd_bug_media 
          ( type, location, bug_id, uploaded )
          VALUES ( ?,?,?, NOW() )
           ;`,
            [media.type, media.url, bugId]
          )
        );
      }
    }
    const inserted = (
      await db.query(
        db.format(
          `SELECT media.location AS url
        FROM wp_appq_evd_bug bug
                 JOIN wp_appq_evd_bug_media media ON bug.id = media.bug_id
        WHERE bug.wp_user_id = ? AND bug.id = ?
         ;`,
          [req.user.ID, bugId]
        )
      )
    ).map((item: { url: string }) => item.url);
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
      await db.query(
        db.format(
          `
          INSERT INTO wp_appq_campaign_additional_fields_data (bug_id, type_id, value)
            VALUES (?, ?, ? ) ;`,
          [bugId, additional.id, additional.value]
        )
      );
    }
    const inserted: { value: string; slug: string }[] = await db.query(
      db.format(
        `
        SELECT  data.value, field.slug
        FROM wp_appq_campaign_additional_fields_data data
        JOIN wp_appq_campaign_additional_fields field ON field.id = data.type_id
        WHERE data.bug_id = ? ;`,
        [bugId]
      )
    );
    return inserted.map((item) => ({
      slug: item.slug,
      value: item.value,
    }));
  }
};
