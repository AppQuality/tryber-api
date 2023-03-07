/** OPENAPI-CLASS: get-campaigns-cid-bugs */
import AdminCampaignRoute from "@src/features/routes/AdminCampaignRoute";
import { tryber } from "@src/features/database";

interface Tag {
  tag_id: number;
  tag_name: string;
}

export default class BugsRoute extends AdminCampaignRoute<{
  response: StoplightOperations["get-campaigns-cid-bugs"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-cid-bugs"]["parameters"]["path"];
  query: StoplightOperations["get-campaigns-cid-bugs"]["parameters"]["query"];
}> {
  private limit: number = 100;
  private start: number = 0;
  private order: string = "ASC";
  private orderBy: string = "id";

  private tags: (Tag & { bug_id: number })[] = [];
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
    if (query.orderBy && ["severity_id"].includes(query.orderBy))
      this.orderBy = query.orderBy;
  }

  private setOrder() {
    const query = this.getQuery();
    if (query.order && ["ASC", "DESC"].includes(query.order))
      this.order = query.order;
  }

  protected async init(): Promise<void> {
    await super.init();
    this.tags = await this.getTags();

    this.initFilterByTags();
  }

  private initFilterByTags() {
    const tags = this.tags;
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
        .filter((tagId) => tags.map((t) => t.tag_id).includes(tagId));
    }
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

    const enhancedBugs = this.enhanceBugs(bugs);
    const filtered = this.filterBugs(enhancedBugs);
    const paginated = this.paginateBugs(filtered);
    const formatted = this.formatBugs(paginated);

    return this.setSuccess(200, {
      items: formatted,
      start: this.start,
      limit: this.limit,
      size: formatted.length,
      total: filtered.length,
    });
  }

  private async getBugs() {
    const bugs = await tryber.tables.WpAppqEvdBug.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_evd_bug").as("id"),
        "status_id",
        "severity_id",
        "bug_type_id",
        "is_duplicated",
        "duplicated_of_id",
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
      .orderBy(this.orderBy, this.order);
    if (!bugs) return false as const;
    return bugs;
  }

  private enhanceBugs(bugs: Awaited<ReturnType<typeof this.getBugs>>) {
    if (!bugs || !bugs.length) return [];

    return bugs.map((bug) => {
      let tags;
      if (this.tags.length) {
        tags = this.tags
          .filter((tag) => tag.bug_id === bug.id)
          .map((tag) => ({
            tag_id: tag.tag_id,
            tag_name: tag.tag_name,
          }));
        if (!tags.length) tags = undefined;
      }
      return {
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

        siblings: this.getSiblingsOfBug(bug, bugs),
        ...(tags && { tags }),
      };
    });
  }

  private getSiblingsOfBug(
    bug: { is_duplicated: number; id: number; duplicated_of_id: number },
    bugs: { is_duplicated: number; id: number; duplicated_of_id: number }[]
  ) {
    if (!bugs || !bugs.length) return 0;

    const otherBugs = bugs.filter((search) => search.id !== bug.id);

    return bug.is_duplicated === 0 ? getChildren() : getSiblingsAndFather();

    function getChildren() {
      return otherBugs.filter((search) => search.duplicated_of_id === bug.id)
        .length;
    }

    function getSiblingsAndFather() {
      return otherBugs.filter((search) => {
        if (search.duplicated_of_id === bug.duplicated_of_id) return true;
        if (search.id === bug.duplicated_of_id) return true;
        return false;
      }).length;
    }
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
          name: "John",
          surname: "Doe",
        },
      };
    });
  }

  private filterBugs(bugs: ReturnType<typeof this.enhanceBugs>) {
    if (!this.filterBy && !this.search) return bugs;

    return bugs.filter((bug) => {
      if (this.filterBugsByDuplicateStatus(bug) === false) return false;
      if (this.filterBugsByStatus(bug) === false) return false;
      if (this.filterBugsByTags(bug) === false) return false;
      if (this.filterBugsBySeverity(bug) === false) return false;
      if (this.filterBugsByType(bug) === false) return false;
      if (this.filterBugsBySearch(bug) === false) return false;

      return true;
    });
  }

  private filterBugsByDuplicateStatus(
    bug: Parameters<typeof this.filterBugs>[0][number]
  ) {
    if (!this.filterBy) return true;
    if (!this.filterBy["is_duplicated"]) return true;

    return bug.is_duplicated.toString() === this.filterBy["is_duplicated"];
  }

  private filterBugsByTags(bug: Parameters<typeof this.filterBugs>[0][number]) {
    if (this.filterByNoTags && !bug.tags?.length) return true;

    if (!this.filterByTags) return !this.filterByNoTags;
    if (!this.filterByTags.length) return !this.filterByNoTags;

    if (!bug.tags?.length) return false;

    const bugTagsIds = bug.tags.map((tag) => tag.tag_id);
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

    if (this.filterBugsBySearchById(bug) === true) return true;

    return (
      this.isSearchInBugTitle(bug.title) ||
      (bug.tags && this.isSearchInBugTags(bug.tags))
    );
  }

  private isSearchInBugTitle(bugTitle: string) {
    return (
      this.search &&
      bugTitle.toLocaleLowerCase().includes(this.search.toLocaleLowerCase())
    );
  }

  private isSearchInBugTags(bugTags: { tag_name: string }[]) {
    return bugTags.some((tag) => {
      return (
        this.search &&
        tag.tag_name
          .toLocaleLowerCase()
          .includes(this.search.toLocaleLowerCase())
      );
    });
  }

  private filterBugsBySearchById(
    bug: Parameters<typeof this.filterBugs>[0][number]
  ) {
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
      limit: this.limit,
      size: 0,
      total: 0,
    });
  }
}
