import { tryber } from "@src/features/database";

export default async (id: string, fieldId: false | string = false) => {
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
    let newData = tryber.tables.WpAppqCustomUserFieldData.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_custom_user_field_data"),
        tryber.ref("id").withSchema("wp_appq_custom_user_field").as("field_id"),
        tryber.ref("name").withSchema("wp_appq_custom_user_field"),
        tryber.ref("type").withSchema("wp_appq_custom_user_field"),
        tryber.ref("value").withSchema("wp_appq_custom_user_field_data")
      )
      .join(
        "wp_appq_custom_user_field",
        "wp_appq_custom_user_field.id",
        "wp_appq_custom_user_field_data.custom_user_field_id"
      )
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_custom_user_field_data.profile_id"
      )
      .where("wp_user_id", id)
      .andWhere("wp_appq_custom_user_field.enabled", 1);
    if (fieldId) {
      newData = newData.andWhere("wp_appq_custom_user_field.id", fieldId);
    }
    data = (await newData) as unknown as typeof data;
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
    .map((i) => parseInt(i.id));

  if (selectsIds.length) {
    const newSelects = await tryber.tables.WpAppqCustomUserFieldData.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_custom_user_field_data"),
        tryber.raw(
          "COALESCE(wp_appq_custom_user_field_extras.name, wp_appq_custom_user_field_data.value) as name"
        ),
        tryber.raw(
          "COALESCE(wp_appq_custom_user_field_extras.id, wp_appq_custom_user_field_data.value) as value"
        ),
        tryber.ref("candidate").withSchema("wp_appq_custom_user_field_data")
      )
      .leftJoin(
        "wp_appq_custom_user_field_extras",
        "wp_appq_custom_user_field_data.value",
        "wp_appq_custom_user_field_extras.id"
      )
      .whereIn("wp_appq_custom_user_field_data.id", selectsIds)
      .andWhere(function () {
        this.where("wp_appq_custom_user_field_data.candidate", 1),
          this.orWhereNotNull("wp_appq_custom_user_field_extras.name");
      });

    try {
      const selectsData: typeof data = newSelects as unknown as typeof data;

      selectsData.forEach((s) => {
        let select = data.find((d) => d.id === s.id);
        if (select) {
          select.text = s.name;
          select.value = s.value.toString();
          if (s.candidate) select.is_candidate = true;
          selects.push(select);
        }
      });
      additional = [...selects, ...textes];
    } catch (e) {
      if (process.env && process.env.NODE_ENV === "development") {
        console.log(e);
      }
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
