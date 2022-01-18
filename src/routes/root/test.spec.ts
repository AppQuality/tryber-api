import request from 'supertest';

import app from '../../app';
import test from './sucafun';





jest.mock("./sucafun")

describe("Authorizations", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("GET on /authenticate with correct data should answer 200", async () => {
		(test as jest.Mock).mockReturnValue("ciao")
    return request(app)
      .get("/")
      .expect(200, {
        branch: "caio",
        revision: "ciao"
      });
  });
});
