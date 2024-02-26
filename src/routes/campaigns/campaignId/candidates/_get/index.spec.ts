import Campaigns from "@src/__mocks__/mockedDb/campaign";
import Candidate from "@src/__mocks__/mockedDb/cpHasCandidates";
import DeviceOsVersion from "@src/__mocks__/mockedDb/deviceOs";
import DeviceOs from "@src/__mocks__/mockedDb/devicePlatform";
import UserLevels from "@src/__mocks__/mockedDb/levels";
import Levels from "@src/__mocks__/mockedDb/levelsDefinition";
import PreselectionForm from "@src/__mocks__/mockedDb/preselectionForm";
import preselectionFormData from "@src/__mocks__/mockedDb/preselectionFormData";
import PreselectionFormFields from "@src/__mocks__/mockedDb/preselectionFormFields";
import Profile from "@src/__mocks__/mockedDb/profile";
import TesterDevices from "@src/__mocks__/mockedDb/testerDevice";
import WpUsers from "@src/__mocks__/mockedDb/wp_users";
import app from "@src/app";
import request from "supertest";

const users = {
  1: { testerId: 1, wpUserId: 1, levelId: 10 },
  2: { testerId: 4, wpUserId: 5, levelId: 30 },
  3: { testerId: 2, wpUserId: 6, levelId: 10 },
  4: { testerId: 3, wpUserId: 7, levelId: 20 },
  5: { testerId: 10, wpUserId: 9, levelId: 10 },
  6: { testerId: 5, wpUserId: 4, levelId: 10 },
  7: { testerId: 8, wpUserId: 8, levelId: 10 },
  8: { testerId: 9, wpUserId: 2, levelId: 10 },
};
describe("GET /campaigns/:campaignId/candidates ", () => {
  beforeAll(async () => {
    await Campaigns.insert({ id: 1 });
    await Levels.insert({ id: 10, name: "Bronze" });
    await Levels.insert({ id: 20, name: "Silver" });
    await Levels.insert({ id: 30, name: "Gold" });

    await Profile.insert({
      id: users[1].testerId,
      wp_user_id: users[1].wpUserId,
    });
    await WpUsers.insert({ ID: users[1].wpUserId });

    await Profile.insert({
      id: users[2].testerId,
      wp_user_id: users[2].wpUserId,
      name: "John",
      surname: "Doe",
      total_exp_pts: 100,
    });
    await UserLevels.insert({
      id: 1,
      tester_id: users[2].testerId,
      level_id: users[2].levelId,
    });
    await WpUsers.insert({ ID: users[2].wpUserId });
    await Candidate.insert({
      user_id: users[2].wpUserId,
      campaign_id: 1,
      accepted: 0,
      devices: "1",
    });
    await TesterDevices.insert({
      id: 1,
      id_profile: users[2].testerId,
      form_factor: "Smartphone",
      manufacturer: "Apple",
      model: "iPhone 11",
      platform_id: 1,
      os_version_id: 1,
      enabled: 1,
    });
    await DeviceOs.insert({
      id: 1,
      name: "iOS",
    });
    await DeviceOsVersion.insert({
      id: 1,
      display_name: "13.3.1",
    });

    await TesterDevices.insert({
      id: 10,
      id_profile: users[2].testerId,
      form_factor: "Smartphone",
      manufacturer: "Apple",
      model: "iPhone 9",
      platform_id: 1,
      os_version_id: 1,
      enabled: 1,
    });

    await Profile.insert({
      id: users[3].testerId,
      wp_user_id: users[3].wpUserId,
      name: "Walter",
      surname: "White",
      total_exp_pts: 1000,
    });
    await UserLevels.insert({
      id: 2,
      tester_id: users[3].testerId,
      level_id: users[3].levelId,
    });
    await WpUsers.insert({ ID: users[3].wpUserId });
    await Candidate.insert({
      user_id: users[3].wpUserId,
      campaign_id: 1,
      accepted: 0,
      devices: "2,3",
    });

    await TesterDevices.insert({
      id: 2,
      id_profile: users[3].testerId,
      form_factor: "PC",
      manufacturer: "-",
      model: "-",
      platform_id: 2,
      os_version_id: 2,
      enabled: 1,
    });
    await DeviceOs.insert({
      id: 2,
      name: "Windows",
    });
    await DeviceOsVersion.insert({
      id: 2,
      display_name: "XP",
    });
    await DeviceOsVersion.insert({
      id: 3,
      display_name: "Vista",
    });

    await TesterDevices.insert({
      id: 3,
      id_profile: users[3].testerId,
      manufacturer: "Apple",
      model: "iPhone 11",
      platform_id: 1,
      os_version_id: 1,
      enabled: 1,
    });

    await Profile.insert({
      id: users[4].testerId,
      wp_user_id: users[4].wpUserId,
      name: "Jesse",
      surname: "Pinkman",
      total_exp_pts: 2,
    });
    await UserLevels.insert({
      id: 3,
      tester_id: users[4].testerId,
      level_id: users[4].levelId,
    });
    await WpUsers.insert({ ID: users[4].wpUserId });
    await Candidate.insert({
      user_id: users[4].wpUserId,
      campaign_id: 1,
      accepted: 0,
      devices: "0",
    });

    await TesterDevices.insert({
      id: 4,
      id_profile: users[4].testerId,
      form_factor: "PC",
      manufacturer: "-",
      model: "-",
      platform_id: 2,
      os_version_id: 3,
      enabled: 1,
    });
    await TesterDevices.insert({
      id: 5,
      id_profile: users[4].testerId,
      manufacturer: "Apple",
      model: "iPhone 11",
      platform_id: 1,
      os_version_id: 1,
      enabled: 1,
    });
    await TesterDevices.insert({
      id: 6,
      id_profile: users[4].testerId,
      manufacturer: "Apple",
      model: "iPhone 11",
      platform_id: 1,
      os_version_id: 1,
    });

    await WpUsers.insert({ ID: users[5].wpUserId });
    await Profile.insert({
      id: users[5].testerId,
      wp_user_id: users[5].wpUserId,
      name: "Jesse",
      surname: "Pinkman",
      total_exp_pts: 2,
    });
    await Candidate.insert({
      user_id: users[5].wpUserId,
      campaign_id: 1,
      accepted: 1,
    });

    await Profile.insert({
      id: users[6].testerId,
      wp_user_id: users[6].wpUserId,
      name: "Deleted User",
    });
    await WpUsers.insert({ ID: users[6].wpUserId });
    await Candidate.insert({
      user_id: users[6].wpUserId,
      campaign_id: 1,
      accepted: 0,
    });

    await Profile.insert({
      id: users[7].testerId,
      wp_user_id: users[7].wpUserId,
    });
    await WpUsers.insert({ ID: users[7].wpUserId });
    await Candidate.insert({
      user_id: users[7].wpUserId,
      campaign_id: 1,
      accepted: 0,
      devices: "0",
    });

    await TesterDevices.insert({
      id: 7,
      id_profile: users[7].testerId,
      manufacturer: "Apple",
      model: "iPhone 11",
      platform_id: 1,
      os_version_id: 1,
      enabled: 0,
    });
    await Profile.insert({
      id: users[8].testerId,
      wp_user_id: users[8].wpUserId,
    });
    await WpUsers.insert({ ID: users[8].wpUserId });
    await Candidate.insert({
      user_id: users[8].wpUserId,
      campaign_id: 1,
      accepted: 0,
      devices: "8",
    });

    await TesterDevices.insert({
      id: 8,
      id_profile: users[8].testerId,
      manufacturer: "Apple",
      model: "iPhone 11",
      platform_id: 1,
      os_version_id: 1,
      enabled: 0,
    });

    await PreselectionForm.insert({ id: 1, campaign_id: 1, name: "Form 1" });
    await PreselectionFormFields.insert({
      id: 1,
      form_id: 1,
      question: "Field 1",
    });
    await PreselectionFormFields.insert({
      id: 2,
      form_id: 1,
      question: "Field 2",
      short_name: "ShortField 2",
    });
    await PreselectionFormFields.insert({
      id: 4,
      form_id: 1,
      question: "Field 4",
    });
    await PreselectionForm.insert({ id: 2, campaign_id: 5, name: "Form 2" });
    await PreselectionFormFields.insert({
      id: 3,
      form_id: 2,
      question: "Field 3",
    });

    await preselectionFormData.insert({
      id: 1,
      tester_id: users[2].testerId,
      field_id: 1,
      value: "Value 1",
    });
    await preselectionFormData.insert({
      id: 2,
      tester_id: users[3].testerId,
      field_id: 1,
      value: "Value 2",
    });
    await preselectionFormData.insert({
      id: 3,
      tester_id: users[4].testerId,
      field_id: 1,
      value: "Value 3",
    });
    await preselectionFormData.insert({
      id: 4,
      tester_id: users[2].testerId,
      field_id: 2,
      value: "Value 4",
    });
    await preselectionFormData.insert({
      id: 5,
      tester_id: users[3].testerId,
      field_id: 2,
      value: "Value 5",
    });
    await preselectionFormData.insert({
      id: 6,
      tester_id: users[4].testerId,
      field_id: 2,
      value: "Value 6",
    });
    await preselectionFormData.insert({
      id: 7,
      tester_id: users[4].testerId,
      field_id: 3,
      value: "Value Invalid",
    });

    await preselectionFormData.insert({
      id: 8,
      tester_id: users[2].testerId,
      field_id: 1,
      value: "Value 8",
    });
  });
  afterAll(async () => {
    await Campaigns.clear();
    await DeviceOs.clear();
    await DeviceOsVersion.clear();
    await Candidate.clear();
    await WpUsers.clear();
    await Profile.clear();
    await UserLevels.clear();
    await Levels.clear();
    await PreselectionForm.clear();
    await PreselectionFormFields.clear();
  });
  it("should answer 403 if user is not logged in ", async () => {
    const response = await request(app).get("/campaigns/1/candidates");

    expect(response.status).toBe(403);
  });
  it("should answer 403 if user has not olp appq_tester_selection ", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/")
      .set("authorization", `Bearer tester`);
    expect(response.status).toBe(403);
  });
  it("should answer 200 if user has olp appq_tester_selection ", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.status).toBe(200);
  });
  it("should answer 404 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/campaigns/100/candidates/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.status).toBe(404);
  });
  it("should answer a list of tester ids ", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toBe(3);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 4,
        }),
        expect.objectContaining({
          id: 2,
        }),
        expect.objectContaining({
          id: 3,
        }),
      ])
    );
  });
  it("should answer a list of tester name and surnames ", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toBe(3);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "John",
          surname: "Doe",
        }),
        expect.objectContaining({
          name: "Walter",
          surname: "White",
        }),
        expect.objectContaining({
          name: "Jesse",
          surname: "Pinkman",
        }),
      ])
    );
  });
  it("should answer a list of experience points ", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toBe(3);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          experience: 100,
        }),
        expect.objectContaining({
          experience: 1000,
        }),
        expect.objectContaining({
          experience: 2,
        }),
      ])
    );
  });

  it("should answer a list of levels ", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toBe(3);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: "Bronze",
        }),
        expect.objectContaining({
          level: "Silver",
        }),
        expect.objectContaining({
          level: "Gold",
        }),
      ])
    );
  });

  it("should answer a list of devices ", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toBe(3);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          devices: [
            {
              id: 1,
              manufacturer: "Apple",
              model: "iPhone 11",
              os: "iOS",
              osVersion: "13.3.1",
            },
          ],
        }),
        expect.objectContaining({
          devices: [
            {
              id: 2,
              os: "Windows",
              osVersion: "XP",
            },
            {
              id: 3,
              manufacturer: "Apple",
              model: "iPhone 11",
              os: "iOS",
              osVersion: "13.3.1",
            },
          ],
        }),
        expect.objectContaining({
          devices: [
            {
              id: 4,
              os: "Windows",
              osVersion: "Vista",
            },
            {
              id: 5,
              manufacturer: "Apple",
              model: "iPhone 11",
              os: "iOS",
              osVersion: "13.3.1",
            },
          ],
        }),
      ])
    );
  });

  // TODO: REMOVE

  // it("should order by level id", async () => {
  //   const response = await request(app)
  //     .get("/campaigns/1/candidates/")
  //     .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
  //   expect(response.body).toHaveProperty("results");
  //   expect(response.body.results.length).toBe(3);
  //   expect(response.body.results.map((r: { id: number }) => r.id)).toEqual([
  //     users[2].testerId,
  //     users[4].testerId,
  //     users[3].testerId,
  //   ]);
  // });

  it("should allow pagination of one element", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/?start=1&limit=1")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toBe(1);
    expect(response.body.results.map((r: { id: number }) => r.id)).toEqual([
      users[4].testerId,
    ]);
  });
  it("should allow pagination of two elements", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/?start=1&limit=2")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toBe(2);
    expect(response.body.results.map((r: { id: number }) => r.id)).toEqual([
      users[4].testerId,
      users[3].testerId,
    ]);
  });
  it("should return the start value", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/?start=2&limit=1")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("start", 2);
  });
  it("should return the limit value", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/?start=2&limit=1")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("limit", 1);
  });
  it("should return the size", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/?start=1&limit=1")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("size", 1);
  });
  it("should return the total", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/?start=1&limit=1")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("total", 3);
  });

  it("should allow passing a list of questions", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/?fields=question_1,question_2")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.status).toBe(200);
  });
  it("should return 403 if the questions do not belong to a form linked with the campaign", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/?fields=question_3")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.status).toBe(403);
  });
  it("should allow passing append the questions to the results if they are queried", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/?fields=question_1,question_2")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: users[2].testerId,
          questions: [
            { id: 1, title: "Field 1", value: "Value 1, Value 8" },
            { id: 2, title: "ShortField 2", value: "Value 4" },
          ],
        }),
        expect.objectContaining({
          id: users[3].testerId,
          questions: [
            { id: 1, title: "Field 1", value: "Value 2" },
            { id: 2, title: "ShortField 2", value: "Value 5" },
          ],
        }),
        expect.objectContaining({
          id: users[4].testerId,
          questions: [
            { id: 1, title: "Field 1", value: "Value 3" },
            { id: 2, title: "ShortField 2", value: "Value 6" },
          ],
        }),
      ])
    );
  });
  it("should return short_name of questions to the results if questions are queried and is set shortName", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/?fields=question_1,question_2")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body.results[0]).toHaveProperty("questions");
    expect(response.body.results[0].questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 2,
          title: "ShortField 2",
          value: "Value 4",
        }),
      ])
    );
    expect(response.body.results[1]).toHaveProperty("questions");
    expect(response.body.results[1].questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 2,
          title: "ShortField 2",
          value: "Value 6",
        }),
      ])
    );
    expect(response.body.results[2]).toHaveProperty("questions");
    expect(response.body.results[2].questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 2,
          title: "ShortField 2",
          value: "Value 5",
        }),
      ])
    );
  });

  it("should answer with a dash if the user is without data for a question", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/?fields=question_4")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body.results[0]).toHaveProperty("questions");
    expect(response.body.results[0].questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 4,
          title: "Field 4",
          value: "-",
        }),
      ])
    );
    expect(response.body.results[1]).toHaveProperty("questions");
    expect(response.body.results[1].questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 4,
          title: "Field 4",
          value: "-",
        }),
      ])
    );
  });

  // TODO: REMOVE
  // it("Should filter by os excluding values", async () => {
  //   const response = await request(app)
  //     .get("/campaigns/1/candidates/?filterByExclude[os]=os")
  //     .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
  //   expect(response.body).toHaveProperty("results");
  //   expect(response.body.results.length).toBe(2);
  //   expect(response.body.results).toEqual([
  //     expect.objectContaining({
  //       id: users[4].testerId,
  //       devices: [{ id: 4, os: "Windows", osVersion: "Vista" }],
  //     }),
  //     expect.objectContaining({
  //       id: users[3].testerId,
  //       devices: [{ id: 2, os: "Windows", osVersion: "XP" }],
  //     }),
  //   ]);
  // });

  it("Should filter by os including values", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/?filterByInclude[os]=dow")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toBe(2);
    expect(response.body.results).toEqual([
      expect.objectContaining({
        id: users[4].testerId,
        devices: [{ id: 4, os: "Windows", osVersion: "Vista" }],
      }),
      expect.objectContaining({
        id: users[3].testerId,
        devices: [{ id: 2, os: "Windows", osVersion: "XP" }],
      }),
    ]);
  });

  // TODO: REMOVE
  // it("Should filter by os including and excluding values", async () => {
  //   const response = await request(app)
  //     .get(
  //       "/campaigns/1/candidates/?filterByInclude[os]=dow&&filterByExclude[os]=vista"
  //     )
  //     .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
  //   expect(response.body).toHaveProperty("results");
  //   expect(response.body.results.length).toBe(1);
  //   expect(response.body.results).toEqual([
  //     expect.objectContaining({
  //       id: users[3].testerId,
  //       devices: [{ id: 2, os: "Windows", osVersion: "XP" }],
  //     }),
  //   ]);
  // });
});
