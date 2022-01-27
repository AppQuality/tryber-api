import { Response } from "express";
import { Request } from "openapi-backend";
import { components, operations, paths } from "./schema";

declare global {
  interface OpenapiResponse extends Response {
    skip_post_response_handler?: boolean;
    status_code: number;
  }
  interface OpenapiRequest extends Request {
    user: UserType;
    query: { [key: string]: string | { [key: string]: string } };
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
    permission: { admin?: { [key: sting]: boolean } };
  };

  interface StoplightOperations extends operations {}
  interface StoplightComponents extends components {}
  interface StoplightPaths extends paths {}
}
