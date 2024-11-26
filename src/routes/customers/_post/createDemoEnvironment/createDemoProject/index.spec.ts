import { createDemoProject } from ".";
import { tryber } from "@src/features/database";

describe("createDemoProject", () => {
  afterEach(async () => {
    await tryber.tables.WpAppqProject.do().delete();
  });

  it("Should insert the demo project", async () => {
    const workspaceId = 69;

    const projectsBefore = await tryber.tables.WpAppqProject.do()
      .select()
      .where({ display_name: "Demo Project" });

    expect(projectsBefore.length).toBe(0);
    const { projectId } = await createDemoProject({ workspaceId });

    const progetsAfter = await tryber.tables.WpAppqProject.do().select();

    expect(progetsAfter.length).toBe(1);
    expect(progetsAfter[0]).toMatchObject({
      id: projectId,
      display_name: "Demo Project",
      customer_id: workspaceId,
      edited_by: 0,
    });
  });
  it("Should return the id", async () => {
    const workspaceId = 69;
    const projectsBefore = await tryber.tables.WpAppqProject.do().select();

    expect(projectsBefore.length).toBe(0);
    const { projectId } = await createDemoProject({ workspaceId });

    const progetsAfter = await tryber.tables.WpAppqProject.do().select();

    expect(progetsAfter[0].id).toBe(projectId);
  });

  it("Should insert the project releated to workspace", async () => {
    const workspaceId = 69;
    const projectsbefore = await tryber.tables.WpAppqProject.do().select();
    expect(projectsbefore.length).toBe(0);

    const { projectId } = await createDemoProject({ workspaceId });
    const projects = await tryber.tables.WpAppqProject.do()
      .select()
      .where("id", projectId);

    expect(projects.length).toBe(1);
  });
});
