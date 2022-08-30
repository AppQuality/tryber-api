import Devices from "@src/features/class/Devices";
import UserRoute from "@src/features/routes/UserRoute";

/** OPENAPI-CLASS: get-users-me-devices */

export default class UserDeviceRoute extends UserRoute<{
  response: StoplightOperations["get-users-me-devices"]["responses"]["200"]["content"]["application/json"];
}> {
  constructor(protected configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "devices" });
  }

  protected async prepare() {
    try {
      const devices = await this.getUserDevices();
      this.setSuccess(200, devices);
    } catch (error) {
      this.setError(404, error as OpenapiError);
    }
  }

  private async getUserDevices() {
    const result = await new Devices().getMany({
      testerId: this.getTesterId(),
    });
    if (!result.length) throw Error("No device on your user");
    return result;
  }
}
