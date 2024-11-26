import { tryber } from "@src/features/database";

interface TaggingToolData {
  userTasksMedia?: any[];
  observations?: any[];
  tags?: any[];
  tagTypes?: any[];
  tagLinks?: any[];
  transcripts?: any[];
  translations?: any[];
}

async function getExperientialData({
  cpId,
}: {
  cpId: number;
}): Promise<TaggingToolData> {
  const res: TaggingToolData = {};

  // Campaign tasks
  const campaignTasksIds = await tryber.tables.WpAppqCampaignTask.do()
    .select("id")
    .where("campaign_id", cpId);

  // User tasks media
  const videos = await tryber.tables.WpAppqUserTaskMedia.do()
    .select()
    .whereIn(
      "campaign_task_id",
      campaignTasksIds.map((ct) => ct.id)
    );

  if (videos.length > 0) {
    res.userTasksMedia = videos;

    // Media Observations
    const observations = await tryber.tables.WpAppqUsecaseMediaObservations.do()
      .select("wp_appq_usecase_media_observations.*")
      .join(
        "wp_appq_user_task_media",
        "wp_appq_usecase_media_observations.media_id",
        "wp_appq_user_task_media.id"
      )
      .join(
        "wp_appq_campaign_task",
        "wp_appq_user_task_media.campaign_task_id",
        "wp_appq_campaign_task.id"
      )
      .where("wp_appq_campaign_task.campaign_id", cpId)
      .groupBy("wp_appq_usecase_media_observations.id");

    if (observations.length > 0) {
      res.observations = observations;
    }

    // Tag groups
    const tagTypes = await tryber.tables.WpAppqUsecaseMediaTagType.do()
      .select()
      .where("campaign_id", cpId);

    if (tagTypes.length > 0) {
      res.tagTypes = tagTypes;
    }

    // Tags
    const tags = await tryber.tables.WpAppqUsecaseMediaObservationsTags.do()
      .select("wp_appq_usecase_media_observations_tags.*")
      .join(
        "wp_appq_usecase_media_tag_type",
        "wp_appq_usecase_media_tag_type.id",
        "wp_appq_usecase_media_observations_tags.type"
      )
      .where("wp_appq_usecase_media_tag_type.campaign_id", cpId)
      .groupBy("wp_appq_usecase_media_observations_tags.id");

    if (tags.length > 0) {
      res.tags = tags;
    }

    // Tag links
    const tagLinks =
      await tryber.tables.WpAppqUsecaseMediaObservationsTagsLink.do()
        .select("wp_appq_usecase_media_observations_tags_link.*")
        .whereIn(
          "tag_id",
          tags.map((tag) => tag.id)
        )
        .groupBy("wp_appq_usecase_media_observations_tags_link.id");

    if (tagLinks.length > 0) {
      res.tagLinks = tagLinks;
    }

    // Transcripts
    const transcripts = await tryber.tables.MediaTranscripts.do()
      .select()
      .whereIn(
        "media_id",
        videos.map((video) => video.id)
      );
    if (transcripts.length > 0) {
      res.transcripts = transcripts;

      // Translations
      const translations = await tryber.tables.MediaTranscriptsTranslations.do()
        .select()
        .whereIn(
          "media_id",
          videos.map((video) => video.id)
        );
      if (translations.length > 0) {
        res.translations = translations;
      }
    }
  }

  return res;
}

export { getExperientialData };
