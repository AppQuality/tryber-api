import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import getMimetypeFromS3 from "@src/features/getMimetypeFromS3";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: post-users-me-campaigns-campaign-bugs */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
): Promise<Bug | CreateBugError> => {
  const params = c.request.params as RequestParams;
  const campaignId = parseInt(params.campaignId);

  let candidature, usecase, severity, replicability, bugtype, media: BugMedia;
  try {
    await campaignExists();
    candidature = await getTesterCandidature();
    usecase = await usecaseIsValid(candidature.group_id);
    severity = await getSeverity();
    replicability = await getReplicability();
    bugtype = await getBugType();
    media = await getMediaData();
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
    //
    insertedBugId = await createBug(
      usecase,
      severity.id,
      replicability.id,
      bugtype.id
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

  let insertedMedia: Media;
  try {
    if (req.body.media)
      insertedMedia = await createMediasBug(insertedBugId, media);
  } catch (error) {
    debugMessage(error);
    res.status_code = 500;
    return {
      element: "bugs",
      id: 0,
      message: "Error on insert media",
    };
  }

  res.status_code = 200;
  return {
    id: insertedBugId,
    testerId: req.user.testerId,
    internalId: internalBugID,
    title: req.body.title,
    description: req.body.description,
    notes: req.body.notes,
    severity: severity.name,
    replicability: req.body.replicability,
    type: req.body.type,
    status: "PENDING",
    expected: req.body.expected,
    current: req.body.current,
    usecase: usecase.title,
    media: insertedMedia,
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
        `SELECT * FROM wp_crowd_appq_has_candidate WHERE user_id=? AND campaign_id=? ;`,
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
      result[0].selected_device !== "0" &&
      result[0].selected_device !== req.body.device
    ) {
      throw {
        status_code: 403,
        message: `Device is not candidate on CP${campaignId}.`,
      };
    }
    return result[0];
  }
  function capitalize(str: string) {
    str = str.toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async function getSeverity() {
    const severities = await getSeverities();
    const result = severities.find((item) => item.name === req.body.severity);
    if (result) return result;
    throw {
      status_code: 403,
      message: `Severity ${req.body.severity} is not accepted from CP${campaignId}.`,
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
      (item) => item.name === req.body.replicability
    );
    if (result) return result;
    throw {
      status_code: 403,
      message: `Replicability ${req.body.replicability} is not accepted from CP${campaignId}.`,
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
    const result = bugtypes.find((item) => item.name === req.body.type);
    if (result) return result;
    throw {
      status_code: 403,
      message: `BugType ${req.body.type} is not accepted from CP${campaignId}.`,
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
    if (req.body.media) {
      media = [];
      for (const url of req.body.media) {
        const type = await getMimetypeFromS3({ url });
        if (type) media.push({ url: url, type: type });
      }
    }
    return media;
  }

  //TODO: refactor usecase
  async function usecaseIsValid(
    group_id: number
  ): Promise<{ id: number; title: string }> {
    let usecase = { id: 0, title: "" };
    if (isNotSpecificUsecase())
      return { id: -1, title: "Not a specific use case" };

    let usecases = await db.query(
      db.format(
        `SELECT tsk.id AS id, tsk.title AS title
          FROM wp_appq_campaign_task tsk
                   JOIN wp_appq_campaign_task_group tskgrp ON tskgrp.task_id = tsk.id
          WHERE tsk.campaign_id = ?
            AND (tskgrp.group_id = 0 || tskgrp.group_id = ?)
            AND tsk.id = ?
         ;`,
        [campaignId, group_id, req.body.usecase]
      )
    );
    if (!usecases.length) {
      throw {
        status_code: 403,
        message: `Usecase ${req.body.usecase} not found for CP${campaignId}.`,
      };
    }
    usecase = usecases[0];

    return usecase;

    function isNotSpecificUsecase() {
      return req.body.usecase === -1;
    }
  }

  async function createBug(
    usecase: { id: number; title: string },
    severityId: number,
    replicabilityId: number,
    bugTypeId: number
  ): Promise<number> {
    let inserted = await db.query(
      db.format(
        `INSERT INTO wp_appq_evd_bug (
          wp_user_id, message, description, expected_result, current_result, campaign_id,
          status_id, publish, status_reason, severity_id, created,
          bug_replicability_id, bug_type_id, application_section, application_section_id,
          note
             )
        VALUES (
          ?,?,?,?,?,?,3,1,"Bug under review.",?,NOW(),?,?,?,?,?
          )
         ;`,
        [
          req.user.ID,
          req.body.title,
          req.body.description,
          req.body.expected,
          req.body.current,
          campaignId,

          severityId,
          replicabilityId,
          bugTypeId,
          usecase.title,
          usecase.id,
          req.body.notes,
        ]
      )
    );
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
    return inserted.length ? inserted : undefined;
  }
};
