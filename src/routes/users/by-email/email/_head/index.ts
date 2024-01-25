/** OPENAPI-CLASS: head-users-by-email-email */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import Route from "@src/features/routes/Route";

export default class HeadUsersByEmail extends Route<{
  response: StoplightOperations["head-users-by-email-email"]["responses"]["200"];
  parameters: StoplightOperations["head-users-by-email-email"]["parameters"]["path"];
}> {
  private email: string = "";

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);

    const params = this.getParameters();
    if (params.email) {
      this.email = params.email;
    }
  }

  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    if (this.emailIsNotValid()) {
      this.setError(400, new OpenapiError(""));
      return false;
    }
    if (await this.userNotExist()) {
      this.setError(404, new OpenapiError(""));
      return false;
    }
    return true;
  }

  protected async prepare(): Promise<void> {
    return this.setSuccess(200, {});
  }

  private emailIsNotValid() {
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(this.email);
  }

  private async userNotExist() {
    const user = await tryber.tables.WpUsers.do()
      .select()
      .where({ user_email: this.email })
      .first();
    return !user;
  }
}
