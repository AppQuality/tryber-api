/** OPENAPI-CLASS: put-campaigns-campaign-payout_data */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";
export default class PutCampaignPayoutData extends CampaignRoute<{
  response: StoplightOperations["put-campaigns-campaign-payout_data"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["put-campaigns-campaign-payout_data"]["parameters"]["path"];
  body: StoplightOperations["put-campaigns-campaign-payout_data"]["requestBody"]["content"]["application/json"];
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
    return this.setSuccess(200, {
      message: "Payout data updated successfully",
      ...(await this.updatePayoutData()),
    });
  }

  private async updatePayoutData(): Promise<{
    [key: string]: string | number | undefined;
  }> {
    const body = this.getBody();

    // retrieve from db all existing meta_keys for this campaign
    // then decide if we need to insert or update each key
    const existingMeta = await tryber.tables.WpAppqCpMeta.do()
      .select(["meta_key", "meta_value"])
      .where({ campaign_id: this.cp_id });

    const existingMetaMap: { [key: string]: string } = {};
    existingMeta.forEach((meta) => {
      existingMetaMap[meta.meta_key] = meta.meta_value;
    });

    const rowsToInsert: Array<{
      campaign_id: number;
      meta_key: string;
      meta_value: string;
    }> = [];
    const rowsToUpdate: Array<{
      campaign_id: number;
      meta_key: string;
      meta_value: string;
    }> = [];
    const response: { [key: string]: string | number | undefined } = {};

    this.cpMetaPayoutDataKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        const newMetaValue = String(body[key]);
        if (existingMetaMap[key] !== undefined) {
          // Key exists, prepare for update if value is different
          if (existingMetaMap[key] !== newMetaValue) {
            rowsToUpdate.push({
              meta_value: newMetaValue,
              campaign_id: this.cp_id,
              meta_key: key,
            });
          }
        } else {
          // Key does not exist, prepare for insert
          rowsToInsert.push({
            campaign_id: this.cp_id,
            meta_key: key,
            meta_value: newMetaValue,
          });
        }
        response[key] = body[key];
      }
    });

    // Perform inserts
    if (rowsToInsert.length > 0) {
      try {
        await tryber.tables.WpAppqCpMeta.do().insert(rowsToInsert);
      } catch (error) {
        console.error("Error inserting payout data:", error);
      }
    }

    // Perform updates
    for (const row of rowsToUpdate) {
      try {
        await tryber.tables.WpAppqCpMeta.do()
          .update({ meta_value: row.meta_value })
          .where({ campaign_id: row.campaign_id, meta_key: row.meta_key });
      } catch (error) {
        console.error("Error updating payout data:", error);
      }
    }

    // update campaign points if campaign_pts is present in body
    if (Object.prototype.hasOwnProperty.call(body, this.cpPointsKey)) {
      try {
        await tryber.tables.WpAppqEvdCampaign.do()
          .update({ campaign_pts: body.campaign_pts })
          .where({ id: this.cp_id });
        response[this.cpPointsKey] = body.campaign_pts;
      } catch (error) {
        console.error("Error updating campaign points:", error);
      }
    }
    return response;
  }

  private isPayoutDataValid(): boolean {
    const body = this.getBody();

    // check if body is an object and defined
    if (
      !body ||
      body === null ||
      body === undefined ||
      typeof body !== "object"
    ) {
      this.setError(403, new OpenapiError("Invalid body"));
      return false;
    }

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
