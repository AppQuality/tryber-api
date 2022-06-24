import * as db from "@src/features/db";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: get-users-me-campaigns-campaignId */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
): Promise<Result | ReturnErrorType> => {
  const params = c.request.params as PathParameters;
  const campaignId = parseInt(params.campaignId);
  try {
    await isCandidate();
  } catch {
    res.status_code = 404;
    return {
      id: campaignId,
      element: "campaigns",
      message: "You don't have access to a campaign with this id",
    };
  }

  let campaign;
  try {
    campaign = await getCampaign();
  } catch (err) {
    res.status_code = 500;
    return {
      id: campaignId,
      element: "campaigns",
      message: (err as OpenapiError).message,
    };
  }

  res.status_code = 200;
  return {
    id: campaign.id,
    title: campaign.title,
    minimumMedia: campaign.min_allowed_media,
    hasBugForm: campaign.campaign_type !== -1,
    bugSeverity: campaign.severities,
    bugReplicability: campaign.replicabilities,
    useCases: [],
    bugTypes: campaign.types,
    validFileExtensions: [],
  };

  async function getCampaign(): Promise<Campaign> {
    const campaignData = await db.query(
      db.format(
        `SELECT id,title,min_allowed_media,campaign_type FROM wp_appq_evd_campaign WHERE id = ?`,
        [campaignId]
      )
    );
    const campaign = campaignData[0];
    campaign.severities = await getAvailableSeverities();
    campaign.types = await getAvailableTypes();
    campaign.replicabilities = await getAvailableReplicabilities();
    return campaign;

    async function getAvailableSeverities() {
      const customSeverities = await getCustomSeverities();
      const severities = await getSeverities();
      if (!customSeverities.length) {
        return {
          valid: severities.map((s) => s.name),
          invalid: [],
        };
      }
      return {
        valid: severities
          .filter((s) => customSeverities.includes(s.id))
          .map((s) => s.name),
        invalid: severities
          .filter((s) => !customSeverities.includes(s.id))
          .map((s) => s.name),
      };

      async function getCustomSeverities(): Promise<number[]> {
        return (
          await db.query(
            db.format(
              `SELECT bug_severity_id FROM wp_appq_additional_bug_severities WHERE campaign_id = ?`,
              [campaign.id]
            )
          )
        ).map((s: { bug_severity_id: number }) => s.bug_severity_id);
      }

      async function getSeverities(): Promise<{ id: number; name: string }[]> {
        return (
          await db.query(`SELECT id,name FROM wp_appq_evd_severity `)
        ).map((s: typeof severities[0]) => ({
          ...s,
          name: s.name.toUpperCase(),
        }));
      }
    }

    async function getAvailableTypes() {
      const customTypes = await getCustomTypes();
      const types = await getTypes();
      if (!customTypes.length) {
        return {
          valid: types.map((s) => s.name),
          invalid: [],
        };
      }
      return {
        valid: types
          .filter((s) => customTypes.includes(s.id))
          .map((s) => s.name),
        invalid: types
          .filter((s) => !customTypes.includes(s.id))
          .map((s) => s.name),
      };

      async function getCustomTypes(): Promise<number[]> {
        return (
          await db.query(
            db.format(
              `SELECT bug_type_id FROM wp_appq_additional_bug_types WHERE campaign_id = ?`,
              [campaign.id]
            )
          )
        ).map((s: { bug_type_id: number }) => s.bug_type_id);
      }

      async function getTypes(): Promise<{ id: number; name: string }[]> {
        return (
          await db.query(`SELECT id,name FROM wp_appq_evd_bug_type `)
        ).map((s: typeof types[0]) => ({
          ...s,
          name: s.name.toUpperCase(),
        }));
      }
    }

    async function getAvailableReplicabilities() {
      const customReplicabilities = await getCustomReplicabilities();
      const replicabilities = await getReplicabilities();
      if (!customReplicabilities.length) {
        return {
          valid: replicabilities.map((s) => s.name),
          invalid: [],
        };
      }
      return {
        valid: replicabilities
          .filter((s) => customReplicabilities.includes(s.id))
          .map((s) => s.name),
        invalid: replicabilities
          .filter((s) => !customReplicabilities.includes(s.id))
          .map((s) => s.name),
      };

      async function getCustomReplicabilities(): Promise<number[]> {
        return (
          await db.query(
            db.format(
              `SELECT bug_replicability_id FROM wp_appq_additional_bug_replicabilities WHERE campaign_id = ?`,
              [campaign.id]
            )
          )
        ).map((s: { bug_replicability_id: number }) => s.bug_replicability_id);
      }

      async function getReplicabilities(): Promise<
        { id: number; name: string }[]
      > {
        return (
          await db.query(`SELECT id,name FROM wp_appq_evd_bug_replicability `)
        ).map((s: typeof replicabilities[0]) => ({
          ...s,
          name: s.name.toUpperCase(),
        }));
      }
    }
  }

  async function isCandidate() {
    const candidature = await db.query(
      db.format(
        "SELECT * FROM wp_crowd_appq_has_candidate WHERE user_id = ? AND campaign_id = ?",
        [req.user.ID, campaignId]
      )
    );
    if (candidature.length === 0)
      throw Error("You are not selected for this campaign");
  }
};

type Campaign = {
  id: number;
  title: string;
  min_allowed_media: number;
  campaign_type: -1 | 0 | 1;
  severities: { valid: string[]; invalid: string[] };
  types: { valid: string[]; invalid: string[] };
};
