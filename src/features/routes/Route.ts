import debugMessage from "@src/features/debugMessage";

export default class Route<RESPONSE, BODY = void> {
  private errorMessage: StoplightComponents["responses"]["NotFound"]["content"]["application/json"] =
    {
      element: "element",
      id: 0,
      message: "Generic error",
    };
  private responseData:
    | RESPONSE
    | StoplightComponents["responses"]["NotAuthorized"]["content"]["application/json"]
    | StoplightComponents["responses"]["NotFound"]["content"]["application/json"]
    | undefined;

  private body: BODY | undefined;

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

  async resolve() {
    if (await this.filter()) {
      await this.prepare();
    }
    return this.responseData;
  }
}
