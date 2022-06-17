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
  try {
    await campaignExists();
    const candidature = await getTesterCandidature();
    if (await campaignHasTasks()) await useCaseIsValid(candidature.group_id);
    await severityIsAcceptable();
    await replicabilityIsAcceptable();
    await bugTypeIsAcceptable();

    res.status_code = 200;
    return {}; //await createBug();
  } catch (error) {
    if (process.env && process.env.DEBUG)
      //console.log(error);
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
    let severities = (
      await db.query(
        db.format(
          `SELECT name
        FROM wp_appq_evd_severity sv
                 JOIN wp_appq_additional_bug_severities cpsv ON sv.id = cpsv.bug_severity_id
        WHERE campaign_id=?;
         ;`,
          [campaignId]
        )
      )
    ).map((severity: { name: string }) => severity.name);

    if (severities.length && !severities.includes(req.body.severity)) {
      throw {
        status_code: 403,
        message: `Severity ${req.body.severity} is not accepted from CP${campaignId}.`,
      };
    }
  }

  async function replicabilityIsAcceptable() {
    let replicabilities = (
      await db.query(
        db.format(
          `SELECT name FROM wp_appq_evd_bug_replicability rep
          JOIN wp_appq_additional_bug_replicabilities cprep ON rep.id = cprep.bug_replicability_id
         WHERE campaign_id=? ;
         ;`,
          [campaignId]
        )
      )
    ).map((replicability: { name: string }) =>
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
  }

  async function bugTypeIsAcceptable() {
    let bugTypes = (
      await db.query(
        db.format(
          `SELECT name FROM wp_appq_evd_bug_type bt
          JOIN wp_appq_additional_bug_types cpbt ON bt.id = cpbt.bug_type_id
         WHERE campaign_id=? AND  bt.is_enabled = 1
         ;`,
          [campaignId]
        )
      )
    ).map((bugType: { name: string }) => bugType.name.toUpperCase());

    if (bugTypes.length && !bugTypes.includes(req.body.type)) {
      throw {
        status_code: 403,
        message: `BugType ${req.body.type} is not accepted from CP${campaignId}.`,
      };
    }
  }
  async function campaignHasTasks() {
    let tasks = await db.query(
      db.format(
        `SELECT id
          FROM wp_appq_campaign_task
          WHERE campaign_id = ?
         ;`,
        [campaignId]
      )
    );
    return tasks.length;
  }
  async function useCaseIsValid(group_id: number) {
    let usecase = await db.query(
      db.format(
        `SELECT tsk.id AS id
          FROM wp_appq_campaign_task tsk
                   JOIN wp_appq_campaign_task_group tskgrp ON tskgrp.task_id = tsk.id
          WHERE tsk.campaign_id = ?
            AND (tskgrp.group_id = 0 || tskgrp.group_id = ?)
            AND tsk.id = ?
         ;`,
        [campaignId, group_id, req.body.usecase]
      )
    );
    if (!usecase.length) {
      throw {
        status_code: 403,
        message: `Usecase ${req.body.usecase} not found for CP${campaignId}.`,
      };
    }
  }
  // async function createBug() {
  //   let inserted = await db.query(
  //     db.format(
  //       `INSERT INTO table_name (message, campaign_id, status_id, wp_user_id, severity_id)
  //       VALUES ('hola', ?, 1, ...);
  //        ;`,
  //       [campaignId]
  //     )
  //   );
  //   if (inserted.affectedRows === 0) {
  //     throw {
  //       status_code: 403,
  //       message: `Error on uploading Bug`,
  //     };
  //   }
  //   return {
  //     id: inserted.id,
  //     testerId: req.user.testerId,
  //     title: req.body.title,
  //     status: req.body.status,
  //     description: req.body.description,
  //     expected: req.body.expected,
  //     current: req.body.current,
  //     severity: req.body.severity,
  //     replicability: req.body.replicability,
  //     type: req.body.type,
  //     notes: req.body.notes,
  //     usecase: req.body.usecase,
  //     //device: ??
  //     media: ["URL of media ?????"],
  //     //additional: ??
  //   };
  // }
};
