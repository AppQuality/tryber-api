import { Response } from 'express';
import { Request } from 'openapi-backend';

declare global {
  interface OpenapiResponse extends Response {
    skip_post_response_handler?: boolean;
    status_code: number;
  }
  interface OpenapiRequest extends Request {
    user: UserType;
  }

  type UserType = {
    ID: number;
    testerId: number;
    user_login: string;
    user_pass: string;
    role: string;
    capabilities: string[];
    permission: { admin?: {} };
  };
}
