/** OPENAPI-CLASS : post-customers */

import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";
import Unguess from "@src/features/class/Unguess";
import config from "@src/config";

class RouteItem extends UserRoute<{
  response: StoplightOperations["post-customers"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["post-customers"]["requestBody"]["content"]["application/json"];
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
    return this.accessibleCampaigns !== true;
  }

  protected async prepare(): Promise<void> {
    const customer = await this.postCustomerUnguessApi();

    return this.setSuccess(201, customer);
  }

  private async postCustomerUnguessApi() {
    const { basePath, username, password } = config.unguessApi || {};

    const unguess = new Unguess(basePath || "", username || "", password || "");

    try {
      const customer = await unguess.postCustomer({
        userId: this.getTesterId(),
        name: this.getBody().name,
      });
      console.log("Customer created:", customer);
      return customer;
    } catch (error) {
      console.error("Error creating customer:", error);
    }
  }
}

export default RouteItem;
