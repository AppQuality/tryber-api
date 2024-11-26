/** OPENAPI-CLASS : post-customers */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import { createDemoEnvironment } from "./createDemoEnvironment";

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
    const customer = await this.createCustomer();
    // if (customer && customer.id) {
    //   await createDemoEnvironment({ workspaceId: customer.id });
    // }

    return this.setSuccess(201, customer);
  }

  private async createCustomer() {
    const customer = await tryber.tables.WpAppqCustomer.do()
      .insert({
        company: this.getBody().name,
        pm_id: this.getTesterId(),
      })
      .returning("id");
    const id = customer[0].id ?? customer[0];

    return {
      id: id,
      name: this.getBody().name,
    };
  }
}

export default RouteItem;
