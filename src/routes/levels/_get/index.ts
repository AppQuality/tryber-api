/** OPENAPI-ROUTE: get-levels */
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const levels: [] = [];

    res.status_code = 200;
    return levels;
  } catch (err) {
    debugMessage(err);
  }
  res.status_code = 404;
  return {
    element: "levels",
    id: 0,
    message: "No levels found",
  };
};
