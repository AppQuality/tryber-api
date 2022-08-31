import debugMessage from "@src/features/debugMessage";

export default class Route<T extends RouteClassTypes> {
  private errorMessage: StoplightComponents["responses"]["NotFound"]["content"]["application/json"] =
    {
      element: "element",
      id: 0,
      message: "Generic error",
    };
  private responseData:
    | T["response"]
    | StoplightComponents["responses"]["NotAuthorized"]["content"]["application/json"]
    | StoplightComponents["responses"]["NotFound"]["content"]["application/json"]
    | undefined;

  private body: T["body"] | undefined;
  private parameters: T["parameters"] | undefined;
  protected query: T["query"] | undefined;

  constructor(
    protected configuration: RouteClassConfiguration & {
      element?: string;
      id?: number;
    }
  ) {
    if (configuration.element)
      this.errorMessage.element = configuration.element;
    if (configuration.id) this.errorMessage.id = configuration.id;
    if (configuration.request.body) this.body = configuration.request.body;
    if (configuration.context.request.params)
      this.parameters = configuration.context.request.params;
    if (configuration.request.query) this.query = configuration.request.query;
  }

  protected async prepare() {}
  protected async filter() {
    return true;
  }

  protected setSuccess(statusCode: number, data: typeof this.responseData) {
    this.configuration.response.status_code = statusCode;
    this.responseData = data;
  }

  protected setError(statusCode: number, error: OpenapiError) {
    this.configuration.response.status_code = statusCode;
    debugMessage(error);

    this.responseData = { ...this.errorMessage, message: error.message };
  }

  protected getBody() {
    if (typeof this.body === "undefined") throw new Error("Invalid body");
    return this.body;
  }

  protected getParameters() {
    if (typeof this.parameters === "undefined")
      throw new Error("Invalid parameters");
    return this.parameters;
  }

  protected getQuery() {
    if (typeof this.query === "undefined") throw new Error("Invalid query");
    return this.query;
  }

  protected setId(id: number) {
    this.errorMessage.id = id;
  }

  async resolve() {
    if (await this.filter()) {
      await this.prepare();
    }
    return this.responseData;
  }
}
