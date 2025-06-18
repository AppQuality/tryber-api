import { tryber } from "@src/features/database";
import OpenapiError from "../OpenapiError";
import AdminRoute from "./AdminRoute";

type BugRouteParameters = { bugId: string };

export type { BugRouteParameters };

export default class BugRoute<
  T extends RouteClassTypes & {
    parameters: T["parameters"] & BugRouteParameters;
  }
> extends AdminRoute<T> {
  protected bug_id: number;
  protected bug: Awaited<ReturnType<typeof this.initBug>> | undefined;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);

    const params = this.getParameters();

    if (!params.bugId) throw new Error("Missing Bug id");

    this.bug_id = parseInt(params.bugId);
  }

  protected async init(): Promise<void> {
    await super.init();

    if (isNaN(this.bug_id)) {
      this.setError(400, new OpenapiError("Invalid Bug id"));

      throw new Error("Invalid Bug id");
    }

    const bug = await this.initBug();

    if (!bug) {
      this.setError(400, new OpenapiError("Bug not found"));

      throw new Error("Bug not found");
    }

    this.bug = bug;
  }

  private async initBug() {
    const bug = await tryber.tables.WpAppqEvdBug.do()
      .select()
      .where({ id: this.bug_id })
      .first();
    if (!bug) throw this.setError(400, new OpenapiError("Bug not found"));
    return bug;
  }

  protected async getStatuses() {
    return await tryber.tables.WpAppqEvdBugStatus.do().select("id", "name");
  }
}
