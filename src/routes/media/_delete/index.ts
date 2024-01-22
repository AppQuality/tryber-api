/** OPENAPI-CLASS: delete-media */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";
import deleteFromS3 from "@src/features/deleteFromS3";

export default class DeleteMediaRoute extends UserRoute<{
  response: StoplightOperations["delete-media"]["responses"]["200"];
  body: StoplightOperations["delete-media"]["requestBody"]["content"]["application/json"];
}> {
  private mediaUrl: string;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const body = this.getBody();
    this.mediaUrl = body.url;
  }

  protected async filter() {
    if ((await super.filter()) === false) return false;

    if (process.env.MEDIA_BUCKET === undefined) {
      this.setError(
        500,
        new OpenapiError(
          "Bucket not set. Configuration error, contact your administrator."
        )
      );
      return false;
    }
    if (this.isValidPath() === false) {
      this.setError(404, new OpenapiError("Bad file path"));
      return false;
    }
    if ((await this.mediaIsNotAlreadyLinked()) === false) {
      this.setError(403, new OpenapiError("Bad file path"));
      return false;
    }
    return true;
  }

  protected async prepare() {
    await deleteFromS3({ url: this.mediaUrl });
    this.setSuccess(200, {});
  }
  private isValidPath() {
    return this.mediaUrl.startsWith(
      `https://s3.eu-west-1.amazonaws.com/${process.env.MEDIA_BUCKET}/${
        process.env.MEDIA_FOLDER || "media"
      }/T${this.getTesterId()}/`
    );
  }
  private async mediaIsNotAlreadyLinked() {
    const bugMedia = await tryber.tables.WpAppqEvdBugMedia.do()
      .select("id")
      .where({ location: this.mediaUrl });
    return bugMedia.length <= 0;
  }
}
