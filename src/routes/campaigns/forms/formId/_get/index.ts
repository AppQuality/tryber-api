import UserRoute from "@src/features/routes/UserRoute";
import * as db from "@src/features/db";
/** OPENAPI-CLASS: get-campaigns-forms-formId */

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns-forms-formId"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-forms-formId"]["parameters"]["path"];
}> {
  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const { formId } = this.getParameters();
    this.setId(parseInt(formId));
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

    if ((await this.formExists()) === false) {
      this.setError(
        404,
        new Error(`Form ${this.getId()} doesn't exist`) as OpenapiError
      );
      return false;
    }
    return true;
  }

  private async formExists() {
    const sql = `SELECT id FROM wp_appq_campaign_preselection_form WHERE id = ? `;
    const results = await db.query(db.format(sql, [this.getId()]));
    return results.length !== 0;
  }

  protected async prepare() {
    try {
      const { name, fields, campaign } = await this.getForm();
      this.setSuccess(200, {
        id: this.getId(),
        name,
        fields,
        campaign,
      });
    } catch (e) {
      const error = e as OpenapiError;
      this.setError(error.status_code || 500, error);
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
      fields: await this.getFormFields(),
      campaign: await this.getFormCampaign(),
    };
  }

  private async getFormCampaign() {
    const sql = `SELECT cp.id,cp.title as name 
        FROM wp_appq_evd_campaign cp
        JOIN wp_appq_campaign_preselection_form form ON (cp.id = form.campaign_id)
        WHERE form.id = ?  
        LIMIT 1`;
    const results = await db.query(db.format(sql, [this.getId()]));

    if (results.length === 0) return undefined;

    const campaign = results.pop();
    return campaign;
  }

  private async getFormFields() {
    const sql = `SELECT id, type, question, options
        FROM wp_appq_campaign_preselection_form_fields
        WHERE form_id = ?`;
    const results: {
      id: number;
      type: string;
      question: string;
      options?: string;
    }[] = await db.query(db.format(sql, [this.getId()]));
    return results.map((item) => {
      return {
        ...item,
        options: isFieldTypeWithOptions(item.type)
          ? parseOptions(item.options || "")
          : undefined,
      };
    });

    function parseOptions(options: string) {
      const result = JSON.parse(options);
      if (result === "") return undefined;
      return result;
    }

    function isFieldTypeWithOptions(type: string) {
      return (
        ["select", "multiselect", "radio"].includes(type) ||
        type.match("^cuf_[0-9]*$")
      );
    }
  }
}
