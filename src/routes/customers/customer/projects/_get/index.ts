/** OPENAPI-CLASS : get-customers-customer-projects */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

class RouteItem extends UserRoute<{
  response: StoplightOperations["get-customers-customer-projects"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-customers-customer-projects"]["parameters"]["path"];
}> {
  private accessibleCampaigns: true | number[] = this.campaignOlps
    ? this.campaignOlps
    : [];
  private customerId: number;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.customerId = Number(this.getParameters().customer);
  }

  protected async filter() {
    if ((await super.filter()) === false) return false;
    if (this.doesNotHaveAccessToCampaigns()) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }
    if (await this.customerDoesNotExist()) {
      this.setError(403, new OpenapiError("Customer does not exist"));
      return false;
    }
    return true;
  }

  private doesNotHaveAccessToCampaigns() {
    return this.accessibleCampaigns !== true;
  }

  private async customerDoesNotExist() {
    const results = await tryber.tables.WpAppqCustomer.do()
      .select("id")
      .where("id", this.customerId);

    return results.length === 0;
  }

  protected async prepare(): Promise<void> {
    return this.setSuccess(200, {
      results: await this.getProjects(),
    });
  }

  private getProjects() {
    return tryber.tables.WpAppqProject.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_project"),
        tryber.ref("display_name").withSchema("wp_appq_project").as("name")
      )
      .where("customer_id", this.customerId);
  }
}

export default RouteItem;
