import * as SentryHandler from "@sentry/node";
import express from "express";

class Sentry {
  constructor(private app: ReturnType<typeof express>) {
    if (process.env.NODE_ENV !== "test") {
      SentryHandler.init({
        dsn: "https://6aef095d5c459856b721c72ae9eae42e@o1087982.ingest.sentry.io/4506310015844352",
        integrations: [
          new SentryHandler.Integrations.Http({ tracing: true }),
          new SentryHandler.Integrations.Express({ app }),
          ...SentryHandler.autoDiscoverNodePerformanceMonitoringIntegrations(),
        ],
        tracesSampleRate: 1.0,
        beforeSendTransaction(event) {
          console.log(event.transaction);
          if (event.transaction === "GET /api") {
            return null;
          }
          return event;
        },
      });

      app.use(SentryHandler.Handlers.requestHandler());
      app.use(SentryHandler.Handlers.tracingHandler());
    }
  }

  public setErrorHandler() {
    if (process.env.NODE_ENV !== "test") {
      this.app.use(SentryHandler.Handlers.errorHandler());
    }
  }
}

export default Sentry;
