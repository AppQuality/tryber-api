import { getExperientialData } from ".";
import { tryber } from "@src/features/database";
const targetCpId = 69;
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
describe("getExperientialData", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 69,
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
        campaign_id: 69,
        title: "Title - Campaign Task",
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
        campaign_id: 69,
        title: "Title - Campaign Task",
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
    await tryber.tables.WpAppqUserTaskMedia.do().insert([
      {
        id: 10,
        campaign_task_id: 10,
        user_task_id: 0,
        tester_id: 11111,
        location: "location",
      },
      {
        id: 20,
        campaign_task_id: 20,
        user_task_id: 0,
        tester_id: 11111,
        location: "location",
      },
      {
        id: 999,
        campaign_task_id: 999,
        user_task_id: 0,
        tester_id: 32,
        location: "location",
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
    await tryber.tables.WpAppqUsecaseMediaTagType.do().insert([
      {
        id: 10,
        campaign_id: targetCpId,
        name: "tagGroup10",
      },
      {
        id: 20,
        campaign_id: targetCpId,
        name: "tagGroup20",
      },
      {
        id: 999,
        campaign_id: 99999,
        name: "tagGroup999",
      },
    ]);
    await tryber.tables.WpAppqUsecaseMediaObservationsTags.do().insert([
      { id: 10, type: 10, name: "tagName10", style: "white" },
      { id: 20, type: 10, name: "tagName20", style: "red" },
      { id: 30, type: 20, name: "tagName30", style: "green" },
      { id: 999, type: 999, name: "tagName999", style: "blue" },
    ]);
    await tryber.tables.WpAppqUsecaseMediaObservationsTagsLink.do().insert([
      { id: 10, tag_id: 10, observation_id: 10 },
      { id: 20, tag_id: 20, observation_id: 20 },
      { id: 30, tag_id: 30, observation_id: 20 },
      { id: 999, tag_id: 999, observation_id: 999 },
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
    await tryber.tables.MediaTranscriptsTranslations.do().insert([
      { id: 11, media_id: 10, translation: "translation", language: "en" },
      { id: 22, media_id: 20, translation: "translation", language: "it" },
      { id: 999, media_id: 999, translation: "translation", language: "it" },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignTask.do().delete();
    await tryber.tables.WpAppqUserTaskMedia.do().delete();
    await tryber.tables.WpAppqUsecaseMediaObservations.do().delete();
    await tryber.tables.WpAppqUsecaseMediaTagType.do().delete();
    await tryber.tables.WpAppqUsecaseMediaObservationsTags.do().delete();
    await tryber.tables.WpAppqUsecaseMediaObservationsTagsLink.do().delete();
    await tryber.tables.MediaTranscripts.do().delete();
    await tryber.tables.MediaTranscriptsTranslations.do().delete();
  });

  it("Should return empty object if campaign does not exist", async () => {
    const cpId = 9999;
    const campaigns = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where("id", cpId);
    expect(campaigns.length).toBe(0);
    const cpData = await getExperientialData({ cpId });

    expect(cpData).toBeInstanceOf(Object);
    expect(cpData).toMatchObject({});
  });

  it("Should return userTasksMedia if campagin has usreTasksMedia", async () => {
    const data = await getExperientialData({ cpId: targetCpId });

    expect(data).toHaveProperty("userTasksMedia");
    expect(data.userTasksMedia).toHaveLength(2);
    expect(data.userTasksMedia).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 10,
          tester_id: 11111,
          campaign_task_id: 10,
          user_task_id: 0,
        }),
        expect.objectContaining({
          id: 20,
          tester_id: 11111,
          campaign_task_id: 20,
          user_task_id: 0,
        }),
      ])
    );
  });
  it("Should return campaign observation if campagin has observation", async () => {
    const data = await getExperientialData({ cpId: targetCpId });

    expect(data).toHaveProperty("observations");
    expect(data.observations).toHaveLength(2);
    expect(data.observations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 10,
          media_id: 10,
          video_ts: 10,
          video_ts_end: 20,
          name: "name",
          description: "description",
          ux_note: "ux_note",
        }),
        expect.objectContaining({
          id: 20,
          media_id: 20,
          video_ts: 10,
          video_ts_end: 30,
          name: "name",
          description: "description",
          ux_note: "ux_note",
        }),
      ])
    );
  });
  it("Should return all campaign tags", async () => {
    const data = await getExperientialData({ cpId: targetCpId });

    expect(data).toHaveProperty("tags");
    expect(data.tags).toHaveLength(3);
    expect(data.tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 10,
          type: 10,
          name: "tagName10",
          style: "white",
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }),
        expect.objectContaining({
          id: 20,
          type: 10,
          name: "tagName20",
          style: "red",
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }),
        expect.objectContaining({
          id: 30,
          type: 20,
          name: "tagName30",
          style: "green",
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }),
      ])
    );
  });
  it("Should return all campaign task groups", async () => {
    const data = await getExperientialData({ cpId: targetCpId });

    expect(data).toHaveProperty("tagTypes");
    expect(data.tagTypes).toHaveLength(2);
    expect(data.tagTypes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 10,
          campaign_id: targetCpId,
          name: "tagGroup10",
        }),
        expect.objectContaining({
          id: 20,
          campaign_id: targetCpId,
          name: "tagGroup20",
        }),
      ])
    );
  });
  it("Should return all tagsLinks with observations", async () => {
    const data = await getExperientialData({ cpId: targetCpId });

    expect(data).toHaveProperty("tagLinks");
    expect(data.tagLinks).toHaveLength(3);
    expect(data.tagLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 10,
          tag_id: 10,
          observation_id: 10,
        }),
        expect.objectContaining({
          id: 20,
          tag_id: 20,
          observation_id: 20,
        }),
        expect.objectContaining({
          id: 30,
          tag_id: 30,
          observation_id: 20,
        }),
      ])
    );
  });
  it("Should return all campaign transcripts", async () => {
    const data = await getExperientialData({ cpId: targetCpId });

    expect(data).toHaveProperty("transcripts");
    expect(data.transcripts).toHaveLength(2);
    expect(data.transcripts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 11,
          media_id: 10,
          transcript: transcript_1,
        }),
        expect.objectContaining({
          id: 22,
          media_id: 20,
          transcript: transcript_1,
        }),
      ])
    );
  });
  it("Should return all campaign transcript translations", async () => {
    const data = await getExperientialData({ cpId: targetCpId });

    expect(data).toHaveProperty("translations");
    expect(data.translations).toHaveLength(2);
    expect(data.translations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 11,
          media_id: 10,
          translation: "translation",
          language: "en",
        }),
        expect.objectContaining({
          id: 22,
          media_id: 20,
          translation: "translation",
          language: "it",
        }),
      ])
    );
  });
});
