/** OPENAPI-CLASS : post-customers */

import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";
import { unguessPostCustomer } from "./unguessPostCustomer";

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
    const customer = await unguessPostCustomer({
      company: this.getBody().name,
      userId: this.getTesterId(),
    });

    return this.setSuccess(201, customer);
  }
}

export default RouteItem;
