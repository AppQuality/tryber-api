import Route from "./Route";

export default class UserRoute<T extends RouteClassTypes> extends Route<T> {
  private testerId: number;
  private wordpressId: number;

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
    this.wordpressId = parseInt(this.configuration.request.user.ID);
  }

  protected getTesterId() {
    return this.testerId;
  }
  protected getWordpressId() {
    return this.wordpressId;
  }
}
