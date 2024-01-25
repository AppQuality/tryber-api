import app from "@src/app";
import { tryber } from "@src/features/database";
import deleteFromS3 from "@src/features/deleteFromS3";
import request from "supertest";

jest.mock("@src/features/deleteFromS3");

process.env.MEDIA_BUCKET = "media.bucket";
process.env.MEDIA_FOLDER = "media";

describe("Route DELETE /media", () => {
  beforeAll(async () => {
    (deleteFromS3 as jest.Mock).mockImplementation(
      ({ url }: { url: string }): Promise<any> => Promise.resolve(true)
    );
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      email: "jhon@doe@example.com",
      employment_id: 1,
      education_id: 1,
    });
    await tryber.tables.WpUsers.do().insert({
      ID: 1,
      user_email: "jhon@doe@example.com",
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpUsers.do().delete();
  });
  describe("Route DELETE /media", () => {
    beforeAll(async () => {});
    afterAll(async () => {});
    it("Should answer 403 if not logged in", async () => {
      const response = await request(app).delete("/media");
      expect(deleteFromS3).toBeCalledTimes(0);
      expect(response.status).toBe(403);
    });
    it("Should answer 404 if try to send bad url", async () => {
      const response = await request(app)
        .delete("/media")
        .set("authorization", "Bearer tester")
        .send({ url: "https://google.com" })
        .set("authorization", "Bearer tester");
      expect(deleteFromS3).toBeCalledTimes(0);
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Bad file path");
    });
    it("Should answer 404 if try to send url in a folder of another user", async () => {
      const response = await request(app)
        .delete("/media")
        .send({
          url: "https://s3.eu-west-1.amazonaws.com/media.bucket/media/T169/image_123456789.png",
        })
        .set("authorization", "Bearer tester");
      expect(deleteFromS3).toBeCalledTimes(0);
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Bad file path");
    });
    it("Should answer 200 if send correct url as logged user", async () => {
      const response = await request(app)
        .delete("/media")
        .send({
          url: "https://s3.eu-west-1.amazonaws.com/media.bucket/media/T1/image_123456789.png",
        })
        .set("authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(deleteFromS3).toBeCalledTimes(1);
      expect(response.body).toEqual({});
    });
  });

  describe("Route DELETE /media - media already linked", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqEvdBugMedia.do().insert({
        bug_id: 1,
        location:
          "https://s3.eu-west-1.amazonaws.com/media.bucket/media/T1/image_123456789.png",
      });
    });
    it("Should answer 403 if trying to delete linked media", async () => {
      const response = await request(app)
        .delete("/media")
        .send({
          url: "https://s3.eu-west-1.amazonaws.com/media.bucket/media/T1/image_123456789.png",
        })
        .set("authorization", "Bearer tester");
      expect(deleteFromS3).toBeCalledTimes(0);
      expect(response.status).toBe(403);
    });
  });
});
