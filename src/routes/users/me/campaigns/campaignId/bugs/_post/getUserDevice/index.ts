import Devices from "@src/features/class/Devices";
import debugMessage from "@src/features/debugMessage";

import { UserDevice } from "../types";

export default async (deviceId: number): Promise<UserDevice> => {
  try {
    const device = await new Devices().getOne(deviceId);
    if (!device) throw Error("No device on your user");
    return device;
  } catch (error) {
    debugMessage(error);
    throw {
      status_code: 403,
      message: (error as OpenapiError).message,
    };
  }
};
