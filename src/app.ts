import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import OpenAPIBackend, { Options, Request } from 'openapi-backend';

import config from './config';
import middleware from './middleware';
import routes from './routes';

const opts: Options = {
  definition: __dirname + "/reference/openapi.yml",
};

let referencePath = "/reference/";
if (config.apiRoot) {
  opts.apiRoot = config.apiRoot;
  referencePath = config.apiRoot + referencePath;
}
const api = new OpenAPIBackend(opts);
api.register({
  notFound: middleware.notFound,
  unauthorizedHandler: middleware.unauthorized,
  validationFail: middleware.validationFail,
});

api.registerHandler("notImplemented", middleware.notImplemented(api));
// register security handler for jwt auth
api.registerSecurityHandler("JWT", middleware.jwtSecurityHandler);

api.register("postResponseHandler", middleware.postResponseHandler);
routes(api);
api.init();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get(referencePath, function (req, res) {
  res.sendFile(__dirname + "/reference/openapi.yml");
});
app.use((req, res) => api.handleRequest(req as Request, req, res));

export default app;
