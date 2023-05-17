import { tryber } from "@src/features/database";
import authenticate from "@src/features/wp/authenticate";
import jwt from "jsonwebtoken";
import { Context } from "openapi-backend";
import config from "../config";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  if ("apikey" in c.request.headers === false)
    return jwt.verify("", config.jwt.secret);

  const key = c.request.headers.apikey as string;
  const tester = await tryber.tables.WpAppqUserTokens.do()
    .select("tester_id")
    .where("token", key)
    .first();

  if (!tester) return jwt.verify("", config.jwt.secret);

  const userData = await tryber.tables.WpUsers.do()
    .select(
      tryber.ref("ID").withSchema("wp_users").as("ID"),
      tryber.ref("user_login").withSchema("wp_users").as("user_login"),
      tryber.ref("user_pass").withSchema("wp_users").as("user_pass"),
      tryber.ref("id").withSchema("wp_appq_evd_profile").as("testerId")
    )
    .where("wp_appq_evd_profile.id", tester.tester_id)
    .join(
      "wp_appq_evd_profile",
      "wp_users.ID",
      "wp_appq_evd_profile.wp_user_id"
    )
    .first();
  if (!userData) return jwt.verify("", config.jwt.secret);

  const user = await authenticate({ ...userData, ID: userData.ID.toString() });
  if (user instanceof Error) return jwt.verify("", config.jwt.secret);

  req.user = user;
  return user;
};
