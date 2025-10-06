import { tryber } from "@src/features/database";
import path from "path";
import busboyMapper from "../busboyMapper";
import debugMessage from "../debugMessage";
import upload from "../upload";

class TaskMediaUploader {
  private _validExtensions?: string[];
  private request: OpenapiRequest;
  private bucket: string = process.env.MEDIA_BUCKET || "";
  private initialized: boolean = false;
  private usePathStyle: boolean = false;
  private keyMaker: (params: {
    testerId: number;
    filename: string;
    extension: string;
  }) => string;

  constructor({
    request,
    bucket,
    validExtensions,
    keyMaker,
  }: {
    request: OpenapiRequest;
    bucket?: string;
    validExtensions?: string[];
    keyMaker: (params: {
      testerId: number;
      filename: string;
      extension: string;
    }) => string;
  }) {
    this._validExtensions = validExtensions;
    this.request = request;
    if (bucket) this.bucket = bucket;
    this.keyMaker = keyMaker;
  }

  set pathStyle(value: boolean) {
    this.usePathStyle = value;
  }

  async init() {
    if (!this.initialized) {
      if (!this._validExtensions) {
        this._validExtensions = await this.defaultFileExtensions();
      }
      this.initialized = true;
    }
  }

  get validExtensions() {
    if (!this._validExtensions) throw new Error("Valid extensions not set");
    return this._validExtensions;
  }

  async getValidInvalidFiles() {
    const { valid, invalid } = await busboyMapper(this.request, (file) => {
      if (!this.validExtensions.length) {
        return false;
      }
      if (
        !this.validExtensions.includes(
          path.extname(file.name).toLowerCase().replace(".", "")
        )
      ) {
        return "INVALID_FILE_EXTENSION";
      }
      return false;
    });
    return { valid, invalid };
  }

  async defaultFileExtensions() {
    const option = await tryber.tables.WpOptions.do()
      .select("option_value")
      .where("option_name", "options_appq_valid_upload_extensions")
      .first();
    const validFileExtensionsString = option?.option_value;
    const validFileExtensions: string[] = validFileExtensionsString
      ? validFileExtensionsString.split(",")
      : [];

    return validFileExtensions;
  }

  async uploadFiles(files: Media[], testerId: number) {
    let uploadedFiles = [];
    for (const media of files) {
      const currentPath = (
        await upload({
          bucket: this.bucket,
          key: this.keyMaker({
            testerId: testerId,
            filename: path.basename(media.name, path.extname(media.name)),
            extension: path.extname(media.name),
          }),
          file: media,
          style: this.usePathStyle ? "path" : undefined,
        })
      ).toString();

      uploadedFiles.push({
        name: media.name,
        path: currentPath,
        size: media.size,
      });
      await this.createUploadedFile(
        currentPath,
        new Date().toISOString().split(".")[0].replace("T", " ")
      );
    }
    return uploadedFiles;
  }

  async createUploadedFile(path: string, creationDate: string) {
    try {
      await tryber.tables.WpAppqUploadedMedia.do().insert({
        url: path,
        creation_date: creationDate,
      });
    } catch (e) {
      debugMessage(e);
    }
  }
}

export default TaskMediaUploader;
