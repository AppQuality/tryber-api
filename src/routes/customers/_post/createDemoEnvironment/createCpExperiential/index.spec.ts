import { createCpExperiential } from ".";
import { tryber } from "@src/features/database";

describe("createCpExperiential", () => {
  const targetCampaignId = 69;
  const targetPorjectId = 6969;
  const transcript_1 = `{
    "speakers": 2, 
    "paragraphs": [
      {
        "end": 0.65999997, 
        "text": "Bene?", 
        "start": 0.16, 
        "words": [
          {
          "end": 0.65999997, 
          "word": "Bene?", 
          "start": 0.16, 
          "speaker": 0
          }
        ], 
        "speaker": 0
      }, {
        "end": 2.6599998, 
        "text": "Sì la vedo la sento bene", 
        "start": 0.88, 
        "words": [
          {
            "end": 1.1999999, 
            "word": "Sì", 
            "start": 0.88, 
            "speaker": 1
          }, {
            "end": 1.4399999, 
            "word": "la", 
            "start": 1.1999999, 
            "speaker": 1
          }, {
            "end": 1.5999999, 
            "word": "vedo", 
            "start": 1.4399999, 
            "speaker": 1
          }, {
            "end": 1.8399999, 
            "word": "la", 
            "start": 1.5999999, 
            "speaker": 1
          }
        ]
      }
    ]
  }`;

  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: targetCampaignId,
      title: "Title - Functional Campaign",
      description: "Functional Campaign",
      campaign_type: 1,
      campaign_type_id: 1,
      project_id: 6969,
      platform_id: 1,
      start_date: "2021-01-01",
      end_date: "2021-01-01",
      page_preview_id: 1,
      page_manual_id: 1,
      pm_id: 1,
      customer_id: 1,
      customer_title: "Customer Title - Functional Campaign",
    });
    await tryber.tables.WpAppqCampaignTask.do().insert([
      {
        id: 10,
        campaign_id: targetCampaignId,
        title: "Title - Campaign Task10",
        content: "Functional Campaign",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        simple_title: "simple_title",
        info: "info",
        prefix: "prefix",
      },
      {
        id: 20,
        campaign_id: 70,
        title: "Title - Campaign Task20",
        content: "Functional Campaign",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        simple_title: "simple_title",
        info: "info",
        prefix: "prefix",
      },
      {
        id: 999,
        campaign_id: 9999,
        title: "Title - Campaign Task other cp",
        content: "Functional Campaign",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        simple_title: "simple_title",
        info: "info",
        prefix: "prefix",
      },
    ]);
    await tryber.tables.WpAppqCampaignTaskGroup.do().insert([
      {
        task_id: 10,
        group_id: 1,
      },
      {
        task_id: 20,
        group_id: 0,
      },
      {
        task_id: 999,
        group_id: 0,
      },
    ]);
    await tryber.tables.WpAppqUserTask.do().insert([
      {
        id: 100,
        task_id: 10,
        tester_id: 11111,
        is_completed: 1,
      },
      {
        id: 101,
        task_id: 10,
        tester_id: 32,
        is_completed: 0,
      },
      {
        id: 102,
        task_id: 999,
        tester_id: 32,
        is_completed: 1,
      },
    ]);
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
      {
        user_id: 11111,
        campaign_id: targetCampaignId,
      },
      {
        user_id: 32,
        campaign_id: targetCampaignId,
      },
      {
        user_id: 32,
        campaign_id: 9999,
      },
    ]);
    await tryber.tables.WpAppqUserTaskMedia.do().insert([
      {
        id: 10,
        campaign_task_id: 10,
        user_task_id: 100,
        tester_id: 11111,
        location: "location10",
      },
      {
        id: 20,
        campaign_task_id: 20,
        user_task_id: 101,
        tester_id: 11111,
        location: "location20",
      },
      {
        id: 999,
        campaign_task_id: 999,
        user_task_id: 100,
        tester_id: 32,
        location: "location999",
      },
    ]);
    await tryber.tables.WpAppqUsecaseMediaObservations.do().insert([
      {
        id: 10,
        media_id: 10,
        video_ts: 10,
        video_ts_end: 20,
        name: "name",
        description: "description",
        ux_note: "ux_note",
      },
      {
        id: 20,
        media_id: 20,
        video_ts: 10,
        video_ts_end: 30,
        name: "name",
        description: "description",
        ux_note: "ux_note",
      },
      {
        id: 999,
        media_id: 999,
        video_ts: 10,
        video_ts_end: 30,
        name: "name",
        description: "description",
        ux_note: "ux_note",
      },
    ]);
    await tryber.tables.UxCampaignData.do().insert([
      {
        id: 1,
        campaign_id: targetCampaignId,
        published: 1,
        methodology_type: "metodology1",
        methodology_description: "methodology_description",
        goal: "goal",
        users: 15,
      },
      {
        id: 2,
        campaign_id: 9999,
        published: 1,
        methodology_type: "metodology1",
        methodology_description: "methodology_description",
        goal: "goal",
        users: 15,
      },
    ]);
    await tryber.tables.UxCampaignSentiments.do().insert([
      {
        id: 1,
        campaign_id: targetCampaignId,
        cluster_id: 10,
        value: 5,
        comment: "comment",
      },
      {
        id: 2,
        campaign_id: 999,
        cluster_id: 99,
        value: 1,
        comment: "comment2",
      },
    ]);
    await tryber.tables.MediaTranscripts.do().insert([
      {
        id: 11,
        media_id: 10,
        transcript: transcript_1,
        language: "it",
      },
      {
        id: 22,
        media_id: 20,
        transcript: transcript_1,
        language: "en",
      },
      {
        id: 999,
        media_id: 999,
        transcript: transcript_1,
        language: "zh",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignTask.do().delete();
    await tryber.tables.WpAppqCampaignTaskGroup.do().delete();
    await tryber.tables.WpAppqUserTask.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.WpAppqUserTaskMedia.do().delete();
    await tryber.tables.WpAppqUsecaseMediaObservations.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignSentiments.do().delete();
  });

  it("Should insert one row in wp_appq_evd_campaigns", async () => {
    const cpDatasBefore = await tryber.tables.WpAppqEvdCampaign.do().select();
    await createCpExperiential({
      projectId: targetPorjectId,
      sourceCpId: targetCampaignId,
    });
    const cpDatasAfter = await tryber.tables.WpAppqEvdCampaign.do().select();
    expect(cpDatasAfter.length).toEqual(cpDatasBefore.length + 1);
  });
  it("Return id 0 if the source campaign does not exist", async () => {
    const cpId = await createCpExperiential({
      projectId: targetPorjectId,
      sourceCpId: 99999,
    });
    expect(cpId).toMatchObject({
      cpIdExperiential: 0,
    });
  });
  it("Should insert the experiential campaign with same data the target campaign except projectId", async () => {
    const sourceCpData = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where("id", targetCampaignId)
      .first();
    const newCp = await createCpExperiential({
      projectId: targetPorjectId,
      sourceCpId: targetCampaignId,
    });
    const newCpData = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where("id", newCp.cpIdExperiential)
      .first();
    expect(newCpData).toEqual({
      ...sourceCpData,
      id: newCp.cpIdExperiential,
    });
  });
  it("Should return the id of the inserted campaign", async () => {
    const newCp = await createCpExperiential({
      projectId: targetPorjectId,
      sourceCpId: targetCampaignId,
    });
    expect(newCp).toMatchObject({
      cpIdExperiential: expect.any(Number),
    });
    expect(newCp.cpIdExperiential).toBeGreaterThan(0);
  });
  it("Should insert the experiential campaign with projectId equal to target project id", async () => {
    const newCp = await createCpExperiential({
      projectId: targetPorjectId,
      sourceCpId: targetCampaignId,
    });
    const newCpData = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id", "project_id")
      .where("id", newCp.cpIdExperiential)
      .first();
    expect(newCpData).toEqual({
      id: newCp.cpIdExperiential,
      project_id: targetPorjectId,
    });
  });
  it("Should insert uxData equal to source data with updated campaignId", async () => {
    const uxDataBefore = await tryber.tables.UxCampaignData.do().select();
    const newCp = await createCpExperiential({
      projectId: targetPorjectId,
      sourceCpId: targetCampaignId,
    });
    const uxDataAfter = await tryber.tables.UxCampaignData.do().select();
    expect(uxDataAfter.length).toBeGreaterThan(uxDataBefore.length);

    const uxColumns = [
      "goal",
      "methodology_description",
      "methodology_type",
      "published",
      "users",
    ];
    const sourceUxData = await tryber.tables.UxCampaignData.do()
      .select(uxColumns)
      .where("campaign_id", targetCampaignId)
      .first();
    const newUxData = await tryber.tables.UxCampaignData.do()
      .select(uxColumns)
      .where("campaign_id", newCp.cpIdExperiential)
      .first();
    expect(newUxData).toMatchObject(sourceUxData ?? {});
  });
  it("Should insert sentiments", async () => {
    const sentimentBefore =
      await tryber.tables.UxCampaignSentiments.do().select();
    const newpc = await createCpExperiential({
      projectId: targetPorjectId,
      sourceCpId: targetCampaignId,
    });
    const sentimentAfter =
      await tryber.tables.UxCampaignSentiments.do().select();
    expect(sentimentAfter.length).toBeGreaterThan(sentimentBefore.length);

    const sourceSentiment = await tryber.tables.UxCampaignSentiments.do()
      .select("value", "comment")
      .where("campaign_id", targetCampaignId);
    expect(sourceSentiment.length).toBe(1);
    const newSentiment = await tryber.tables.UxCampaignSentiments.do()
      .select("value", "comment")
      .where("campaign_id", newpc.cpIdExperiential);
    expect(newSentiment.length).toBe(1);
    expect(newSentiment[0]).toMatchObject(sourceSentiment[0]);
  });
  it("Should insert campaignTasks", async () => {
    const campaignTasksBefore =
      await tryber.tables.WpAppqCampaignTask.do().select();
    const newpc = await createCpExperiential({
      projectId: targetPorjectId,
      sourceCpId: targetCampaignId,
    });
    const campaignTasksAfter =
      await tryber.tables.WpAppqCampaignTask.do().select();
    expect(campaignTasksAfter.length).toBeGreaterThan(
      campaignTasksBefore.length
    );
    const usecasesColumns = [
      "title",
      "content",
      "is_required",
      "simple_title",
      "info",
      "prefix",
    ];
    const sourceCampaignTasks = await tryber.tables.WpAppqCampaignTask.do()
      .select(usecasesColumns)
      .where("campaign_id", targetCampaignId);
    expect(sourceCampaignTasks.length).toBe(1);
    const newCampaignTasks = await tryber.tables.WpAppqCampaignTask.do()
      .select(usecasesColumns)
      .where("campaign_id", newpc.cpIdExperiential);
    expect(newCampaignTasks.length).toBe(1);
    expect(newCampaignTasks).toMatchObject(sourceCampaignTasks);
  });
  it("Should insert userTasks", async () => {
    const userTasksBefore = await tryber.tables.WpAppqUserTask.do().select();
    const newpc = await createCpExperiential({
      projectId: targetPorjectId,
      sourceCpId: targetCampaignId,
    });
    const userTasksAfter = await tryber.tables.WpAppqUserTask.do().select();
    expect(userTasksAfter.length).toBeGreaterThan(userTasksBefore.length);
    const usecasesColumns = ["tester_id", "is_completed"];
    const sourceUserTasks = await tryber.tables.WpAppqUserTask.do()
      .select(usecasesColumns)
      .whereIn("task_id", [10]);
    expect(sourceUserTasks.length).toBe(2);
    const newUsecases = (
      await tryber.tables.WpAppqCampaignTask.do()
        .select("id")
        .where("campaign_id", newpc.cpIdExperiential)
    ).map((ct) => ct.id);
    const newUserTasks = await tryber.tables.WpAppqUserTask.do()
      .select(usecasesColumns)
      .whereIn("task_id", newUsecases);
    expect(newUserTasks.length).toBe(2);
    expect(newUserTasks).toMatchObject(sourceUserTasks);
  });
  it("Should insert userTaskMedia", async () => {
    const userTaskMediaBefore =
      await tryber.tables.WpAppqUserTaskMedia.do().select();
    const newpc = await createCpExperiential({
      projectId: targetPorjectId,
      sourceCpId: targetCampaignId,
    });
    //78
    const userTaskMediaAfter =
      await tryber.tables.WpAppqUserTaskMedia.do().select();
    expect(userTaskMediaAfter.length).toBeGreaterThan(
      userTaskMediaBefore.length
    );
    const videoColumns = ["tester_id", "location"];
    const sourceUserTaskMedia = await tryber.tables.WpAppqUserTaskMedia.do()
      .select(videoColumns)
      .where("campaign_task_id", 10);
    expect(sourceUserTaskMedia.length).toBe(1);
    const newUsecases = (
      await tryber.tables.WpAppqCampaignTask.do()
        .select("id")
        .where("campaign_id", newpc.cpIdExperiential)
    ).map((ct) => ct.id);
    const newUserTaskMedia = await tryber.tables.WpAppqUserTaskMedia.do()
      .select(videoColumns)
      .whereIn("campaign_task_id", newUsecases);
    expect(newUserTaskMedia.length).toBe(1);
    expect(newUserTaskMedia[0]).toMatchObject(sourceUserTaskMedia[0]);
  });

  it("Should insert observations", async () => {
    const observationsBefore =
      await tryber.tables.WpAppqUsecaseMediaObservations.do().select();
    const newpc = await createCpExperiential({
      projectId: targetPorjectId,
      sourceCpId: targetCampaignId,
    });
    const observationsAfter =
      await tryber.tables.WpAppqUsecaseMediaObservations.do().select();
    expect(observationsAfter.length).toBeGreaterThan(observationsBefore.length);

    const mediaColumns = [
      "video_ts",
      "video_ts_end",
      "name",
      "description",
      "ux_note",
    ];
    const sourceObservations =
      await tryber.tables.WpAppqUsecaseMediaObservations.do()
        .select(mediaColumns)
        .where("media_id", 10);
    expect(sourceObservations.length).toBe(1);
    const newCampaignTasksIds = (
      await tryber.tables.WpAppqCampaignTask.do()
        .select("id")
        .where("campaign_id", newpc.cpIdExperiential)
    ).map((ct) => ct.id);
    const newMediaIds = (
      await tryber.tables.WpAppqUserTaskMedia.do()
        .select("id")
        .whereIn("campaign_task_id", newCampaignTasksIds)
    ).map((ct) => ct.id);
    const newObservations =
      await tryber.tables.WpAppqUsecaseMediaObservations.do()
        .select(mediaColumns)
        .whereIn("media_id", newMediaIds);
    expect(newObservations.length).toBe(1);
    expect(newObservations).toMatchObject(sourceObservations);
  });

  it("Should insert transcritps", async () => {
    const transcriptsBefore =
      await tryber.tables.MediaTranscripts.do().select();
    const newpc = await createCpExperiential({
      projectId: targetPorjectId,
      sourceCpId: targetCampaignId,
    });
    const transcriptsAfter = await tryber.tables.MediaTranscripts.do().select();
    expect(transcriptsAfter.length).toBeGreaterThan(transcriptsBefore.length);

    const newCampaignTasksIds = (
      await tryber.tables.WpAppqCampaignTask.do()
        .select("id")
        .where("campaign_id", newpc.cpIdExperiential)
    ).map((ct) => ct.id);
    const newMediaIds = (
      await tryber.tables.WpAppqUserTaskMedia.do()
        .select("id")
        .whereIn("campaign_task_id", newCampaignTasksIds)
    ).map((ct) => ct.id);
    const sourceTranscripts = await tryber.tables.MediaTranscripts.do()
      .select("transcript", "language")
      .whereIn("media_id", [10]);
    expect(sourceTranscripts.length).toBe(1);
    const newTranscripts = await tryber.tables.MediaTranscripts.do()
      .select("transcript", "language")
      .whereIn("media_id", newMediaIds);
    expect(newTranscripts.length).toBe(1);
    expect(newTranscripts).toMatchObject(sourceTranscripts);
  });
  // it("Should insert translations", async () => {});
  // it("Should insert tagGroups", async () => {});
  // it("Should insert tags", async () => {});
});
