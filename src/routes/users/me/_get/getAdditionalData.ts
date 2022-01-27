import * as db from "../../../../features/db";

export default async (id: string, fieldId: false | string = false) => {
  let sql = `SELECT cud.id, cuf.id as field_id,cuf.name, cuf.type, cud.value
FROM wp_appq_custom_user_field_data cud
         JOIN wp_appq_custom_user_field cuf ON (cuf.id = cud.custom_user_field_id)
         JOIN wp_appq_evd_profile p ON (p.id = cud.profile_id)
WHERE wp_user_id = ?
  AND cuf.enabled = 1`;

  let sqlData = [id];
  if (fieldId) {
    sql += " AND cuf.id = ?";
    sqlData.push(parseInt(fieldId).toString());
  }
  let data: {
    id: string;
    field_id: number;
    type: "text" | "select" | "multiselect";
    is_candidate: boolean;
    candidate: boolean;
    text: string;
    value: string;
    name: string;
  }[];

  let additional: typeof data = [];
  try {
    data = await db.query(db.format(sql, sqlData));
    if (!data.length)
      return Promise.reject({
        status_code: 404,
        message: "There are no data for this field",
      });
  } catch (e) {
    return Promise.reject(e);
  }

  let textes: typeof data = data.filter(
    (i) => !["select", "multiselect"].includes(i.type)
  );

  textes = textes.map((t) => {
    t.text = t.value;
    return t;
  });

  let selects: typeof data = [];
  const selectsIds = data
    .filter((i) => ["select", "multiselect"].includes(i.type))
    .map((i) => parseInt(i.id))
    .join(",");

  if (selectsIds.length) {
    let selectsSql = `SELECT cud.id, COALESCE(cue.name, cud.value) as name, COALESCE(cue.id, cud.value) as value, cud.candidate
      FROM wp_appq_custom_user_field_data cud
      LEFT join wp_appq_custom_user_field_extras cue ON cud.value = cue.id
      WHERE cud.id IN (${selectsIds}) AND (cud.candidate = 1 OR cue.name IS NOT NULL);`;

    try {
      const selectsData: typeof data = await db.query(
        db.format(selectsSql, [id])
      );
      selectsData.forEach((s) => {
        let select = data.find((d) => d.id === s.id);
        if (select) {
          select.text = s.name;
          select.value = s.value;
          if (s.candidate) select.is_candidate = true;
          selects.push(select);
        }
      });
      additional = [...selects, ...textes];
    } catch (e) {
      if (process.env && process.env.NODE_ENV === "development") {
        console.log(e);
      }
      console.log(e);
    }
  } else {
    additional = textes;
  }
  const results = additional.map((a) => {
    let { id, type, ...rest } = a;
    return rest;
  });
  return { additional: results };
};
