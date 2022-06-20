import * as db from "@src/features/db";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: post-users-me-campaigns-campaign-bugs */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  const params = c.request
    .params as StoplightOperations["post-users-me-campaigns-campaign-bugs"]["parameters"]["path"];
  const campaignId = parseInt(params.campaignId);
  let bug =
    {} as StoplightOperations["post-users-me-campaigns-campaign-bugs"]["responses"]["200"]["content"]["application/json"];
  try {
    await campaignExists();
    const candidature = await getTesterCandidature();
    const usecase = await usecaseIsValid(candidature.group_id);
    const severity = await severityIsAcceptable();
    const replicability = await replicabilityIsAcceptable();

    const bugtype = await bugTypeIsAcceptable();

    const insertedBugId = await createBug(
      usecase,
      severity.id,
      replicability.id,
      bugtype.id
    );
    const internalBugID = await updateInternalBugId(insertedBugId);
    bug = {
      id: insertedBugId,
      testerId: req.user.testerId,
      internalId: internalBugID,
      title: req.body.title,
      description: req.body.description,
      notes: req.body.notes,
      severity: req.body.severity,
      replicability: req.body.replicability,
      type: req.body.type,
      status: "PENDING",
      expected: req.body.expected,
      current: req.body.current,
      usecase: usecase.title,
      media: [],
    };

    res.status_code = 200;
    return bug;
  } catch (error) {
    if (process.env && process.env.DEBUG) console.log(error);
    res.status_code = (error as OpenapiError).status_code || 400;
    return {
      element: "bugs",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }

  return {};

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

  async function severityIsAcceptable() {
    let severities = await db.query(
      db.format(
        `SELECT sv.id as id, sv.name as name
        FROM wp_appq_evd_severity sv
                 JOIN wp_appq_additional_bug_severities cpsv ON sv.id = cpsv.bug_severity_id
        WHERE campaign_id=?;
         ;`,
        [campaignId]
      )
    );
    const severity = severities.find(
      (severity: { id: number; name: string }) =>
        severity.name === req.body.severity
    );
    severities = severities.map(
      (severity: { id: number; name: string }) => severity.name
    );

    if (severities.length && !severities.includes(req.body.severity)) {
      throw {
        status_code: 403,
        message: `Severity ${req.body.severity} is not accepted from CP${campaignId}.`,
      };
    }
    return severity;
  }

  async function replicabilityIsAcceptable() {
    let replicabilities = await db.query(
      db.format(
        `SELECT rep.id AS id, rep.name AS name FROM wp_appq_evd_bug_replicability rep
          JOIN wp_appq_additional_bug_replicabilities cprep ON rep.id = cprep.bug_replicability_id
         WHERE campaign_id=? ;
         ;`,
        [campaignId]
      )
    );
    const replicability = replicabilities.find(
      (replicability: { id: number; name: string }) =>
        replicability.name.toUpperCase() === req.body.replicability
    );
    replicabilities = replicabilities.map((replicability: { name: string }) =>
      replicability.name.toUpperCase()
    );
    if (
      replicabilities.length &&
      !replicabilities.includes(req.body.replicability)
    ) {
      throw {
        status_code: 403,
        message: `Replicability ${req.body.replicability} is not accepted from CP${campaignId}.`,
      };
    }
    return replicability;
  }

  async function bugTypeIsAcceptable() {
    let bugTypes = await db.query(
      db.format(
        `SELECT bt.id AS id, bt.name AS name FROM wp_appq_evd_bug_type bt
          JOIN wp_appq_additional_bug_types cpbt ON bt.id = cpbt.bug_type_id
         WHERE campaign_id=? AND  bt.is_enabled = 1
         ;`,
        [campaignId]
      )
    );
    const bugType = bugTypes.find(
      (bugType: { id: number; name: string }) =>
        bugType.name.toUpperCase() === req.body.type
    );
    bugTypes = bugTypes.map((bugType: { id: number; name: string }) =>
      bugType.name.toUpperCase()
    );

    if (bugTypes.length && !bugTypes.includes(req.body.type)) {
      throw {
        status_code: 403,
        message: `BugType ${req.body.type} is not accepted from CP${campaignId}.`,
      };
    }
    return bugType;
  }
  async function usecaseIsValid(
    group_id: number
  ): Promise<{ id: number; title: string }> {
    let usecase = { id: 0, title: "" };
    if (isNotSpecificUsecase()) {
      usecase = { id: -1, title: "Not a specific use case" };
    } else {
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
    }
    return usecase;
  }

  function isNotSpecificUsecase() {
    return req.body.usecase === -1;
  }

  function capitalize(str: string) {
    str = str.toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  async function createBug(
    usecase: { id: number; title: string },
    severityId: number,
    replicabilityId: number,
    bugTypeId: number
  ) {
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

  async function updateInternalBugId(bugId: number) {
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
};
