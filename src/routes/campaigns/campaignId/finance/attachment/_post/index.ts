/** OPENAPI-CLASS: post-campaigns-campaign-finance-attachments */
import upload from "@src/features/upload";
import path from "path";
import busboyMapper from "@src/features/busboyMapper";
import CampaignRoute from "@src/features/routes/CampaignRoute";
import OpenapiError from "@src/features/OpenapiError";
import debugMessage from "@src/features/debugMessage";

interface InvalidMedia {
  name: string;
  path: string;
}

interface UploadSuccess {
  files: { name: string; mime_type: string; path: string }[];
  failed: InvalidMedia[];
}

interface UploadError {
  element: string;
  id: number;
  message: string;
}

export default class SingleCampaignRoute extends CampaignRoute<{
  response: StoplightOperations["post-campaigns-campaign-finance-attachments"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["post-campaigns-campaign-finance-attachments"]["requestBody"]["content"]["multipart/form-data"];
  parameters: StoplightOperations["post-campaigns-campaign-finance-attachments"]["parameters"]["path"];
}> {
  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;
    if (!this.hasAccessToCampaign(this.cp_id)) {
      this.setError(403, new OpenapiError("Access denied"));
      return false;
    }
    return true;
  }

  protected async prepare(): Promise<void> {
    try {
      const result = await this.uploadAttachmentFiles();

      if ("message" in result) {
        throw new OpenapiError(result.message);
      }

      return this.setSuccess(200, {
        attachments: result.files.map((file) => ({
          url: file.path,
          name: file.name,
          mime_type: file.mime_type,
        })),
        failed: result.failed,
      });
    } catch (err) {
      debugMessage(err);
      this.setError(
        (err as OpenapiError).status_code || 500,
        err as OpenapiError
      );
    }
  }

  protected getKey({
    filename,
    extension,
  }: {
    filename: string;
    extension: string;
  }): string {
    return `${
      process.env.FINANCE_ATTACHMENTS_FOLDER || "finance-attachments"
    }/CP${this.cp_id}/${filename}_${new Date().getTime()}${extension}`;
  }

  protected isAcceptableFile(file: { name: string }): boolean {
    return ![".bat", ".sh", ".exe"].includes(
      path.extname(file.name).toLowerCase()
    );
  }

  private async uploadAttachmentFiles(): Promise<UploadSuccess | UploadError> {
    try {
      const { valid, invalid } = await busboyMapper(
        this.configuration.request,
        (file) => {
          if (!this.isAcceptableFile(file)) {
            return "INVALID_FILE_EXTENSION";
          }
          return false;
        }
      );

      return {
        files: await this.uploadFiles(valid),
        failed: invalid.map((fail) => ({
          name: fail.name,
          path: fail.errorCode,
        })),
      };
    } catch (err) {
      return {
        element: "media-upload",
        id: 0,
        message: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  private async uploadFiles(
    files: Media[]
  ): Promise<{ name: string; mime_type: string; path: string }[]> {
    let uploadedFiles = [];
    for (const media of files) {
      const uploadedPath = await upload({
        bucket: process.env.MEDIA_BUCKET || "",
        key: this.getKey({
          filename: path.basename(media.name, path.extname(media.name)),
          extension: path.extname(media.name),
        }),
        file: media,
      });

      uploadedFiles.push({
        name: media.name,
        mime_type: media.mimeType,
        path: uploadedPath.toString(),
      });
    }
    return uploadedFiles;
  }
}
