/** OPENAPI-CLASS: post-authenticate */

import jwt from "jsonwebtoken";
import hasher from "wordpress-hash-node";

import OpenapiError from "@src/features/OpenapiError";
import Route from "@src/features/routes/Route";
import config from "../../config";
import authenticate from "../../features/wp/authenticate";
import getUserByName from "../../features/wp/getUserByName";

export default class AuthenticateRoute extends Route<{
  response: StoplightOperations["post-authenticate"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["post-authenticate"]["requestBody"]["content"]["application/json"];
}> {
  private username: string;
  private password: string;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const body = this.getBody();
    this.username = body.username;
    this.password = body.password;
  }

  protected async prepare(): Promise<void> {
    const userData = await this.getUser();
    if (!userData) {
      this.setError(401, new OpenapiError("Invalid data"));
      return;
    }

    const checked = hasher.CheckPassword(this.password, userData.user_pass);
    if (!checked) {
      this.setError(
        401,
        new OpenapiError(
          "Password " + this.password + " not matching " + userData.user_login
        )
      );
      return;
    }

    const data = await authenticate(userData);

    if (data instanceof Error) {
      this.setError(401, new OpenapiError("Invalid data"));
      return;
    }

    const tokenData = this.getToken({
      ID: data.ID,
      testerId: data.testerId,
      user_login: data.user_login,
      role: data.role,
      permission: data.permission,
      capabilities: data.capabilities,
    });
    if (!tokenData) {
      this.setError(502, new OpenapiError("Failed token generation"));
      return;
    }

    const { iat, exp, token } = tokenData;

    this.setSuccess(200, {
      id: Number(data.ID),
      username: data.user_login,
      token: token,
      iat: iat,
      exp: exp,
    });
  }

  private async getUser() {
    try {
      const userData = await getUserByName(this.username);
      if (!userData) {
        throw new Error("User not found");
      }
      return userData;
    } catch (e) {
      return false;
    }
  }

  private getToken(user: any) {
    const token = jwt.sign(user, config.jwt.secret, {
      expiresIn: process.env.JWT_EXPIRATION, // token expires in 15 minutes
    });
    const tokenData = jwt.decode(token);
    if (tokenData === null || typeof tokenData === "string") {
      return false;
    }

    const { iat, exp } = tokenData;
    return {
      iat,
      exp,
      token,
    };
  }
}
