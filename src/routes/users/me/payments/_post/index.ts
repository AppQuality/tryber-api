/** OPENAPI-ROUTE: post-users-me-payments */
import { Context } from "openapi-backend";

import checkBooty from "./checkBooty";
import checkFiscalProfile from "./checkFiscalProfile";
import checkProcessingPayment from "./checkProcessingPayment";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    await checkBooty(req.user.testerId);
    await checkFiscalProfile(req.user.testerId);
    await checkProcessingPayment(req.user.testerId);
  } catch (err) {
    res.status_code = 403;
    return {
      error: (err as OpenapiError).message,
    };
  }
};
