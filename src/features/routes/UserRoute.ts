import Route from "./Route";

export default class UserRoute<T> extends Route<T> {
  private testerId: number;

  constructor(
    configuration: RouteClassConfiguration & {
      element?: string;
      id?: number;
    }
  ) {
    super({
      ...configuration,
      id: configuration.request.user.testerId,
    });
    this.testerId = this.configuration.request.user.testerId;
  }

  protected getTesterId() {
    return this.testerId;
  }
}
