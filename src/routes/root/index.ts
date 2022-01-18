/**  OPENAPI-ROUTE : get-root */
import { Context } from 'openapi-backend';

import test from './sucafun';


export default (c : Context, req : Request, res : OpenapiResponse) => {
  res.status_code = 200;
  let revision = test();
  let branch = "caio";
  return { branch, revision };
};
