import * as Sentry from "@sentry/node";
import app from "@src/app";
import config from "@src/config";
import connectionManager from "@src/features/db/mysql";
const PORT = config.port || 3000;

Sentry.init({
  dsn: "https://a66cb6798d184595b240cf8f09d629f5@o1087982.ingest.sentry.io/6102360",

  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({
      // to trace all requests to the default router
      app,
      // alternatively, you can specify the routes you want to trace:
      // router: someRouter,
    }),
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
  ],
});

// RequestHandler creates a separate execution context, so that all
// transactions/spans/breadcrumbs are isolated across requests
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// the rest of your app

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());
connectionManager.connectToServer(() => {
  app.listen(PORT, () => console.info("api listening on port " + PORT));
});
