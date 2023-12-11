import * as Sentry from "@sentry/node";
import { Request } from "express";
import { Context } from "openapi-backend";
import process from "process";

export default (c: Context, req: Request, res: OpenapiResponse) => {
  if (!res.skip_post_response_handler) {
    const valid = c.api.validateResponse(
      c.response,
      c.operation,
      res.status_code
    );

    if (valid.errors) {
      if (process.env && process.env.DEBUG) {
        console.log(c.response);
      }
      Sentry.addBreadcrumb({
        category: "Response Validation Failed",
        message: `Validation failed for endpoint ${req.baseUrl + req.path}`,
        level: "warning",
      });
      Sentry.addBreadcrumb({
        category: "Invalid Data",
        message: JSON.stringify(valid.errors),
        level: "info",
      });
      Sentry.captureMessage(
        `Response Validation error on ${req.method} ${req.baseUrl + req.path}`,
        "warning"
      );
      return res.status(502).json({
        status: 502,
        err: valid.errors,
      });
    }
    return res.status(res.status_code).json(c.response);
  }
};
