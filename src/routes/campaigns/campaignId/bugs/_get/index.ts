/** OPENAPI-CLASS: get-campaigns-cid-bugs */

import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";

interface Tag {
  id: number;
  name: string;
}

export default class BugsRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-cid-bugs"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-cid-bugs"]["parameters"]["path"];
  query: StoplightOperations["get-campaigns-cid-bugs"]["parameters"]["query"];
}> {
  private limit: number | false = false;
  private start: number = 0;
  private order: "ASC" | "DESC" = "ASC";
  private orderBy: "severity" | "testerId" | "status" | "type" | "id" = "id";

  private filterBy: { [key: string]: string | string[] } | undefined;
  private filterByTags: number[] | undefined;
  private filterByNoTags: boolean = false;
  private search: string | undefined;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);

    const query = this.getQuery();
    if (query.limit) this.limit = parseInt(query.limit as unknown as string);
    if (query.start) this.start = parseInt(query.start as unknown as string);

    this.setOrder();
    this.setOrderBy();

    if (query.filterBy)
      this.filterBy = query.filterBy as { [key: string]: string | string[] };

    if (query.search) this.search = query.search as string;
  }

  private setOrderBy() {
    const query = this.getQuery();
    if (
      query.orderBy &&
      ["severity", "testerId", "status", "type", "id"].includes(query.orderBy)
    )
      this.orderBy = query.orderBy;
  }

  private setOrder() {
    const query = this.getQuery();
    if (!query.order && query.orderBy === undefined) this.order = "DESC"; // default order id ID DESC
    if (query.order && ["ASC", "DESC"].includes(query.order))
      this.order = query.order;
  }

  protected async init(): Promise<void> {
    await super.init();
    await this.initFilterByTags();
  }

  private async initFilterByTags() {
    const tags = await this.getTags();
    if (
      this.filterBy &&
      this.filterBy["tags"] &&
      typeof this.filterBy["tags"] === "string"
    ) {
      if (this.filterBy["tags"].split(",").includes("none")) {
        this.filterByNoTags = true;
      }
      this.filterByTags = this.filterBy["tags"]
        .split(",")
        .map((tagId) => (parseInt(tagId) > 0 ? parseInt(tagId) : 0))
        .filter((tagId) => tags.map((tag) => tag.id).includes(tagId));
    }
  }

  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    if (!this.hasAccessToBugs(this.cp_id)) {
      this.setError(403, new OpenapiError("Access denied"));

      return false;
    }
    return true;
  }

  protected async prepare(): Promise<void> {
    let bugs;
    try {
      bugs = await this.getBugs();
    } catch (e: any) {
      return this.setError(500, {
        message: e.message || "There was an error while fetching bugs",
        status_code: 500,
      } as OpenapiError);
    }

    if (!bugs || !bugs.length) return this.emptyResponse();

    const enhancedBugs = await this.enhanceBugs(bugs);
    const filtered = this.filterBugs(enhancedBugs);
    const paginated = this.paginateBugs(filtered);
    const formatted = this.formatBugs(paginated);

    return this.setSuccess(200, {
      items: formatted,
      start: this.start,
      limit: this.limit ? this.limit : undefined,
      size: formatted.length,
      total: filtered.length,
    });
  }

  private async getBugs() {
    const columnMapping = {
      severity: "severity_id",
      testerId: "profile_id",
      status: "status_id",
      type: "bug_type_id",
      id: "id",
    };
    const bugs = await tryber.tables.WpAppqEvdBug.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_evd_bug").as("id"),
        "status_id",
        "severity_id",
        "bug_type_id",
        "is_duplicated",
        "duplicated_of_id",
        "is_favorite",
        tryber.ref("message").as("title"),
        "bug_replicability_id",
        "internal_id",
        tryber
          .ref("name")
          .withSchema("wp_appq_evd_bug_status")
          .as("status_name"),
        tryber.ref("name").withSchema("wp_appq_evd_bug_type").as("type"),
        tryber.ref("name").withSchema("wp_appq_evd_severity").as("severity"),
        tryber.ref("id").withSchema("wp_appq_evd_profile").as("profile_id")
      )
      .join(
        "wp_appq_evd_severity",
        "wp_appq_evd_severity.id",
        "wp_appq_evd_bug.severity_id"
      )
      .join(
        "wp_appq_evd_bug_type",
        "wp_appq_evd_bug_type.id",
        "wp_appq_evd_bug.bug_type_id"
      )
      .join(
        "wp_appq_evd_bug_status",
        "wp_appq_evd_bug_status.id",
        "wp_appq_evd_bug.status_id"
      )
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.wp_user_id",
        "wp_appq_evd_bug.wp_user_id"
      )
      .where({
        campaign_id: this.cp_id,
      })
      .orderBy(columnMapping[this.orderBy], this.order);
    if (!bugs) return false as const;
    return bugs;
  }

  private async enhanceBugs(bugs: Awaited<ReturnType<typeof this.getBugs>>) {
    if (!bugs || !bugs.length) return [];

    const bugsWithDuplication = await this.enhanceBugsWithDuplication<
      (typeof bugs)[number]
    >(bugs);

    const bugWithTags = await this.enhanceBugsWithTags<
      (typeof bugsWithDuplication)[number]
    >(bugsWithDuplication);

    return bugWithTags.map((bug) => ({
      ...bug,
      status: {
        id: bug.status_id,
        name: bug.status_name,
      },
      severity: {
        id: bug.severity_id,
        name: bug.severity,
      },
      type: {
        id: bug.bug_type_id,
        name: bug.type,
      },
    }));
  }

  private async enhanceBugsWithDuplication<
    T extends { is_duplicated: number; id: number }
  >(bugs: T[]) {
    const childrens = await this.getBugChildrens<T>(bugs);
    return bugs.map((bug) => {
      const hasChildren =
        childrens.filter((c) => c.duplicated_of_id === bug.id).length > 0;
      return {
        ...bug,
        duplication: bug.is_duplicated
          ? ("duplicated" as const)
          : hasChildren
          ? ("father" as const)
          : ("unique" as const),
      };
    });
  }

  private async getBugChildrens<
    T extends { is_duplicated: number; id: number }
  >(bugs: T[]) {
    return await tryber.tables.WpAppqEvdBug.do()
      .select(["duplicated_of_id", "id"])
      .where(
        "duplicated_of_id",
        "in",
        bugs.map((b) => b.id)
      )
      .where({ campaign_id: this.cp_id });
  }

  private async enhanceBugsWithTags<T extends { id: number }>(bugs: T[]) {
    const campaignTags = await tryber.tables.WpAppqBugTaxonomy.do()
      .select([
        tryber.ref("tag_id").as("id"),
        tryber.ref("display_name").as("name"),
        "bug_id",
      ])
      .where({ campaign_id: this.cp_id });
    return bugs.map((bug) => {
      const bugTags = campaignTags
        .filter((tag) => tag.bug_id === bug.id)
        .map((tag) => ({
          id: tag.id,
          name: tag.name,
        }));

      return {
        ...bug,
        tags: bugTags.length ? bugTags : undefined,
      };
    });
  }

  private formatBugs(bugs: ReturnType<typeof this.paginateBugs>) {
    return bugs.map((bug) => {
      return {
        id: bug.id,
        title: bug.title,
        internalId: bug.internal_id,
        status: bug.status,
        type: bug.type,
        severity: bug.severity,
        tester: {
          id: bug.profile_id,
        },
        duplication: bug.duplication,
        tags: bug.tags,
        isFavourite: !!bug.is_favorite,
      };
    });
  }

  private filterBugs(bugs: Awaited<ReturnType<typeof this.enhanceBugs>>) {
    if (!this.filterBy && !this.search) return bugs;

    return bugs.filter((bug) => {
      if (this.filterBugsByDuplication(bug) === false) return false;
      if (this.filterBugsByStatus(bug) === false) return false;
      if (this.filterBugsByTags(bug) === false) return false;
      if (this.filterBugsBySeverity(bug) === false) return false;
      if (this.filterBugsByType(bug) === false) return false;
      if (this.filterBugsBySearch(bug) === false) return false;

      return true;
    });
  }

  private filterBugsByDuplication(
    bug: Parameters<typeof this.filterBugs>[0][number]
  ) {
    if (!this.filterBy) return true;
    if (!this.filterBy["duplication"]) return true;
    if (typeof this.filterBy["duplication"] !== "string") return true;

    return this.filterBy["duplication"].split(",").includes(bug.duplication);
  }

  private filterBugsByTags(bug: Parameters<typeof this.filterBugs>[0][number]) {
    if (this.filterByNoTags && !bug.tags?.length) return true;

    if (!this.filterByTags) return !this.filterByNoTags;
    if (!this.filterByTags.length) return !this.filterByNoTags;

    if (!bug.tags?.length) return false;

    const bugTagsIds = bug.tags.map((tag) => tag.id);
    return this.filterByTags.some((tag) => bugTagsIds.includes(tag));
  }

  private filterBugsBySeverity(
    bug: Parameters<typeof this.filterBugs>[0][number]
  ) {
    if (!this.filterBy) return true;
    if (!this.filterBy["severities"]) return true;
    if (typeof this.filterBy["severities"] !== "string") return true;

    const severitiesToFilter = this.filterBy["severities"]
      .split(",")
      .map((sevId) => (parseInt(sevId) > 0 ? parseInt(sevId) : 0))
      .filter((sevId) => sevId > 0);

    return severitiesToFilter.includes(bug.severity.id);
  }

  private filterBugsByStatus(
    bug: Parameters<typeof this.filterBugs>[0][number]
  ) {
    if (!this.filterBy) return true;
    if (!this.filterBy["status"]) return true;
    if (typeof this.filterBy["status"] !== "string") return true;

    const statusToFilter = this.filterBy["status"]
      .split(",")
      .map((statusId) => (parseInt(statusId) > 0 ? parseInt(statusId) : 0))
      .filter((statusId) => statusId > 0);

    return statusToFilter.includes(bug.status.id);
  }

  private filterBugsByType(bug: Parameters<typeof this.filterBugs>[0][number]) {
    if (!this.filterBy) return true;
    if (!this.filterBy["types"]) return true;
    if (typeof this.filterBy["types"] !== "string") return true;

    const typesToFilter = this.filterBy["types"]
      .split(",")
      .map((id) => (parseInt(id) > 0 ? parseInt(id) : 0))
      .filter((id) => id > 0);

    return typesToFilter.includes(bug.type.id);
  }

  private filterBugsBySearch(
    bug: Parameters<typeof this.filterBugs>[0][number]
  ) {
    if (!this.search) return true;
    if (this.search.length <= 0) return true;

    if (this.searchFavorites(bug) === true) return true;
    if (this.searchInId(bug) === true) return true;
    if (this.searchInTitle(bug) === true) return true;
    if (this.searchInTags(bug) === true) return true;
    if (this.searchInProfileId(bug) === true) return true;

    return false;
  }

  private searchFavorites(bug: Parameters<typeof this.filterBugs>[0][number]) {
    if (!this.search || this.search.trim() !== "*") return false;
    return bug.is_favorite != 0;
  }
  private searchInProfileId(
    bug: Parameters<typeof this.filterBugs>[0][number]
  ) {
    return (
      this.search &&
      this.search.toLocaleLowerCase().includes(bug.profile_id.toString())
    );
  }

  private searchInTitle(bug: Parameters<typeof this.filterBugs>[0][number]) {
    return (
      this.search &&
      bug.title.toLocaleLowerCase().includes(this.search.toLocaleLowerCase())
    );
  }

  private searchInTags(bug: Parameters<typeof this.filterBugs>[0][number]) {
    if (!bug.tags) return false;
    return bug.tags.some((tag) => {
      return (
        this.search &&
        tag.name.toLocaleLowerCase().includes(this.search.toLocaleLowerCase())
      );
    });
  }

  private searchInId(bug: Parameters<typeof this.filterBugs>[0][number]) {
    if (!this.search) return true;

    const textToSearch = this.search.replace(this.baseBugInternalId, "");
    if (bug.id.toString().includes(textToSearch)) return true;

    return false;
  }

  private paginateBugs(bugs: ReturnType<typeof this.filterBugs>) {
    if (!this.limit) return bugs;
    return bugs.slice(this.start, this.start + this.limit);
  }

  private emptyResponse() {
    return this.setSuccess(200, {
      items: [],
      start: this.start,
      limit: 0,
      size: 0,
      total: 0,
    });
  }
}
