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
    await testerIsCandidate();
    await severityIsAcceptable();
    await replicabilityIsAcceptable();

    res.statusCode = 200;
    return {};
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

  async function testerIsCandidate() {
    const result = await db.query(
      db.format(
        `SELECT campaign_id FROM wp_crowd_appq_has_candidate WHERE user_id=? AND campaign_id=? ;`,
        [req.user.ID, campaignId]
      )
    );
    if (!result.length) {
      throw {
        status_code: 403,
        message: `T${req.user.testerId} is not candidate on CP${campaignId}.`,
      };
    }
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
};
