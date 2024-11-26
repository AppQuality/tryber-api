import { copyUxData } from "../copyUxData";
import { tryber } from "@src/features/database";
import { getCpData } from "../getCpData";
import { getExperientialData } from "../getExperientialData";

async function createCpExperiential({
  projectId,
  sourceCpId,
}: {
  projectId: number;
  sourceCpId: number;
}): Promise<{ cpIdExperiential: number }> {
  const data = await getCpData({ cpId: sourceCpId });

  if (!data.campaign) return { cpIdExperiential: 0 };
  const taggingToolData = await getExperientialData({ cpId: sourceCpId });

  const oldCpId = data.campaign.id;
  data.campaign.id = undefined;

  const cpIdExperiential = await insertCampaign();

  data.campaign.id = cpIdExperiential;
  data.campaign.oldCpId = oldCpId;

  // IDs mapping OLD_ID -> NEW_ID
  const usecaseMap = new Map<number, number>();
  const userTaskMap = new Map<number, number>();
  const mediaMap = new Map<number, number>();
  const tagsTypeMap = new Map<number, number>();
  const tagsMap = new Map<number, number>();
  const observationMap = new Map<number, number>();
  const insightsMap = new Map<number, number>();

  if (cpIdExperiential) {
    // Basic Datas
    await insertCandidates();
    await insertUseCases();
    await insertUserTasks();
    await insertBugs();

    // Tagging Tool Data
    await insertVideosWithTranscriptAndTranslations();
    await insertTagTypes();
    await insertTags();
    await insertObservations();
    await insertTagLinks();
    await copyInsights();

    // Copy UX Data - ux, questions
    await copyUxData({ sourceCpId: sourceCpId, targetCpId: cpIdExperiential });
    // Copy Sentiments
    await copySentiments();
  }

  return { cpIdExperiential };

  async function copySentiments() {
    const sentiment = await tryber.tables.UxCampaignSentiments.do()
      .select()
      .where("campaign_id", sourceCpId);

    if (sentiment.length) {
      for (const sent of sentiment) {
        if (!usecaseMap.get(sent.cluster_id)) {
          console.log(
            "error on upload sentiment, not found cluster:id:",
            sent.cluster_id
          );
        }
        await tryber.tables.UxCampaignSentiments.do().insert({
          ...sent,
          id: undefined,
          campaign_id: cpIdExperiential,
          cluster_id: usecaseMap.get(sent.cluster_id),
        });
      }
    }
  }

  async function insertCampaign() {
    const newCampaign = await tryber.tables.WpAppqEvdCampaign.do()
      .insert({ ...data.campaign, project_id: projectId })
      .returning("id");
    const cpIdExperiential = newCampaign[0].id ?? newCampaign[0];
    return cpIdExperiential ?? 0;
  }

  async function insertBugs() {
    if (data.bugs) {
      for (const bug of data.bugs) {
        bug.campaign_id = cpIdExperiential;
        const oldBugId = bug.id;
        bug.id = undefined;
        const usecaseRef = data.usecases?.find(
          (usecase) => usecase.oldUsecaseId === bug.application_section_id
        );
        bug.application_section = usecaseRef?.title;
        bug.application_section_id = usecaseRef?.id;
        const newBug = await tryber.tables.WpAppqEvdBug.do()
          .insert(bug)
          .returning("id");
        const newBugId = newBug[0].id ?? newBug[0];
        bug.id = newBugId;
        bug.oldBugId = oldBugId;

        if (data.bugMedias) {
          for (const bugMedia of data.bugMedias) {
            if (bugMedia.bug_id === bug.oldBugId) {
              const oldBugMediaId = bugMedia.id;
              bugMedia.bug_id = newBugId;
              bugMedia.id = undefined;
              const newBugMedia = await tryber.tables.WpAppqEvdBugMedia.do()
                .insert(bugMedia)
                .returning("id");
              bugMedia.oldBugMediaId = oldBugMediaId;
              bugMedia.id = newBugMedia[0].id ?? newBugMedia[0];
            }
          }
        }
      }
    }
  }

  async function insertUseCases() {
    if (!data.usecases) return;

    for (const uc of data.usecases) {
      const oldUsecaseId = uc.id;
      uc.id = undefined;
      uc.campaign_id = cpIdExperiential;

      const newUseCase = await tryber.tables.WpAppqCampaignTask.do()
        .insert(uc)
        .returning("id");
      const newUseCaseId = newUseCase[0].id ?? newUseCase[0];

      usecaseMap.set(oldUsecaseId, newUseCaseId);
    }

    return true;
  }

  async function insertUserTasks() {
    if (!data.userTasks) return;

    for (const ut of data.userTasks) {
      const oldUserTaskId = ut.id;
      ut.id = undefined;
      ut.task_id = usecaseMap.get(ut.task_id);

      const newUserTask = await tryber.tables.WpAppqUserTask.do()
        .insert(ut)
        .returning("id");
      const newUserTaskId = newUserTask[0].id ?? newUserTask[0];

      userTaskMap.set(oldUserTaskId, newUserTaskId);
    }

    return true;
  }

  async function insertCandidates() {
    if (data.candidates) {
      for (const candidate of data.candidates) {
        candidate.campaign_id = cpIdExperiential;
        await tryber.tables.WpCrowdAppqHasCandidate.do().insert(candidate);
      }
    }
  }

  async function insertVideosWithTranscriptAndTranslations() {
    if (!taggingToolData.userTasksMedia) return;

    for (const video of taggingToolData.userTasksMedia) {
      const oldVideoId = video.id;

      video.id = undefined;
      video.campaign_task_id = usecaseMap.get(video.campaign_task_id);
      video.user_task_id = userTaskMap.get(video.user_task_id);
      const newVideo = await tryber.tables.WpAppqUserTaskMedia.do()
        .insert(video)
        .returning("id");
      const newVideoId = newVideo[0].id ?? newVideo[0];

      mediaMap.set(oldVideoId, newVideoId);

      // Insert Media Transcripts
      const trans = await tryber.tables.MediaTranscripts.do()
        .select()
        .where("media_id", oldVideoId)
        .first();

      if (trans) {
        await tryber.tables.MediaTranscripts.do().insert({
          ...trans,
          id: undefined,
          media_id: newVideoId,
        });
      }

      /**
       * Check if there are any translations for this video
       */
      const translation = await tryber.tables.MediaTranscriptsTranslations.do()
        .select()
        .where("media_id", oldVideoId)
        .first();

      if (translation) {
        await tryber.tables.MediaTranscriptsTranslations.do().insert({
          ...translation,
          id: undefined,
          media_id: newVideoId,
        });
      }
    }

    return true;
  }

  async function insertTagTypes() {
    if (!taggingToolData.tagTypes) return;

    for (const tagType of taggingToolData.tagTypes) {
      const oldTagTypeId = tagType.id;

      tagType.id = undefined;
      tagType.campaign_id = cpIdExperiential;

      const newTagType = await tryber.tables.WpAppqUsecaseMediaTagType.do()
        .insert(tagType)
        .returning("id");

      const newTagTypeId = newTagType[0].id ?? newTagType[0];
      tagsTypeMap.set(oldTagTypeId, newTagTypeId);
    }

    return true;
  }

  async function insertTags() {
    if (!taggingToolData.tags) return;

    for (const tag of taggingToolData.tags) {
      const oldTagId = tag.id;

      tag.id = undefined;
      tag.type = tagsTypeMap.get(tag.type);

      const newTag = await tryber.tables.WpAppqUsecaseMediaObservationsTags.do()
        .insert(tag)
        .returning("id");

      const newTagId = newTag[0].id ?? newTag[0];
      tagsMap.set(oldTagId, newTagId);
    }

    return true;
  }

  async function insertObservations() {
    if (!taggingToolData.observations) return;

    for (const observation of taggingToolData.observations) {
      const oldObservationId = observation.id;

      observation.id = undefined;
      observation.media_id = mediaMap.get(observation.media_id);

      const newObservation =
        await tryber.tables.WpAppqUsecaseMediaObservations.do()
          .insert(observation)
          .returning("id");

      observation.id = newObservation[0].id ?? newObservation[0];
      observationMap.set(oldObservationId, observation.id);
    }

    return true;
  }

  async function insertTagLinks() {
    if (!taggingToolData.tagLinks) return;

    for (const tagLink of taggingToolData.tagLinks) {
      tagLink.id = undefined;
      tagLink.tag_id = tagsMap.get(tagLink.tag_id);
      tagLink.observation_id = observationMap.get(tagLink.observation_id);

      await tryber.tables.WpAppqUsecaseMediaObservationsTagsLink.do().insert(
        tagLink
      );
    }

    return true;
  }

  async function copyInsights() {
    const insights = await tryber.tables.UxCampaignInsights.do()
      .select()
      .where("campaign_id", sourceCpId);

    if (!insights.length) return;

    for (const insight of insights) {
      const oldInsightId = insight.id;

      const newInsight = await tryber.tables.UxCampaignInsights.do()
        .insert({
          ...insight,
          id: undefined,
          campaign_id: cpIdExperiential,
          severity_id: tagsMap.get(insight.severity_id),
        })
        .returning("id");

      const newInsightId = newInsight[0].id ?? newInsight[0];
      insightsMap.set(oldInsightId, newInsightId);
    }

    // Link insights to observations
    const insightObservations =
      await tryber.tables.UxCampaignInsightsToObservations.do()
        .select()
        .whereIn(
          "insight_id",
          insights.map((insight) => insight.id)
        );

    if (insightObservations.length) {
      for (const insightObservation of insightObservations) {
        await tryber.tables.UxCampaignInsightsToObservations.do().insert({
          ...insightObservation,
          id: undefined,
          insight_id: insightsMap.get(insightObservation.insight_id),
          observation_id: observationMap.get(insightObservation.observation_id),
        });
      }
    }
  }
}

export { createCpExperiential };
