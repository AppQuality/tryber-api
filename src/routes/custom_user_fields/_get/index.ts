import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
/** OPENAPI-CLASS: get-customUserFields */

type Translatable = { [key: string]: string };
type Field = NonNullable<
  NonNullable<
    StoplightOperations["get-customUserFields"]["responses"]["200"]["content"]["application/json"][number]["fields"]
  >[number]
>;
export default class Route extends UserRoute<{
  response: StoplightOperations["get-customUserFields"]["responses"]["200"]["content"]["application/json"];
}> {
  protected async prepare() {
    const byGroups = await this.getFieldsByGroups();
    const groups = (await this.getGroups()).map((g) => {
      return {
        group: g,
        fields: byGroups[g.id] || [],
      };
    });

    this.setSuccess(
      200,
      groups.filter((g) => g.fields.length)
    );
  }

  private async getFieldsByGroups() {
    const fields = (
      await tryber.tables.WpAppqCustomUserField.do()
        .select(
          "id",
          "name",
          "placeholder",
          "type",
          "allow_other",
          "custom_user_field_group_id",
          tryber.ref("options").as("format")
        )
        .where("enabled", 1)
        .orderBy("priority", "desc")
    ).filter((f): f is typeof f & { type: "select" | "multiselect" | "text" } =>
      ["select", "multiselect", "text"].includes(f.type)
    );
    const translationItems =
      await tryber.tables.WpAppqCustomUserFieldTranslation.do().select(
        "field_id",
        "name",
        "placeholder",
        "lang"
      );

    const extras = await tryber.tables.WpAppqCustomUserFieldExtras.do()
      .select("id", "custom_user_field_id", "name")
      .orderBy("order", "asc");

    return fields.reduce((acc, r) => {
      if (!acc[r.custom_user_field_group_id]) {
        acc[r.custom_user_field_group_id] = [];
      }
      const translations = translationItems.filter((t) => t.field_id === r.id);
      const options = extras.filter((e) => e.custom_user_field_id === r.id);
      acc[r.custom_user_field_group_id].push({
        id: r.id,
        type: r.type,
        allow_other: r.allow_other == 1,
        format: r.format || undefined,
        options: options.length
          ? options.map((o) => {
              return {
                id: o.id,
                name: o.name,
              };
            })
          : undefined,
        name: translations.reduce(
          (acc, t) => {
            acc[t.lang] = t.name;
            return acc;
          },
          { it: r.name } as Record<string, string>
        ),
        placeholder: translations.reduce(
          (acc, t) => {
            acc[t.lang] = t.placeholder;
            return acc;
          },
          { it: r.placeholder } as Record<string, string>
        ),
      });
      return acc;
    }, {} as Record<number, Field[]>);
  }

  private async getGroups(): Promise<
    { id: number; name: Translatable; description: Translatable }[]
  > {
    const results = await tryber.tables.WpAppqCustomUserFieldGroups.do()
      .select("id", "name", "description")
      .orderBy("priority", "desc");
    const tResults =
      await tryber.tables.WpAppqCustomUserFieldGroupTranslation.do().select(
        "field_id",
        "name",
        "description",
        "lang"
      );

    return [
      {
        id: 0,
        name: {
          it: "Other",
        },
        description: {
          it: "Other",
        },
      },
      ...results.map((r) => {
        const translations = tResults.filter((t) => t.field_id === r.id);
        return {
          id: r.id,
          name: translations.reduce(
            (acc, t) => {
              acc[t.lang] = t.name;
              return acc;
            },
            { it: r.name } as Record<string, string>
          ),
          description: translations.reduce(
            (acc, t) => {
              acc[t.lang] = t.description;
              return acc;
            },
            { it: r.description } as Record<string, string>
          ),
        };
      }),
    ];
  }
}
