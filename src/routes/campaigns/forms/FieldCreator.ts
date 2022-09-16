import * as db from "@src/features/db";

export default class FieldCreator {
  private formId: number;
  private type: string;
  private question: string;
  private short_name: string | undefined;
  private options: string | undefined;
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
    id,
    priority,
  }: {
    formId: number;
    question: string;
    short_name?: string;
    type: string;
    options?: string[] | number[];
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
    const columns = ["question", "type", "form_id", "priority"];
    const data = [this.question, this.type, this.formId, this.priority];
    if (this.options) {
      columns.push("options");
      data.push(this.options);
    }
    if (this.short_name) {
      columns.push("short_name");
      data.push(this.short_name);
    }
    if (this.id) {
      columns.push("id");
      data.push(this.id);
    }
    const sql = db.format(
      `INSERT INTO wp_appq_campaign_preselection_form_fields 
          (${columns.join(",")}) VALUES (${Array(data.length)
        .fill("?")
        .join(",")})`,
      data
    );
    const { insertId } = await db.query(sql);
    const result: {
      id: number;
      question: string;
      short_name?: string;
      options: string;
    }[] = await db.query(
      db.format(
        `SELECT id, question, options, short_name
            FROM wp_appq_campaign_preselection_form_fields 
            WHERE id = ? LIMIT 1`,
        [insertId]
      )
    );
    if (result.length === 0) throw new Error("Failed to create field");
    return {
      ...result[0],
      short_name: result[0].short_name ? result[0].short_name : undefined,
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
