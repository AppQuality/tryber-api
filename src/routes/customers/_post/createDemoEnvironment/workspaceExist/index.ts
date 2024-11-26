import { tryber } from "@src/features/database";

async function workspaceExist({
  workspaceId,
}: {
  workspaceId: number;
}): Promise<boolean> {
  const workspace = await tryber.tables.WpAppqCustomer.do()
    .select("id")
    .first()
    .where("id", workspaceId);

  return workspace ? true : false;
}

export { workspaceExist };
