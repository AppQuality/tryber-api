import { tryber } from "@src/features/database";
import * as db from "@src/features/db";

export default class FieldCreator {
  private formId: number;
  private type: string;
  private question: string;
  private short_name: string | undefined;
  private options: string | undefined;
  private invalid_options: string | undefined;
  private id: number | undefined;
  private priority: number;

  private VALID_CUSTOM_TYPES = ["text", "select", "multiselect", "radio"];
  private VALID_PROFILE_TYPES = ["gender", "address", "phone_number"];
  private VALID_TYPES = [
    ...this.VALID_CUSTOM_TYPES,
    ...this.VALID_PROFILE_TYPES,
  ];

  constructor({
    formId,
    question,
    short_name,
    type,
    options,
    invalid_options,
    id,
    priority,
  }: {
    formId: number;
    question: string;
    short_name?: string;
    type: string;
    options?: (string | number)[];
    invalid_options?: (string | number)[];
    id?: number;
    priority: number;
  }) {
    this.type = type;
    if (!this.isTypeValid()) {
      throw new Error(`Invalid type ${type}`);
    }
    this.formId = formId;
    this.question = question;
    this.short_name = short_name;
    this.options = options ? JSON.stringify(options) : undefined;
    this.invalid_options = options
      ? JSON.stringify(invalid_options)
      : undefined;
    this.id = id;
    this.priority = priority;
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

    const fields = await tryber.tables.WpAppqCampaignPreselectionFormFields.do()
      .insert({
        question: this.question,
        type: this.type,
        form_id: this.formId,
        priority: this.priority,
        ...(this.options ? { options: this.options } : {}),
        ...(this.invalid_options
          ? { invalid_options: this.invalid_options }
          : {}),
        ...(this.short_name ? { short_name: this.short_name } : {}),
        ...(this.id ? { id: this.id } : {}),
      })
      .returning("id");

    const insertId = fields[0].id ?? fields[0];
    const result = await tryber.tables.WpAppqCampaignPreselectionFormFields.do()
      .select("id", "question", "options", "short_name")
      .where({ id: insertId })
      .first();

    if (!result) throw new Error("Failed to create field");
    return {
      ...result,
      short_name: result.short_name ? result.short_name : undefined,
      options: result.options ? JSON.parse(result.options) : undefined,
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
