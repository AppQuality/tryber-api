import bodyParser from "body-parser";
import busboy from "connect-busboy";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import OpenAPIBackend, { Request } from "openapi-backend";
import config from "./config";
import Sentry from "./features/sentry";
import middleware from "./middleware";
import routes from "./routes";

const optsV1 = {
  definition: __dirname + "/reference/openapi-v1.yml",
  quick: true,
  apiRoot: "/v1",
};

const optsV2 = {
  definition: __dirname + "/reference/openapi-v2.yml",
  quick: true,
  apiRoot: "/v2",
};

if (config.apiRoot) optsV1.apiRoot = `${config.apiRoot}${optsV1.apiRoot}`;
if (config.apiRoot) optsV2.apiRoot = `${config.apiRoot}${optsV2.apiRoot}`;
const apiV1 = new OpenAPIBackend(optsV1);
const apiV2 = new OpenAPIBackend(optsV2);
apiV1.register({
  notFound: middleware.notFound,
  unauthorizedHandler: middleware.unauthorized,
  validationFail: middleware.validationFail,
});
apiV2.register({
  notFound: middleware.notFound,
  unauthorizedHandler: middleware.unauthorized,
  validationFail: middleware.validationFail,
});

apiV1.registerHandler("notImplemented", middleware.notImplemented(apiV1));
apiV2.registerHandler("notImplemented", middleware.notImplemented(apiV1));
// register security handler for jwt auth
apiV1.registerSecurityHandler("JWT", middleware.jwtSecurityHandler);
apiV2.registerSecurityHandler("JWT", middleware.jwtSecurityHandler);
apiV1.registerSecurityHandler(
  "User Token",
  middleware.userTokenSecurityHandler
);
apiV1.register("postResponseHandler", middleware.postResponseHandler);
apiV2.register("postResponseHandler", middleware.postResponseHandler);
routes(apiV1, "v1");
routes(apiV2, "v2");
apiV1.init();
apiV2.init();

const app = express();
const sentry = new Sentry(app);

app.use(
  busboy({
    highWaterMark: 2 * 1024 * 1024,
    headers: {
      "content-type": "multipart/form-data",
    },
  })
);
app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get(optsV1.apiRoot + "/reference/", function (req, res) {
  res.sendFile(__dirname + "/reference/openapi-v1.yml");
});

app.get(optsV2.apiRoot + "/reference/", function (req, res) {
  res.sendFile(__dirname + "/reference/openapi-v2.yml");
});

app.use(
  morgan(function (tokens, req, res) {
    const request = req as Request & { user?: { testerId: number } };
    return [
      request.user ? `T${request.user.testerId}` : "anonymous",
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");
  })
);

app.use((req, res) => {
  console.log(req.path);
  if (req.path.startsWith(optsV1.apiRoot)) {
    return apiV1.handleRequest(req as Request, req, res);
  } else if (req.path.startsWith(optsV2.apiRoot)) {
    return apiV2.handleRequest(req as Request, req, res);
  }
});

sentry.setErrorHandler();
export default app;
