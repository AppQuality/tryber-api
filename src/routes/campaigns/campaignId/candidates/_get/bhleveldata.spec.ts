import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const bug = {
  reviewer: 1,
  last_editor_id: 1,
  status_id: 2,
};
const addNewbieRequirements = async ({
  wp_user_id,
}: {
  wp_user_id: number;
}) => {
  await tryber.tables.WpAppqEvdBug.do().insert({
    ...bug,
    wp_user_id,
    campaign_id: 2,
  });
};

const addRookieRequirements = async ({
  tester_id,
  wp_user_id,
}: {
  tester_id: number;
  wp_user_id: number;
}) => {
  await tryber.tables.WpAppqCourseTesterStatus.do().insert({
    tester_id,
    course_id: 1,
    is_completed: 1,
  });
  await tryber.tables.WpAppqEvdBug.do().insert({
    ...bug,
    wp_user_id,
    campaign_id: 2,
  });
  await tryber.tables.WpAppqEvdBug.do().insert({
    ...bug,
    wp_user_id,
    campaign_id: 2,
  });
};

const addAdvancedRequirements = async ({
  tester_id,
  wp_user_id,
}: {
  tester_id: number;
  wp_user_id: number;
}) => {
  await tryber.tables.WpAppqCourseTesterStatus.do().insert({
    tester_id,
    course_id: 1,
    is_completed: 1,
  });
  for (const i in [1, 2, 3, 4, 5]) {
    await tryber.tables.WpAppqEvdBug.do().insert({
      ...bug,
      wp_user_id,
      campaign_id: Number(i) + 1,
    });
  }
  for (const i in [1, 2]) {
    await tryber.tables.WpAppqEvdBug.do().insert({
      ...bug,
      wp_user_id,
      campaign_id: Number(i) + 1,
      severity_id: 3,
    });
  }
  for (const i in [1, 2, 3]) {
    await tryber.tables.WpAppqEvdBug.do().insert({
      ...bug,
      wp_user_id,
      campaign_id: Number(i) + 1,
      severity_id: 4,
    });
  }
};

const addVeteranRequirements = async ({
  tester_id,
  wp_user_id,
}: {
  tester_id: number;
  wp_user_id: number;
}) => {
  await tryber.tables.WpAppqCourseTesterStatus.do().insert({
    tester_id,
    course_id: 1,
    is_completed: 1,
  });
  await tryber.tables.WpAppqCourseTesterStatus.do().insert({
    tester_id,
    course_id: 2,
    is_completed: 1,
  });
  for (const i in [...Array(10).keys()]) {
    await tryber.tables.WpAppqEvdBug.do().insert({
      ...bug,
      wp_user_id,
      campaign_id: Number(i) + 1,
    });
  }
  for (const i in [...Array(5).keys()]) {
    await tryber.tables.WpAppqEvdBug.do().insert({
      ...bug,
      wp_user_id,
      campaign_id: Number(i) + 1,
      severity_id: 3,
    });
  }
  for (const i in [...Array(5).keys()]) {
    await tryber.tables.WpAppqEvdBug.do().insert({
      ...bug,
      wp_user_id,
      campaign_id: Number(i) + 1,
      severity_id: 4,
    });
  }
};

const addExpertRequirements = async ({
  tester_id,
  wp_user_id,
}: {
  tester_id: number;
  wp_user_id: number;
}) => {
  await tryber.tables.WpAppqCourseTesterStatus.do().insert({
    tester_id,
    course_id: 1,
    is_completed: 1,
  });
  await tryber.tables.WpAppqCourseTesterStatus.do().insert({
    tester_id,
    course_id: 2,
    is_completed: 1,
  });
  for (const i in [...Array(30).keys()]) {
    await tryber.tables.WpAppqEvdBug.do().insert({
      ...bug,
      wp_user_id,
      campaign_id: Number(i) + 1,
    });
  }
  for (const i in [...Array(15).keys()]) {
    await tryber.tables.WpAppqEvdBug.do().insert({
      ...bug,
      wp_user_id,
      campaign_id: Number(i) + 1,
      severity_id: 3,
    });
  }
  for (const i in [...Array(5).keys()]) {
    await tryber.tables.WpAppqEvdBug.do().insert({
      ...bug,
      wp_user_id,
      campaign_id: Number(i) + 1,
      severity_id: 4,
    });
  }
};
const addChampionRequirements = async ({
  tester_id,
  wp_user_id,
}: {
  tester_id: number;
  wp_user_id: number;
}) => {
  await tryber.tables.WpAppqCourseTesterStatus.do().insert({
    tester_id,
    course_id: 1,
    is_completed: 1,
  });
  await tryber.tables.WpAppqCourseTesterStatus.do().insert({
    tester_id,
    course_id: 2,
    is_completed: 1,
  });
  for (const i in [...Array(50).keys()]) {
    await tryber.tables.WpAppqEvdBug.do().insert({
      ...bug,
      wp_user_id,
      campaign_id: Number(i) + 1,
    });
  }
  for (const i in [...Array(40).keys()]) {
    await tryber.tables.WpAppqEvdBug.do().insert({
      ...bug,
      wp_user_id,
      campaign_id: Number(i) + 1,
      severity_id: 3,
    });
  }
  for (const i in [...Array(10).keys()]) {
    await tryber.tables.WpAppqEvdBug.do().insert({
      ...bug,
      wp_user_id,
      campaign_id: Number(i) + 1,
      severity_id: 4,
    });
  }
};

describe("GET /campaigns/:campaignId/candidates - questions ", () => {
  beforeAll(async () => {
    for (const i in [...Array(51).keys()]) {
      await tryber.tables.WpAppqEvdCampaign.do().insert({
        id: Number(i + 1),
        platform_id: 1,
        start_date: "2020-01-01",
        end_date: "2020-01-01",
        close_date: "2020-01-01",
        title: "Campaign",
        customer_title: "Customer",
        page_manual_id: 1,
        page_preview_id: 1,
        customer_id: 1,
        pm_id: 1,
        project_id: 1,
      });
    }

    const profile = {
      email: "",
      name: "pippo",
      surname: "pluto",
      education_id: 1,
      employment_id: 1,
      birth_date: "2000-01-01",
      sex: 1,
    };
    const candidate = {
      accepted: 0,
      devices: "0",
      campaign_id: 1,
    };
    const device = {
      form_factor: "Smartphone",
      manufacturer: "Apple",
      model: "iPhone 11",
      platform_id: 1,
      os_version_id: 1,
      enabled: 1,
    };
    for (const i in [1, 2, 3, 4, 5, 6]) {
      await tryber.tables.WpAppqEvdProfile.do().insert({
        ...profile,
        id: Number(i) + 1,
        wp_user_id: Number(i) + 1,
      });
      await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
        ...candidate,
        user_id: Number(i) + 1,
      });
      await tryber.tables.WpCrowdAppqDevice.do().insert({
        ...device,
        id: Number(i) + 1,
        id_profile: Number(i) + 1,
      });
    }

    const course = {
      display_name: "Course",
      excerpt: "",
      preview_content: "",
      completed_content: "",
      failed_content: "",
      point_prize: 0,
      time_length: 0,
    };
    await tryber.tables.WpAppqCourse.do().insert([
      {
        ...course,
        id: 1,
        course_level: "1",
        career: "Functional",
      },
      {
        ...course,
        id: 2,
        course_level: "2",
        career: "General",
      },
    ]);

    await addNewbieRequirements({ wp_user_id: 1 });
    await addRookieRequirements({ tester_id: 2, wp_user_id: 2 });
    await addAdvancedRequirements({ tester_id: 3, wp_user_id: 3 });
    await addVeteranRequirements({ tester_id: 4, wp_user_id: 4 });
    await addExpertRequirements({ tester_id: 5, wp_user_id: 5 });
    await addChampionRequirements({ tester_id: 6, wp_user_id: 6 });

    await tryber.tables.WpAppqEvdPlatform.do().insert({
      id: 1,
      name: "iOS",
      architecture: 1,
    });
    await tryber.tables.WpAppqOs.do().insert({
      id: 1,
      display_name: "13.3.1",
      platform_id: 1,
      main_release: 1,
      version_family: 1,
      version_number: "1",
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionForm.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().delete();
  });

  it("Should return bug hunting level", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          levels: {
            bugHunting: "Newbie",
          },
        }),
        expect.objectContaining({
          id: 2,
          levels: {
            bugHunting: "Rookie",
          },
        }),
        expect.objectContaining({
          id: 3,
          levels: {
            bugHunting: "Advanced",
          },
        }),
        expect.objectContaining({
          id: 4,
          levels: {
            bugHunting: "Veteran",
          },
        }),
        expect.objectContaining({
          id: 5,
          levels: {
            bugHunting: "Expert",
          },
        }),
        expect.objectContaining({
          id: 6,
          levels: {
            bugHunting: "Champion",
          },
        }),
      ])
    );
  });

  it("Should allow filtering by bug hunting level", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates?filterByInclude[bughunting]=Newbie")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0].id).toBe(1);
  });
  it("Should allow filtering by multiple bug hunting level", async () => {
    const response = await request(app)
      .get(
        "/campaigns/1/candidates?filterByInclude[bughunting][]=Newbie&filterByInclude[bughunting][]=Rookie"
      )
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(2);
    expect(response.body.results[0].id).toBe(2);
    expect(response.body.results[1].id).toBe(1);
  });
});
