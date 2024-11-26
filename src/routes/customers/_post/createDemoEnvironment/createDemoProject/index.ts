import { tryber } from "@src/features/database";

async function createDemoProject({
  workspaceId,
}: {
  workspaceId: number;
}): Promise<{ projectId: number }> {
  const project = await tryber.tables.WpAppqProject.do()
    .insert({
      display_name: "Demo Project",
      customer_id: workspaceId,
      edited_by: 0,
    })
    .returning("id");
  const projectId = project[0].id ?? project[0];

  return { projectId };
}

export { createDemoProject };
