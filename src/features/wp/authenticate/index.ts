import { tryber } from "@src/features/database";
import PHPUnserialize from "php-unserialize";

export default async (userData: {
  testerId: number;
  ID: string;
  user_login: string;
  user_pass: string;
}): Promise<UserType | Error> => {
  let user: UserType = {
    ...userData,
    capabilities: [],
    permission: {},
    role: "tester",
  };

  try {
    const options = await tryber.tables.WpOptions.do()
      .select("option_value")
      .where({
        option_name: "wp_user_roles",
      })
      .first();
    if (!options) throw new Error("No user roles found");
    let roles = PHPUnserialize.unserialize(options.option_value);
    const userMeta = await tryber.tables.WpUsermeta.do()
      .select("meta_value")
      .where("user_id", user.ID)
      .where("meta_key", "wp_capabilities")
      .first();
    let permissions = [];
    if (userMeta) {
      permissions = PHPUnserialize.unserialize(userMeta.meta_value);
    }
    user.role = "tester";
    user.capabilities = [];

    if (permissions) {
      Object.keys(permissions).forEach((permission) => {
        if (roles.hasOwnProperty(permission)) {
          user.capabilities = user.capabilities.concat(
            Object.keys(roles[permission].capabilities)
          );
          if (user.role == "tester") {
            user.role = permission;
          }
        } else {
          user.capabilities.push(permission);
        }
      });
    }
  } catch (e) {
    return e as Error;
  }

  const permissions: { [key: string]: boolean | number[] } = {};
  user.capabilities.forEach((cap) => {
    if (cap.endsWith("_full_access")) {
      permissions[cap.replace("_full_access", "")] = true;
    }
  });

  try {
    const results = await tryber.tables.WpAppqOlpPermissions.do()
      .select("main_id", "type")
      .where("wp_user_id", user.ID);
    results.forEach((item) => {
      if (!permissions.hasOwnProperty(item.type)) {
        const emptyPermission: { [key: string]: boolean | string[] } = {};
        emptyPermission[item.type] = [];
        Object.assign(permissions, emptyPermission);
      }
      let permission = permissions[item.type];
      if (Array.isArray(permission)) {
        permission.push(item.main_id);
        permissions[item.type] = permission;
      }
    });

    if (!user.hasOwnProperty("permission")) {
      Object.assign(user, { permission: {} });
    }
    if (!user.permission.hasOwnProperty("admin")) {
      user.permission.admin = {};
    }
    user.permission.admin = permissions;
  } catch (e) {
    return e as Error;
  }

  return user;
};
