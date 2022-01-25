/** OPENAPI-ROUTE:put-users-me-additionals-fieldId */
import { Context } from "openapi-backend";

import * as db from "../../../../../../features/db";
import getAdditionalData from "../../../_get/getAdditionalData";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    let field;
    const fieldId =
      typeof c.request.params.fieldId === "string"
        ? c.request.params.fieldId
        : "0";

    try {
      field = await db.query(
        db.format(
          `SELECT id,name,allow_other,type 
                  FROM wp_appq_custom_user_field WHERE id = ? 
          AND enabled = 1`,
          [fieldId]
        )
      );
      if (!field.length) throw Error(`Can't find field with id ${fieldId}`);
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      throw Error(`Can't retrieve field with id ${fieldId}`);
    }

    try {
      await deleteCustomUserField(field[0], req.user.testerId);
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      throw e;
    }

    try {
      if (Array.isArray(req.body)) {
        if (field[0].type !== "multiselect")
          throw Error(`Can't add multiple data to ${field[0].name}`);
        for (const f of req.body) {
          await addCustomUserField(field[0], req.user.testerId, f);
        }
      } else if (typeof req.body === "object") {
        if (["select", "multiselect"].includes(field[0].type))
          await addCustomUserField(field[0], req.user.testerId, req.body);
        else
          await addCustomUserTextField(
            field[0],
            req.user.testerId,
            req.body.value
          );
      } else {
        throw Error(`Invalid custom user field type ${field[0].type}`);
      }
    } catch (e) {
      throw e;
    }

    try {
      const result = await getAdditionalData(req.user.ID, field[0].id);
      res.status_code = 200;
      return result.additional;
    } catch (e) {
      if ((e as OpenapiError).status_code === 404) {
        res.status_code = 404;
        if (field[0].type === "multiselect") {
          return [];
        } else {
          return {
            field_id: field[0].id,
            name: field[0].name,
            value: "",
            text: "",
          };
        }
      } else {
        throw e;
      }
    }
  } catch (error) {
    res.status_code = 404;
    return {
      element: "users",
      id: parseInt(req.user.ID),
      message: (error as OpenapiError).message,
    };
  }
};

const addCustomUserTextField = async (
  field: { id: string; name: string },
  testerId: number,
  data: any
) => {
  let sql = `INSERT INTO wp_appq_custom_user_field_data 
        (custom_user_field_id, value, profile_id) 
        VALUES (? , ? , ?)`;
  let sqlData = [field.id, data, testerId];

  try {
    const insertId = await db.query(db.format(sql, sqlData));
    return Promise.resolve(insertId);
  } catch (e) {
    if (process.env && process.env.DEBUG) console.log(e);
    throw Error(`Can't add ${data} to ${field.name}`);
  }
};

const addCustomUserField = async (
  field: { id: string; name: string; allow_other: boolean },
  testerId: number,
  data: any
) => {
  if (!data.value) return;
  if (data.is_candidate && !field.allow_other)
    throw Error(`Can't add candidate to ${field.name}`);
  if (!data.is_candidate) {
    let extraSql = `SELECT id
        FROM wp_appq_custom_user_field_extras
        WHERE custom_user_field_id = ? AND id = ?`;
    try {
      const extra = await db.query(db.format(extraSql, [field.id, data.value]));
      if (!extra.length)
        throw Error(`Invalid value ${data.value} for ${field.name}`);
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      throw Error(`Error finding value for ${field.name}`);
    }
  }
  let sql = `INSERT INTO wp_appq_custom_user_field_data 
        (custom_user_field_id, value, profile_id, candidate) 
        VALUES (? , ? , ?, ?)`;
  let sqlData = [field.id, data.value, testerId, data.is_candidate ? 1 : 0];

  try {
    const insertId = await db.query(db.format(sql, sqlData));
    return Promise.resolve(insertId);
  } catch (e) {
    if (process.env && process.env.DEBUG) console.log(e);
    throw Error(`Can't add ${JSON.stringify(data)} to ${field.name}`);
  }
};

const deleteCustomUserField = async (
  field: { id: string; name: string },
  testerId: number,
  retries: number = 0
): Promise<boolean> => {
  let sql = `DELETE FROM wp_appq_custom_user_field_data
        WHERE custom_user_field_id = ? AND profile_id = ?`;
  let sqlData = [field.id, testerId];
  try {
    await db.query(db.format(sql, sqlData));
    return Promise.resolve(true);
  } catch (e) {
    if ((e as MySqlError).code === "ER_LOCK_DEADLOCK" && retries < 20) {
      await setTimeout(() => {}, 200);
      return deleteCustomUserField(field, testerId, retries + 1);
    }
    if (process.env && process.env.DEBUG) console.log(e);
    throw Error(`Can't delete data from ${field.name}`);
  }
};
