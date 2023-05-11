/** OPENAPI-CLASS : get-customers */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

class RouteItem extends UserRoute<{
  response: StoplightOperations["get-customers"]["responses"]["200"]["content"]["application/json"];
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
    return (
      this.accessibleCampaigns !== true && this.accessibleCampaigns.length === 0
    );
  }

  protected async prepare(): Promise<void> {
    return this.setSuccess(200, await this.getCustomers());
  }

  private async getCustomers() {
    if (this.accessibleCampaigns === true) {
      return await this.getAllCustomers();
    } else {
      return await this.getPartialCustomers();
    }
  }

  private getCustomerQuery() {
    return tryber.tables.WpAppqCustomer.do().select(
      tryber.ref("id").withSchema("wp_appq_customer"),
      tryber.ref("company").withSchema("wp_appq_customer").as("name")
    );
  }

  private async getAllCustomers() {
    return await this.getCustomerQuery();
  }

  private async getPartialCustomers() {
    const customers = await this.getCustomerQuery()
      .join(
        "wp_appq_project",
        "wp_appq_project.customer_id",
        "wp_appq_customer.id"
      )
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_campaign.project_id",
        "wp_appq_project.id"
      )
      .where("wp_appq_evd_campaign.id", "in", this.accessibleCampaigns);
    return customers;
  }
}

export default RouteItem;
