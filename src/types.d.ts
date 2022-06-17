import { Response } from "express";
import {
  FileArray as ExpressFileArray,
  UploadedFile as ExpressUploadedFile,
} from "express-fileupload";
import { Request } from "openapi-backend";

import { components, operations, paths } from "./schema";

declare global {
  interface UploadedFile extends ExpressUploadedFile {
    id: string;
  }
  class FileArray extends ExpressFileArray {
    [index: string]: UploadedFile | UploadedFile[];
  }
  interface OpenapiResponse extends Response {
    skip_post_response_handler?: boolean;
    status_code: number;
  }
  interface OpenapiRequest extends Request {
    user: UserType;
    query: { [key: string]: string | { [key: string]: string } };
    files: FileArray;
  }
  interface OpenapiError extends Error {
    status_code: number;
  }
  interface MySqlError extends Error {
    code: string;
  }

  type UserType = {
    ID: string;
    testerId: number;
    user_login: string;
    user_pass: string;
    role: string;
    capabilities: string[];
    permission: {
      admin?: { appq_prospect?: boolean; appq_message_center?: boolean };
    };
  };

  interface StoplightOperations extends operations {}
  interface StoplightComponents extends components {}
  interface StoplightPaths extends paths {}
}
