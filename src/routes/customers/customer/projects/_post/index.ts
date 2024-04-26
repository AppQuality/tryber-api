/** OPENAPI-CLASS : post-customers-customer-projects */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

class RouteItem extends UserRoute<{
  response: StoplightOperations["post-customers-customer-projects"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["post-customers-customer-projects"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["post-customers-customer-projects"]["parameters"]["path"];
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
    const project = await this.createProject();
    return this.setSuccess(201, project);
  }

  private async createProject() {
    const project = await tryber.tables.WpAppqProject.do()
      .insert({
        customer_id: this.customerId,
        display_name: this.getBody().name,
        edited_by: this.getTesterId(),
      })
      .returning("id");
    const id = project[0].id ?? project[0];

    return {
      id: id,
      name: this.getBody().name,
    };
  }
}

export default RouteItem;
