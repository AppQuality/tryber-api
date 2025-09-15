/** OPENAPI-CLASS: put-campaigns-campaign-payouts */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";
export default class PutCampaignPayoutData extends CampaignRoute<{
  response: StoplightOperations["put-campaigns-campaign-payouts"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["put-campaigns-campaign-payouts"]["parameters"]["path"];
  body: StoplightOperations["put-campaigns-campaign-payouts"]["requestBody"]["content"]["application/json"];
}> {
  private cpMetaPayoutDataKeys = [
    "campaign_complete_bonus_eur",
    "critical_bug_payout",
    "high_bug_payout",
    "low_bug_payout",
    "medium_bug_payout",
    "minimum_bugs",
    "payout_limit",
    "percent_usecases",
    "point_multiplier_critical",
    "point_multiplier_high",
    "point_multiplier_low",
    "point_multiplier_medium",
    "point_multiplier_perfect",
    "point_multiplier_refused",
    "top_tester_bonus",
  ] as const;

  private cpPointsKey = "campaign_pts" as const;

  private updateMeta: Partial<
    Record<
      typeof this.cpMetaPayoutDataKeys[number] | typeof this.cpPointsKey,
      number
    >
  > = {};

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);

    const body = this.getBody();

    this.cpMetaPayoutDataKeys.forEach((key) => {
      if (body[key] !== undefined) {
        this.updateMeta[key] = body[key];
      }
    });
    if (body[this.cpPointsKey] !== undefined) {
      this.updateMeta[this.cpPointsKey] = body[this.cpPointsKey];
    }
  }

  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    if (!this.isPayoutDataValid()) {
      return false;
    }

    if (!this.hasAccessToCampaign(this.cp_id)) {
      this.setError(403, new OpenapiError("Access denied"));
      return false;
    }

    return true;
  }

  protected async prepare(): Promise<void> {
    await this.updatePayoutData();
    return this.setSuccess(200, {
      message: "Payout data updated successfully",
      ...this.getBody(),
    });
  }

  private async updatePayoutData() {
    const existingKeys = await tryber.tables.WpAppqCpMeta.do()
      .select(["meta_key"])
      .where({ campaign_id: this.cp_id })
      .then((rows) => rows.map((row) => row.meta_key));

    const toInsert = Object.entries(this.updateMeta)
      .filter(([key, value]) => !existingKeys.includes(key))
      .map(([key, value]) => {
        return {
          meta_key: key,
          meta_value: String(value),
        };
      })
      .filter((row) => row.meta_key !== this.cpPointsKey);

    if (toInsert.length > 0) {
      await tryber.tables.WpAppqCpMeta.do().insert(
        toInsert.map((row) => ({
          campaign_id: this.cp_id,
          meta_key: row.meta_key,
          meta_value: row.meta_value,
        }))
      );
    }

    const toUpdate = Object.entries(this.updateMeta)
      .filter(([key, value]) => existingKeys.includes(key))
      .map(([key, value]) => {
        return {
          meta_key: key,
          meta_value: String(value),
        };
      })
      .filter((row) => row.meta_key !== this.cpPointsKey);
    for (const row of toUpdate) {
      await tryber.tables.WpAppqCpMeta.do()
        .update({ meta_value: row.meta_value })
        .where({ campaign_id: this.cp_id, meta_key: row.meta_key });
    }

    if (this.updateMeta[this.cpPointsKey]) {
      await tryber.tables.WpAppqEvdCampaign.do()
        .update({ campaign_pts: this.updateMeta[this.cpPointsKey] })
        .where({ id: this.cp_id });
    }
  }

  private isPayoutDataValid(): boolean {
    const body = this.getBody();

    // check if body is empty
    if (Object.keys(body).length === 0) {
      this.setError(403, new OpenapiError("Empty request. Nothing to update"));
      return false;
    }

    // check if body contains invalid values
    if (
      Object.keys(body).some(
        (key) =>
          !this.cpMetaPayoutDataKeys.includes(key as any) &&
          key !== this.cpPointsKey
      )
    ) {
      this.setError(403, new OpenapiError("Invalid keys in body"));
      return false;
    }

    return true;
  }
}
