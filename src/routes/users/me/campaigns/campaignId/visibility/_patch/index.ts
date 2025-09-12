/** OPENAPI-CLASS: patch-campaigns-campaignId-visibility */

import Campaign from "@src/features/class/Campaign";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";
import { request } from "express";

export default class PatchCampaignVisibility extends UserRoute<{
  response: StoplightOperations["patch-campaigns-campaignId-visibility"]["responses"]["200"];
  body: StoplightOperations["patch-campaigns-campaignId-visibility"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["patch-campaigns-campaignId-visibility"]["parameters"]["path"];
}> {
  private _campaign: Campaign | null = null;

  protected async init(): Promise<void> {
    await super.init();

    console.log(typeof this.getBody());
    console.log(this.getBody());

    this._campaign = new Campaign(Number(this.getParameters().campaignId));
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (this.isNotAdmin()) return false;

    return true;
  }

  protected async prepare() {
    this.setSuccess(200, {});
  }
}
