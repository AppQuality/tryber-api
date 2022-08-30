import { Response } from "express";
import { FileArray, UploadedFile } from "express-fileupload";
import { Request } from "openapi-backend";
import { Busboy } from "connect-busboy";
import { components, operations, paths } from "./schema";
import { Context } from "openapi-backend";

declare global {
  interface OpenapiResponse extends Response {
    skip_post_response_handler?: boolean;
    status_code: number;
  }
  interface OpenapiRequest extends Request {
    user: UserType;
    query: { [key: string]: string | { [key: string]: string } };
    files: FileArray;
    pipe: (stream: NodeJS.Readable) => void;
    busboy: Busboy;
  }
  interface OpenapiError extends Error {
    status_code: number;
  }
  interface MySqlError extends Error {
    code: string;
  }

  type Olp = boolean | number[];
  type UserType = {
    ID: string;
    testerId: number;
    user_login: string;
    user_pass: string;
    role: string;
    capabilities: string[];
    permission: {
      admin?: {
        appq_prospect?: Olp;
        appq_message_center?: Olp;
        appq_campaign?: Olp;
      };
    };
  };

  type ReturnErrorType = {
    element: string;
    id: number;
    message: string;
  };

  interface ApiUploadedFile extends UploadedFile {
    keyEnhancer?: ({
      testerId: number,
      filename: string,
      extension: string,
    }) => string;
  }

  type Media = {
    name: string;
    keyEnhancer?: ({}) => string;
    size: number;
    stream: fs.ReadStream;
    mimeType: string;
    tmpPath: string;
  };
  interface StoplightOperations extends operations {}
  interface StoplightComponents extends components {}
  interface StoplightPaths extends paths {}

  type RouteClassConfiguration = {
    context: Context;
    request: OpenapiRequest;
    response: OpenapiResponse;
  };

  interface Object {
    hasOwnProperty<K extends PropertyKey>(key: K): this is Record<K, unknown>;
  }
}
