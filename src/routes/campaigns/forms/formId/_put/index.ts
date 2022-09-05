/** OPENAPI-CLASS: put-campaigns-forms-formId */
import UserRoute from "@src/features/routes/UserRoute";
import FieldCreator from "../../FieldCreator";
import * as db from "@src/features/db";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["put-campaigns-forms-formId"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["put-campaigns-forms-formId"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["put-campaigns-forms-formId"]["parameters"]["path"];
}> {
  private campaignId: number | undefined;
  protected async init() {
    const { formId } = this.getParameters();
    this.setId(parseInt(formId));

    if ((await this.formExists()) === false) {
      this.setError(
        404,
        new Error(`Form ${this.getId()} doesn't exist`) as OpenapiError
      );
      throw new Error("Form doesn't exist");
    }

    const sql = `SELECT campaign_id FROM wp_appq_campaign_preselection_form WHERE id = ? `;
    const results = await db.query(db.format(sql, [this.getId()]));
    this.campaignId = results[0].campaign_id
      ? results[0].campaign_id
      : undefined;
  }

  private async formExists() {
    const sql = `SELECT id FROM wp_appq_campaign_preselection_form WHERE id = ? `;
    const results = await db.query(db.format(sql, [this.getId()]));
    return results.length !== 0;
  }

  protected async filter() {
    if ((await super.filter()) === false) return false;

    if (this.hasCapability("manage_preselection_forms") === false) {
      this.setError(
        403,
        new Error(`You are not authorized to do this`) as OpenapiError
      );
      return false;
    }
    if (this.campaignId && !this.hasAccessToCampaign(this.campaignId)) {
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
      await this.editForm();
      await this.editFields();
      const form = await this.getForm();
      this.setSuccess(200, {
        ...form,
        id: this.getId(),
        fields: [],
      });
    } catch (e) {
      const error = e as OpenapiError;
      this.setError(error.status_code || 500, error);
    }
  }

  private async editForm() {
    const { name } = this.getBody();
    const sql = `UPDATE wp_appq_campaign_preselection_form SET name = ? WHERE id = ?`;
    await db.query(db.format(sql, [name, this.getId()]));
  }

  private async editFields() {
    const { fields } = this.getBody();
    for (const field of fields) {
      if (!field.id) {
        const fieldCreator = new FieldCreator({
          ...field,
          formId: this.getId(),
        });
        await fieldCreator.create();
      } else {
        await this.editField(field);
      }
    }
  }

  private async getForm() {
    const sql = `SELECT name 
        FROM wp_appq_campaign_preselection_form 
        WHERE id = ?  
        LIMIT 1`;
    const results: { name: string }[] = await db.query(
      db.format(sql, [this.getId()])
    );
    const form = results.pop();
    if (!form) throw new Error("Can't find the form");
    return {
      name: form?.name,
      fields: [],
    };
  }

  private async editField(
    field: ReturnType<RouteItem["getBody"]>["fields"][0] & { id: number }
  ) {
    const fieldsToUpdate = ["question", "type"];
    const data = [field.question, field.type];
    if (field.hasOwnProperty("options")) {
      fieldsToUpdate.push("options");
      data.push(JSON.stringify(field.options));
    }
    const sql = `UPDATE wp_appq_campaign_preselection_form_fields
          SET ${fieldsToUpdate.map((field) => `${field} = ?`).join(", ")}
          WHERE id = ?`;
    await db.query(db.format(sql, [...data, field.id]));
  }
}
