import { checkCookies } from "@src/middleware/checkCookies";
import jwt from "jsonwebtoken";
import { Context } from "openapi-backend";
import config from "../config";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  let authHeader = c.request.headers["authorization"];
  if (Array.isArray(authHeader)) {
    authHeader = authHeader.join(" ");
  }
  if (!authHeader) {
    const user = await checkCookies(req);
    if (user instanceof Error) {
      return jwt.verify("", config.jwt.secret);
    }
    req.user = user;
    return user;
  }
  const token = authHeader.replace("Bearer ", "");
  const decoded = jwt.verify(token, config.jwt.secret);
  req.user = decoded as unknown as UserType;
  return req.user;
};
