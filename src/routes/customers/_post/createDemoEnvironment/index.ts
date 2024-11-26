import { createCpExperiential } from "./createCpExperiential";
import { createCpFunctional } from "./createCpFunctional";
import { createDemoProject } from "./createDemoProject";
import { workspaceExist } from "./workspaceExist";

async function createDemoEnvironment({ workspaceId }: { workspaceId: number }) {
  const sourceCpIdFunctional = 7916;
  const sourceCpIdExperiential = 7961;

  if (await workspaceExist({ workspaceId })) {
    const { projectId } = await createDemoProject({ workspaceId });
    if (!projectId) {
      console.log("Error creating project");
      return;
    }
    console.log("Project created");

    const { cpIdFunctional } = await createCpFunctional({
      projectId,
      sourceCpId: sourceCpIdFunctional,
    });
    if (!cpIdFunctional) {
      console.log("Error creating Functional CP");
      return;
    }
    console.log(
      "Functional CP created from campaignId: ",
      sourceCpIdFunctional
    );

    const { cpIdExperiential } = await createCpExperiential({
      projectId,
      sourceCpId: sourceCpIdExperiential,
    });
    if (!cpIdExperiential) {
      console.log("Error creating Experiential CP");
      return;
    }
    console.log(
      "Experiential CP created from campaignId: ",
      sourceCpIdExperiential
    );
  } else {
    console.log("Workspace not found");
    return;
  }
}

export { createDemoEnvironment };
