import UserRoute from "./UserRoute";

class AdminRoute<T> extends UserRoute<T> {
  protected async filter() {
    if (this.configuration.request.user.role !== "administrator") {
      const error = new Error(
        "You are not authorized to do this"
      ) as OpenapiError;
      this.setError(403, error);
      return false;
    }
    return true;
  }
}
