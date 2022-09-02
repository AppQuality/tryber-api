/** OPENAPI-CLASS: post-campaigns-forms */
import UserRoute from "@src/features/routes/UserRoute";
import * as db from "@src/features/db";

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
      const fields = await this.createFields();
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
    const { insertId } = await db.query(
      db.format(
        `INSERT INTO wp_appq_campaign_preselection_form (name) VALUES (?)`,
        [body.name]
      )
    );

    const result: { id: number; name: string }[] = await db.query(
      db.format(
        `SELECT id, name FROM wp_appq_campaign_preselection_form WHERE id = ? LIMIT 1`,
        [insertId]
      )
    );

    if (result.length === 0) throw new Error("Failed to create form");

    return result[0];
  }

  private async createFields() {
    const body = this.getBody();
    const results = [];
    for (const field of body.fields) {
      const item = new FieldCreator({
        question: field.question,
        type: field.type,
        options: field.hasOwnProperty("options") ? field.options : undefined,
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

class FieldCreator {
  private type: string;
  private question: string;
  private options: string | undefined;

  private VALID_CUSTOM_TYPES = ["text", "select", "multiselect", "radio"];
  private VALID_PROFILE_TYPES = ["gender", "address", "phone_number"];
  private VALID_TYPES = [
    ...this.VALID_CUSTOM_TYPES,
    ...this.VALID_PROFILE_TYPES,
  ];

  constructor({
    question,
    type,
    options,
  }: {
    question: string;
    type: string;
    options?: string[] | number[];
  }) {
    this.type = type;
    if (!this.isTypeValid()) {
      throw new Error(`Invalid type ${type}`);
    }
    this.question = question;
    this.options = options ? JSON.stringify(options) : undefined;
  }

  private isTypeValid() {
    return this.VALID_TYPES.includes(this.type) || this.isCufField();
  }

  private isCufField() {
    return this.type.startsWith("cuf_");
  }

  public async create() {
    if (this.isCufField() && !(await this.isCufFieldValid())) {
      throw new Error(
        `{"id": ${this.type.split("_")[1]}, "error": "Invalid cuf field"}`
      );
    }
    const fields = ["question", "type"];
    const data = [this.question, this.type];
    if (this.options) {
      fields.push("options");
      data.push(this.options);
    }
    const sql = db.format(
      `INSERT INTO wp_appq_campaign_preselection_form_fields 
        (${fields.join(",")}) VALUES (${Array(data.length)
        .fill("?")
        .join(",")})`,
      data
    );
    const { insertId } = await db.query(sql);

    const result: { id: number; question: string; options: string }[] =
      await db.query(
        db.format(
          `SELECT id, question,options 
          FROM wp_appq_campaign_preselection_form_fields 
          WHERE id = ? LIMIT 1`,
          [insertId]
        )
      );
    if (result.length === 0) throw new Error("Failed to create field");
    return {
      ...result[0],
      options: result[0].options ? JSON.parse(result[0].options) : undefined,
      type: this.type,
    };
  }

  public async isCufFieldValid() {
    const result = await db.query(
      db.format(
        `SELECT id FROM wp_appq_custom_user_field 
        WHERE id = ? LIMIT 1`,
        [this.type.split("_")[1]]
      )
    );
    return result.length > 0;
  }
}
