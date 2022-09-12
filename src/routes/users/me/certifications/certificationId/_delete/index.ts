import * as db from "@src/features/db";
import UserRoute from "@src/features/routes/UserRoute";
import debugMessage from "@src/features/debugMessage";

/** OPENAPI-CLASS: delete-users-me-certifications-certificationId */

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["delete-users-me-certifications-certificationId"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["delete-users-me-certifications-certificationId"]["parameters"]["path"];
}> {
  constructor(configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "certifications" });
    const parameters = this.getParameters();
    this.setId(parseInt(parameters.certificationId as unknown as string));
  }

  protected async prepare() {
    try {
      await this.checkIfCertificateExists();
      await this.delete();
      this.setSuccess(200, { message: "Certification successfully removed" });
    } catch (error) {
      debugMessage(error);
      this.setError(
        (error as OpenapiError).status_code || 400,
        error as OpenapiError
      );
    }
  }

  private async checkIfCertificateExists() {
    let result = await db.query(
      db.format(
        `SELECT id 
        FROM wp_appq_profile_certifications 
        WHERE cert_id=? AND tester_id=?;`,
        [this.getId(), this.getTesterId()]
      )
    );
    if (!result.length) {
      throw {
        status_code: 404,
        message: "This tester has not this Certification.",
      };
    }
  }

  private async delete() {
    try {
      await db.query(
        db.format(
          `DELETE 
          FROM wp_appq_profile_certifications 
          WHERE cert_id=? AND tester_id=?;`,
          [this.getId(), this.getTesterId()]
        )
      );
    } catch (e) {
      debugMessage(e);
      throw Error("Failed to remove user Certification");
    }
  }
}
