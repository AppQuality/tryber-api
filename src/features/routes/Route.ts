import debugMessage from "@src/features/debugMessage";

export default class Route<T> {
  private errorMessage: StoplightComponents["responses"]["NotFound"]["content"]["application/json"] =
    {
      element: "element",
      id: 0,
      message: "Generic error",
    };
  private responseData:
    | T
    | StoplightComponents["responses"]["NotAuthorized"]["content"]["application/json"]
    | StoplightComponents["responses"]["NotFound"]["content"]["application/json"]
    | undefined;

  constructor(
    protected configuration: RouteClassConfiguration & {
      element?: string;
      id?: number;
    }
  ) {
    if (configuration.element)
      this.errorMessage.element = configuration.element;
    if (configuration.id) this.errorMessage.id = configuration.id;
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

  async resolve() {
    if (await this.filter()) {
      await this.prepare();
    }
    return this.responseData;
  }
}
