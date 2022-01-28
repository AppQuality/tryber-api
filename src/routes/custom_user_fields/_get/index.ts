import * as db from "@src/features/db";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: get-customUserFields */
type GroupType = {
  group: {
    id: number;
    name: {
      [key: string]: string;
    };
    description: {
      [key: string]: string;
    };
  };
  fields: {
    id: number;
    name: {
      [key: string]: string;
    };
    placeholder: {
      [key: string]: string;
    };
    options?: {
      id: number;
      name: string;
    }[];
  }[];
};

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const groups: GroupType[] = [
      {
        group: {
          id: 0,
          name: {
            it: "Other",
          },
          description: {
            it: "Other",
          },
        },
        fields: [],
      },
    ];
    try {
      const sql = `SELECT id,name,description FROM wp_appq_custom_user_field_groups ORDER BY priority DESC`;
      const results = await db.query(sql);
      const tSql = `SELECT field_id,name,description,lang FROM wp_appq_custom_user_field_group_translation`;
      const tResults = await db.query(tSql);
      results.forEach(
        (r: { id: number; name: string; description: string }) => {
          const item = {
            group: {
              id: r.id,
              name: {
                it: r.name,
              },
              description: {
                it: r.description,
              },
            },
            fields: [],
          };
          const translations = tResults.filter(
            (t: { field_id: number }) => t.field_id === r.id
          );
          translations.forEach(
            (t: { lang: string; name: string; description: string }) => {
              item.group.name[t.lang as keyof typeof item.group.name] = t.name;
              item.group.description[
                t.lang as keyof typeof item.group.description
              ] = t.description;
            }
          );
          groups.push(item);
        }
      );
    } catch (e) {
      throw Error("Can't retrieve custom user fields groups");
    }

    try {
      const sql = `SELECT id,
       name,
       placeholder,
       type,
       allow_other,
       custom_user_field_group_id,
       options as format
    FROM wp_appq_custom_user_field 
    WHERE enabled = 1
    ORDER BY priority DESC`;
      const results = await db.query(sql);

      const tSql = `SELECT field_id,name,placeholder,lang
    FROM wp_appq_custom_user_field_translation`;
      const tResults = await db.query(tSql);
      results.forEach(
        (r: {
          custom_user_field_group_id: number;
          id: number;
          type: string;
          allow_other: 1 | 0;
          format?: string;
          name: string;
          placeholder: string;
        }) => {
          groups.forEach((group, k) => {
            if (group.group.id == r.custom_user_field_group_id) {
              const item = {
                id: r.id,
                type: r.type,
                allow_other: r.allow_other == 1,
                format: r.format || undefined,
                name: {
                  it: r.name,
                },
                placeholder: {
                  it: r.placeholder,
                },
              };
              const translations = tResults.filter(
                (t: { field_id: number }) => t.field_id === r.id
              );
              translations.forEach(
                (t: { lang: string; name: string; placeholder: string }) => {
                  item.name[t.lang as keyof typeof item.name] = t.name;
                  item.placeholder[t.lang as keyof typeof item.placeholder] =
                    t.placeholder;
                }
              );
              groups[k].fields.push(item);
            }
          });
        }
      );
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      return Promise.reject(Error("Can't retrieve custom user fields"));
    }

    try {
      const sql =
        "SELECT id,custom_user_field_id,name FROM wp_appq_custom_user_field_extras ORDER BY  `order` ASC";
      const results = await db.query(sql);
      results.forEach(
        (r: { custom_user_field_id: number; id: number; name: string }) => {
          groups.forEach((group, gk) => {
            group.fields.forEach((field, fk) => {
              if (groups[gk].fields[fk].id === r.custom_user_field_id) {
                const options = groups[gk].fields[fk].options || [];
                options.push({
                  id: r.id,
                  name: r.name,
                });
                groups[gk].fields[fk].options = options;
              }
            });
          });
        }
      );
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      return Promise.reject(Error("Can't retrieve custom user fields options"));
    }

    res.status_code = 200;
    return groups.filter((g) => g.fields.length);
  } catch (error) {
    res.status_code = (error as OpenapiError).status_code || 400;
    return {
      element: "users",
      id: parseInt(req.user.ID),
      message: (error as OpenapiError).message,
    };
  }
};
