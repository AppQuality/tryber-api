import Devices from "@src/features/class/Devices";
import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: get-users-me-devices */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const devices = await new Devices().getMany({
      testerId: req.user.testerId,
    });
    if (!devices.length) throw Error("No device on your user");
    res.status_code = 200;
    return devices;
  } catch (error) {
    res.status_code = 404;
    debugMessage(error);

    return {
      element: "devices",
      id: parseInt(req.user.ID),
      message: (error as OpenapiError).message,
    };
  }
};
