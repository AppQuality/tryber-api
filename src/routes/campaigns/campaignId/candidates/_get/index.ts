/** OPENAPI-CLASS: get-campaigns-campaign-candidates */

import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";
import Campaigns from "@src/features/db/class/Campaigns";
import Selector, { Field, InvalidQuestionError } from "./Selector";
type filterBy = { os?: string[] | string } | undefined;
export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns-campaign-candidates"]["responses"][200]["content"]["application/json"];
  query: StoplightOperations["get-campaigns-campaign-candidates"]["parameters"]["query"];
  parameters: StoplightOperations["get-campaigns-campaign-candidates"]["parameters"]["path"];
}> {
  private campaign_id: number;
  private db: {
    campaigns: Campaigns;
  };
  private start: number;
  private limit: number;
  private hasLimit: boolean = false;
  private selector: Selector;
  private fields: Field[] = [];
  private osToExclude: string[] | undefined;
  private osToInclude: string[] | undefined;

  constructor(config: RouteClassConfiguration) {
    super(config);
    const parameters = this.getParameters();
    this.campaign_id = parseInt(parameters.campaign);
    this.db = {
      campaigns: new Campaigns(),
    };
    const query = this.getQuery();
    this.start = parseInt(query.start as unknown as string) || 0;
    this.limit = 10;
    if (query.limit) {
      this.limit = parseInt(query.limit as unknown as string);
      this.hasLimit = true;
    }

    if (query.fields) {
      query.fields.split(",").map((field) => {
        const match = field.match(/^question_(\d+)$/);
        if (match) {
          this.fields.push({ type: "question", id: parseInt(match[1]) });
        }
      });
    }

    const filterByExclude = query.filterByExclude as filterBy;
    if (filterByExclude && "os" in filterByExclude && filterByExclude.os) {
      if (!Array.isArray(filterByExclude.os)) {
        this.osToExclude = [filterByExclude.os];
      } else {
        this.osToExclude = filterByExclude.os;
      }
    }

    const filterByInclude = query.filterByInclude as filterBy;
    if (filterByInclude && "os" in filterByInclude && filterByInclude.os) {
      if (!Array.isArray(filterByInclude.os)) {
        this.osToInclude = [filterByInclude.os];
      } else {
        this.osToInclude = filterByInclude.os;
      }
    }
    this.selector = new Selector(
      this.campaign_id,
      this.fields.length ? this.fields : undefined
    );
  }

  protected async init(): Promise<void> {
    try {
      await this.selector.init();
    } catch (e) {
      if (e instanceof InvalidQuestionError) {
        const error = new OpenapiError("Invalid question");
        this.setError(403, error);
        throw error;
      }
      throw e;
    }
  }

  protected async filter() {
    if (this.hasAccessTesterSelection(this.campaign_id) === false) {
      this.setError(403, new OpenapiError("You are not authorized."));
      return false;
    }
    if ((await this.campaignExists()) === false) {
      this.setError(404, new OpenapiError("Campaign does not exists."));
      return false;
    }
    return true;
  }

  private async campaignExists() {
    return await this.db.campaigns.exists(this.campaign_id);
  }

  protected async prepare() {
    const applications = await this.selector.getApplications();
    const sortedApplications = this.sortApplications(applications);
    const paginatedApplications = this.paginateApplications(sortedApplications);

    const faseDos = this.filterItems(paginatedApplications);

    const formattedApplications = await this.formatApplications(faseDos);

    this.setSuccess(200, {
      results: formattedApplications,
      size: paginatedApplications.length,
      start: this.start,
      limit: this.hasLimit ? this.limit : undefined,
      total: this.hasLimit ? applications.length : undefined,
    });
  }

  private filterItems(
    applications: Awaited<ReturnType<typeof this.selector.getApplications>>
  ) {
    let filteredDevices = applications;
    filteredDevices = this.filterByExcludeOs(filteredDevices);
    console.log(
      filteredDevices.map(
        (user, i) => "User" + i + " devices: " + user.devices.length
      )
    );
    filteredDevices = this.filterByIncludeOs(filteredDevices);
    console.log(
      filteredDevices.map(
        (user, i) => "User" + i + " devices: " + user.devices.length
      )
    );
    return filteredDevices;
  }

  private filterByExcludeOs(
    applications: Awaited<ReturnType<typeof this.selector.getApplications>>
  ) {
    if (!this.osToExclude) {
      return applications;
    }
    const osListToExclude = this.osToExclude;
    const removeDevicesToExclude = applications.map((a) => {
      return {
        ...a,
        devices: filterDevicesToExclude(a.devices),
      };
    });

    return removeDevicesToExclude.filter((a) => {
      return a.devices.length > 0;
    });

    function filterDevicesToExclude(
      devices: {
        manufacturer?: string | undefined;
        model?: string | undefined;
        os: string;
        osVersion: string;
        id: number;
      }[]
    ) {
      return devices.filter((d) => {
        const osString = d.os.toLowerCase() + " " + d.osVersion.toLowerCase();
        for (const os of osListToExclude) {
          if (osString.includes(os.toLowerCase())) {
            return false;
          }
        }
        return true;
      });
    }
  }
  private filterByIncludeOs(
    applications: Awaited<ReturnType<typeof this.selector.getApplications>>
  ) {
    if (!this.osToInclude) {
      return applications;
    }
    const osListToInclude = this.osToInclude;
    const leaveDevicesToInclude = applications.map((a) => {
      return {
        ...a,
        devices: filterDevicesToInclude(a.devices),
      };
    });

    return leaveDevicesToInclude.filter((a) => {
      return a.devices.length > 0;
    });

    function filterDevicesToInclude(
      devices: {
        manufacturer?: string | undefined;
        model?: string | undefined;
        os: string;
        osVersion: string;
        id: number;
      }[]
    ) {
      return devices.filter((d) => {
        const osString = d.os.toLowerCase() + " " + d.osVersion.toLowerCase();
        for (const os of osListToInclude) {
          console.log(osString);
          console.log(osString.includes(os.toLowerCase()));
          if (osString.includes(os.toLowerCase())) {
            return true;
          }
        }
        return false;
      });
    }
  }

  private async formatApplications(
    applications: Awaited<ReturnType<typeof this.selector.getApplications>>
  ) {
    let results = [];
    for (const application of applications) {
      results.push({
        id: application.id,
        name: application.name,
        surname: application.surname,
        experience: application.experience,
        level: this.getLevel(application.id),
        devices: application.devices,
        questions:
          "questions" in application ? application.questions : undefined,
      });
    }

    return results;
  }

  private paginateApplications(
    applications: Awaited<ReturnType<typeof this.selector.getApplications>>
  ) {
    return applications.slice(this.start, this.start + this.limit);
  }

  private sortApplications(
    applications: Awaited<ReturnType<typeof this.selector.getApplications>>
  ) {
    return applications.sort((a, b) => {
      const aId = a.id;
      const bId = b.id;
      const aLevelId = this.selector.getUserLevel(aId).id;
      const bLevelId = this.selector.getUserLevel(bId).id;
      return bLevelId - aLevelId;
    });
  }

  private getLevel(testerId: number) {
    const userLevel = this.selector.getUserLevel(testerId);
    return userLevel.name;
  }
}
