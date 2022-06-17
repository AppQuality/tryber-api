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
    const usecase = await useCaseIsValid(candidature.group_id);
    await severityIsAcceptable();
    await replicabilityIsAcceptable();
    await bugTypeIsAcceptable();

    res.status_code = 200;
    const insertedBug = await createBug(usecase);
    await updateInternalBugId(insertedBug.id);
    return {
      id: insertedBug.id,
      testerId: 1,
      title: "Camapign Title",
      description: "Camapign Description",
      status: "PENDING",
      expected: "The expected to reproduce the bug",
      current: "Current case",
      severity: "LOW",
      replicability: "ONCE",
      type: "CRASH",
      notes: "The bug notes",
      usecase: "1",
      device: {
        id: 0,
        type: "DESKTOP",
        device: { pc_type: "WINDOWS" },
        operating_system: { id: 0, platform: "", version: "" },
      },
      media: ["the media1 url"],
    };
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
  async function useCaseIsValid(
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
  async function getSeverityIdFromName(): Promise<number> {
    const severity = await db.query(
      db.format(
        `SELECT id
        FROM wp_appq_evd_severity
        WHERE name = ?        
        ;`,
        [req.body.severity]
      )
    );
    if (!severity.length) {
      throw {
        status_code: 403,
        message: `Severity ${req.body.severity} not found.`,
      };
    }
    return severity[0].id;
  }
  async function getReplicabilityIdFromName(): Promise<number> {
    const replicability = await db.query(
      db.format(
        `SELECT id
        FROM wp_appq_evd_bug_replicability
        WHERE name = ?     
        ;`,
        [req.body.replicability]
      )
    );
    if (!replicability.length) {
      throw {
        status_code: 403,
        message: `Replicability ${req.body.replicability} not found.`,
      };
    }
    return replicability[0].id;
  }
  async function getBugTypeIdFromName(): Promise<number> {
    const type = await db.query(
      db.format(
        `SELECT id
        FROM wp_appq_evd_bug_type
        WHERE name = ?           
        ;`,
        [req.body.type]
      )
    );
    if (!type.length) {
      throw {
        status_code: 403,
        message: `Type ${req.body.type} not found.`,
      };
    }
    return type[0].id;
  }
  async function createBug(usecase: { id: number; title: string }) {
    const severityId = await getSeverityIdFromName();
    const replicabilityId = await getReplicabilityIdFromName();
    const bugTypeId = await getBugTypeIdFromName();
    const device = await getUserDevice();
    let inserted = await db.query(
      db.format(
        `INSERT INTO wp_appq_evd_bug (
          wp_user_id,
          message,
          description,
          expected_result,
          current_result,
          campaign_id,

          status_id,
          publish,
          status_reason,

          severity_id,

          created,
          updated,

          bug_replicability_id,
          bug_type_id,
          application_section,
          application_section_id,
          note,
          dev_id,
          manufacturer,
          model,
          os,
          os_version,

          version_id,
          reviewer,
          is_perfect,
          last_editor_id,
        )
        VALUES (
          ?,?,?,?,?,?,
          3,1,"Bug under review.",
          ?,
          NOW(),NULL,
          ?,?,?,?,?,?,?,?,?,?,
          -1,0,1,0,)
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
          req.body.note,
          device.id,
          device.manufacturer,
          device.model,
          device.os,
          device.os_version,
        ]
      )
    );
    if (inserted.affectedRows === 0) {
      throw {
        status_code: 403,
        message: `Error on uploading Bug`,
      };
    }
    return {
      id: inserted.id,
      testerId: req.user.testerId,
      title: req.body.title,
      status: req.body.status,
      description: req.body.description,
      expected: req.body.expected,
      current: req.body.current,
      severity: req.body.severity,
      replicability: req.body.replicability,
      type: req.body.type,
      notes: req.body.notes,
      usecase: req.body.usecase,
      //device: ??
      media: req.body.media,
      //additional: ??
    };
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
  }
};
