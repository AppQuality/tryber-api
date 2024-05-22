/** OPENAPI-CLASS : get-campaign-types */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaign-types"]["responses"]["200"]["content"]["application/json"];
}> {
  private accessibleCampaigns: true | number[] = this.campaignOlps
    ? this.campaignOlps
    : [];

  protected async filter() {
    if ((await super.filter()) === false) return false;
    if (this.doesNotHaveAccessToCampaigns()) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }
    return true;
  }

  private doesNotHaveAccessToCampaigns() {
    return (
      this.accessibleCampaigns !== true && this.accessibleCampaigns.length === 0
    );
  }

  protected async prepare(): Promise<void> {
    const types = await this.getTypes();

    const result = await this.enhanceTypesWithCustomRoles(types);
    return this.setSuccess(
      200,
      result.map((type) => ({
        id: type.id,
        name: type.name,
        customRoles: type.customRoles,
      }))
    );
  }

  private async getTypes() {
    const types = await tryber.tables.WpAppqCampaignType.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_campaign_type"),
        tryber.ref("name").withSchema("wp_appq_campaign_type"),
        "custom_roles"
      )
      .join(
        "wp_appq_campaign_category",
        "wp_appq_campaign_category.id",
        "wp_appq_campaign_type.category_id"
      )
      .orderBy("wp_appq_campaign_type.name", "asc");
    const parsedTypes = types.map((type) => {
      let parsedRoles: Record<string, any> = {};
      if (type.custom_roles) {
        try {
          parsedRoles = JSON.parse(type.custom_roles);
        } catch (error) {
          console.error("Error parsing custom roles", error);
        }
      }
      return {
        ...type,
        custom_roles: parsedRoles,
      };
    });
    return parsedTypes;
  }

  private async enhanceTypesWithCustomRoles<T>(
    types: (T & {
      custom_roles: Record<string, any>;
    })[]
  ) {
    const userIds = [
      ...new Set(
        types.flatMap((type) => Object.values(type.custom_roles)).flat()
      ),
    ];

    const userIdMap = await tryber.tables.WpAppqEvdProfile.do()
      .select("wp_user_id", "id")
      .whereIn("wp_user_id", userIds);

    return types.map((type) => {
      const customRoles = Object.keys(type.custom_roles).map((roleId) => {
        const users = userIdMap.filter((user) =>
          type.custom_roles[roleId].includes(user.wp_user_id)
        );
        return {
          roleId: parseInt(roleId),
          userIds: users.map((user) => user.id),
        };
      });

      return {
        ...type,
        customRoles: customRoles,
      };
    });
  }
}

export default RouteItem;
