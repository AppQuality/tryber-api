import { tryber } from "@src/features/database";
import { getCpData } from "../getCpData";

async function createCpFunctional({
  projectId,
  sourceCpId,
}: {
  projectId: number;
  sourceCpId: number;
}): Promise<{ cpIdFunctional: number }> {
  const data = await getCpData({ cpId: sourceCpId });

  if (!data.campaign) return { cpIdFunctional: 0 };

  const oldCpId = data.campaign.id;
  data.campaign.id = undefined;

  const cpIdFunctional = await insertCampaign();

  data.campaign.id = cpIdFunctional;
  data.campaign.oldCpId = oldCpId;

  if (cpIdFunctional) {
    await insertCandidates();

    if (data.usecases) {
      for (const usecase of data.usecases) {
        const { oldUsecaseId, newUsecaseId } = await insertUsecase(usecase);

        await insertUserTasks(oldUsecaseId, newUsecaseId);
      }
    }

    await insertBugs();
  }

  return { cpIdFunctional };

  async function insertCampaign() {
    const newCampaign = await tryber.tables.WpAppqEvdCampaign.do()
      .insert({ ...data.campaign, project_id: projectId })
      .returning("id");
    const cpIdFunctional = newCampaign[0].id ?? newCampaign[0];
    return cpIdFunctional ?? 0;
  }

  async function insertBugs() {
    if (data.bugs) {
      for (const bug of data.bugs) {
        bug.campaign_id = cpIdFunctional;
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

  async function insertUsecase(usecase: any) {
    usecase.campaign_id = cpIdFunctional;
    const oldUsecaseId = usecase.id;
    usecase.id = undefined;
    const newUsecase = await tryber.tables.WpAppqCampaignTask.do()
      .insert(usecase)
      .returning("id");
    const newUsecaseId = newUsecase[0].id ?? newUsecase[0];
    usecase.id = newUsecaseId;
    usecase.campaign_id = cpIdFunctional;
    usecase.oldUsecaseId = oldUsecaseId;
    return { oldUsecaseId, newUsecaseId };
  }

  async function insertUserTasks(oldUsecaseId: any, newUsecaseId: number) {
    if (data.userTasks) {
      for (const userTask of data.userTasks) {
        if (userTask.task_id === oldUsecaseId) {
          userTask.task_id = newUsecaseId;
          userTask.id = undefined;
          await tryber.tables.WpAppqUserTask.do().insert(userTask);
        }
      }
    }
  }

  async function insertCandidates() {
    if (data.candidates) {
      for (const candidate of data.candidates) {
        candidate.campaign_id = cpIdFunctional;
        await tryber.tables.WpCrowdAppqHasCandidate.do().insert(candidate);
      }
    }
  }
}

export { createCpFunctional };
