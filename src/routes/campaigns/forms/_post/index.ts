/** OPENAPI-CLASS: post-campaigns-forms */
import UserRoute from "@src/features/routes/UserRoute";
import * as db from "@src/features/db";
import FieldCreator from "../FieldCreator";
import { ConfigurationOptions } from "aws-sdk";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["post-campaigns-forms"]["responses"]["201"]["content"]["application/json"];
  body: StoplightOperations["post-campaigns-forms"]["requestBody"]["content"]["application/json"];
}> {
  protected async filter() {
    if ((await super.filter()) === false) return false;

    if (this.hasCapability("manage_preselection_forms") === false) {
      this.setError(
        403,
        new Error(`You are not authorized to do this`) as OpenapiError
      );
      return false;
    }
    return true;
  }

  protected async prepare() {
    try {
      const form = await this.createForm();
      const fields = await this.createFields(form.id);
      this.setSuccess(201, {
        ...form,
        fields,
      });
    } catch (e) {
      const error = e as OpenapiError;
      this.setError(error.status_code || 500, error);
    }
  }

  private async createForm() {
    const body = this.getBody();

    const columns = ["name"];
    const data: (number | string)[] = [body.name];
    if (body.campaign) {
      columns.push("campaign_id");
      data.push(body.campaign);
    }

    const result = await db.query(
      db.format(
        `INSERT INTO wp_appq_campaign_preselection_form
     ( ${columns.join(",")} ) 
     VALUES (${Array(columns.length).fill("?").join(",")})`,
        data
      )
    );
    return await this.getForm(result.insertId);
  }

  private async getForm(id: number) {
    const forms: { id: number; name: string; campaign_id: number }[] =
      await db.query(
        db.format(
          `SELECT id, name, campaign_id FROM wp_appq_campaign_preselection_form WHERE id = ? LIMIT 1`,
          [id]
        )
      );

    if (forms.length === 0) throw new Error("Failed to create form");
    const result = forms[0];

    return {
      id: result.id,
      name: result.name,
      campaign: result.campaign_id
        ? await getCampaign(result.campaign_id)
        : undefined,
    };

    async function getCampaign(campaign_id: number) {
      const result: { id: number; name: string }[] = await db.query(
        db.format(
          `SELECT id, title as name FROM wp_appq_evd_campaign WHERE id = ? `,
          [campaign_id]
        )
      );
      return result[0];
    }
  }

  private async createFields(formId: number) {
    const body = this.getBody();
    const results = [];
    let i = 1;
    for (const field of body.fields) {
      const item = new FieldCreator({
        formId: formId,
        question: field.question,
        type: field.type,
        options: field.hasOwnProperty("options") ? field.options : undefined,
        priority: i++,
      });
      try {
        results.push(await item.create());
      } catch (e) {
        throw {
          status_code: 406,
          message: (e as OpenapiError).message,
        };
      }
    }
    return results;
  }
}
