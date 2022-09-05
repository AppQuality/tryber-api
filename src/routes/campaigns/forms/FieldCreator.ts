import * as db from "@src/features/db";

export default class FieldCreator {
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
