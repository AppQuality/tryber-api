import OpenAPIBackend, { Context } from "openapi-backend";
import { OpenAPIV3 } from "openapi-types";

export default (api: OpenAPIBackend) =>
  async (c: Context, req: Request, res: OpenapiResponse) => {
    res.skip_post_response_handler = true;
    if (process.env && process.env.DEBUG) {
      console.log(`Mocking ${c.operation.operationId}`);
    }

    let { status, mock } = api.mockResponseForOperation(
      c.operation.operationId || ""
    );
    const responses = c.operation.responses;
    if (
      Object.keys(req.headers).includes("x-tryber-mock-example") &&
      responses
    ) {
      //@ts-ignore
      const exampleName = req.headers["x-tryber-mock-example"] || "";
      const response = responses[status] as OpenAPIV3.ResponseObject;
      if (response && response.content) {
        const examples = response.content["application/json"].examples;
        if (examples && Object.keys(examples).includes(exampleName)) {
          mock = examples[exampleName];
        }
      }
    }
    return res.status(status).json(mock);
  };
