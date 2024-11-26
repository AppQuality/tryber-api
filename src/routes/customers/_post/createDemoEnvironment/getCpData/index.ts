import { tryber } from "@src/features/database";

interface CampaignData {
  campaign?: any;
  usecases?: any[];
  usecaseGroups?: any[];
  userTasks?: any[];
  candidates?: any[];
  bugs?: any[];
  bugMedias?: any[];
}

async function getCpData({ cpId }: { cpId: number }): Promise<CampaignData> {
  const res: CampaignData = {};
  const cpData = await tryber.tables.WpAppqEvdCampaign.do()
    .select()
    .where("id", cpId)
    .first();
  if (cpData) {
    res.campaign = cpData;
  }

  const usecases = await tryber.tables.WpAppqCampaignTask.do()
    .select()
    .where("campaign_id", cpId);
  if (usecases.length > 0) {
    res.usecases = usecases;

    const usecaseGroups = await tryber.tables.WpAppqCampaignTaskGroup.do()
      .select()
      .whereIn(
        "task_id",
        usecases.map((usecase) => usecase.id)
      );
    if (usecaseGroups.length > 0) {
      res.usecaseGroups = usecaseGroups;
    }

    const userTasks = await tryber.tables.WpAppqUserTask.do()
      .select()
      .whereIn(
        "task_id",
        usecases.map((usecase) => usecase.id)
      );
    if (userTasks.length > 0) {
      res.userTasks = userTasks;
    }
  }

  const candidates = await tryber.tables.WpCrowdAppqHasCandidate.do()
    .select()
    .where("campaign_id", cpId);
  if (candidates.length > 0) {
    res.candidates = candidates;
  }

  const bugs = await tryber.tables.WpAppqEvdBug.do()
    .select()
    .where("campaign_id", cpId);

  if (bugs.length > 0) {
    res.bugs = bugs;

    const bugMedias = await tryber.tables.WpAppqEvdBugMedia.do()
      .select()
      .whereIn(
        "bug_id",
        bugs.map((bug) => bug.id)
      );
    if (bugMedias.length > 0) {
      res.bugMedias = bugMedias;
    }
  }

  return res;
}

export { getCpData };
