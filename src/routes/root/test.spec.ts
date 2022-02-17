import wpAuthProvider from "@appquality/wp-auth";
import request from "supertest";

import app from "../../app";
import getBranch from "./getBranch";
import getRevision from "./getRevision";

jest.mock("./getBranch");
jest.mock("./getRevision");
jest.mock("@appquality/wp-auth");

describe("Root endpoint", () => {
  beforeEach(() => {
    (wpAuthProvider.create as jest.Mock).mockReturnValue({
      checkAuth: (req: any) => ({
        on: (string: string, fn: Function) => {
          fn(true, 1);
        },
      }),
    });
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("GET on /authenticate with correct data should answer 200", async () => {
    const [branch, revision] = ["master", "12345"];
    (getBranch as jest.Mock).mockReturnValue(branch);
    (getRevision as jest.Mock).mockReturnValue(revision);
    return request(app).get("/").expect(200, {
      branch,
      revision,
    });
  });
});
