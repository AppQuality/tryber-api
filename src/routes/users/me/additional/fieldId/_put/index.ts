import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

/** OPENAPI-CLASS:put-users-me-additionals-fieldId */

export default class Route extends UserRoute<{
  response: StoplightOperations["put-users-me-additionals-fieldId"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["put-users-me-additionals-fieldId"]["parameters"]["path"];
  body: StoplightOperations["put-users-me-additionals-fieldId"]["requestBody"]["content"]["application/json"];
}> {
  private fieldId: number;
  private _field:
    | {
        id: number;
        name: string;
        type: "multiselect" | "select" | "text";
        allow_other: boolean;
      }
    | undefined;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.fieldId = Number(this.getParameters().fieldId as unknown as string);
  }

  protected async init() {
    await super.init();
    await this.shouldFailIfFieldDoesntExist();
  }

  private async shouldFailIfFieldDoesntExist() {
    try {
      const field = await this.getField();
      if (["multiselect", "select", "text"].includes(field.type) === false) {
        throw new OpenapiError(`Invalid field type ${field.type}`);
      }
      this._field = field;
    } catch (e) {
      this.setError(404, e as OpenapiError);
      throw e;
    }
  }

  private async getField() {
    try {
      const { ...field } = await tryber.tables.WpAppqCustomUserField.do()
        .select("id", "name", "allow_other", "type")
        .where("id", this.fieldId)
        .andWhere("enabled", 1)
        .first();
      if (!field) throw Error(`Can't find field with id ${this.fieldId}`);

      const isValidType = (f: {
        type: string;
      }): f is { type: "multiselect" | "select" | "text" } =>
        ["multiselect", "select", "text"].includes(f.type);

      if (!isValidType(field)) {
        throw new OpenapiError(`Invalid field type ${field.type}`);
      }
      return { ...field, allow_other: Boolean(field.allow_other) };
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      throw Error(`Can't retrieve field with id ${this.fieldId}`);
    }
  }

  get field() {
    if (typeof this._field === "undefined") throw new Error("Not initialized");
    return this._field;
  }

  protected async prepare(): Promise<void> {
    if (this.field.type === "multiselect") {
      await this.addMultiselect();
      return this.setSuccess(200, []);
    }

    if (this.field.type === "select") {
      await this.addSelect();
      return this.setSuccess(200, []);
    }

    await this.addText();
    return this.setSuccess(200, []);
  }

  private async addMultiselect() {
    const body = this.getBody();
    const bodyList = Array.isArray(body) ? body : [body];

    const oldValues = await tryber.tables.WpAppqCustomUserFieldData.do()
      .select("id", "value", "candidate")
      .where("custom_user_field_id", this.field.id)
      .andWhere("profile_id", this.getTesterId());
    const remainingList = bodyList.filter(
      (b) => !oldValues.find((o) => o.value === b.value)
    );
    const valueToDel = oldValues.filter(
      (o) => !bodyList.find((b) => b.value === o.value)
    );

    await tryber.tables.WpAppqCustomUserFieldData.do()
      .delete()
      .whereIn(
        "id",
        valueToDel.map((v) => v.id)
      );

    for (const f of remainingList) {
      await this.addCustomUserField(f);
    }
  }

  private async addSelect() {
    const body = this.getBody();
    if (Array.isArray(body)) {
      throw new OpenapiError("Can't add multiple values to select field");
    }

    if (body.value === "") {
      await tryber.tables.WpAppqCustomUserFieldData.do()
        .delete()
        .where("custom_user_field_id", this.field.id)
        .andWhere("profile_id", this.getTesterId());
      return;
    }
    const oldValue = await tryber.tables.WpAppqCustomUserFieldData.do()
      .select("id")
      .where("custom_user_field_id", this.field.id)
      .andWhere("profile_id", this.getTesterId())
      .first();
    if (oldValue) {
      await tryber.tables.WpAppqCustomUserFieldData.do()
        .update({ value: body.value })
        .where("id", oldValue.id);
    } else {
      await this.addCustomUserField(body);
    }
  }

  private async addText() {
    const body = this.getBody();
    if (Array.isArray(body)) {
      throw new OpenapiError("Can't add multiple values to select field");
    }
    // update
    await this.addCustomUserTextField(body.value);
  }

  private async addCustomUserTextField(data: string) {
    try {
      const oldValue = await tryber.tables.WpAppqCustomUserFieldData.do()
        .select("id")
        .where("custom_user_field_id", this.field.id)
        .andWhere("profile_id", this.getTesterId())
        .first();
      if (oldValue) {
        await tryber.tables.WpAppqCustomUserFieldData.do()
          .update({ value: data })
          .where("id", oldValue.id);
        return oldValue.id;
      } else {
        const result = await tryber.tables.WpAppqCustomUserFieldData.do()
          .insert({
            custom_user_field_id: this.field.id,
            value: data,
            profile_id: this.getTesterId(),
            candidate: 0,
          })
          .returning("id");
        return result[0].id ?? result[0];
      }
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      throw Error(`Can't add ${data} to ${this.field.name}`);
    }
  }

  private async addCustomUserField(data: {
    value: string;
    is_candidate?: boolean;
  }) {
    if (data.is_candidate && !this.field.allow_other)
      throw Error(`Can't add candidate to ${this.field.name}`);
    if (!data.is_candidate) {
      try {
        const extra = await tryber.tables.WpAppqCustomUserFieldExtras.do()
          .select("id")
          .where("custom_user_field_id", this.field.id)
          .andWhere("id", data.value);
        if (!extra.length)
          throw Error(`Invalid value ${data.value} for ${this.field.name}`);
      } catch (e) {
        if (process.env && process.env.DEBUG) console.log(e);
        throw Error(`Error finding value for ${this.field.name}`);
      }
    }

    try {
      const result = await tryber.tables.WpAppqCustomUserFieldData.do()
        .insert({
          custom_user_field_id: this.field.id,
          value: data.value,
          profile_id: this.getTesterId(),
          candidate: data.is_candidate ? 1 : 0,
        })
        .returning("id");
      return result[0].id ?? result[0];
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      throw Error(`Can't add ${JSON.stringify(data)} to ${this.field.name}`);
    }
  }
}
