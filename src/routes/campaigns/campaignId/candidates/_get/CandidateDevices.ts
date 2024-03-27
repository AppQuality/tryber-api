import { tryber } from "@src/features/database";
import { CandidateData } from "./iCandidateData";

class CandidateDevices implements CandidateData {
  private campaignId: number;
  private candidateIds: number[];
  private filters?: { os?: string[] };

  private _devices:
    | {
        id: number;
        id_profile: number;
        form_factor: string;
        manufacturer: string;
        model: string;
        os: string;
        os_version: string;
      }[]
    | undefined;

  private _candidateDevices:
    | {
        id: number;
        devices: string;
      }[]
    | undefined;

  constructor({
    campaignId,
    candidateIds,
    filters,
  }: {
    campaignId: number;
    candidateIds: number[];
    filters?: { os?: string[] };
  }) {
    this.candidateIds = candidateIds;
    this.filters = filters;
    this.campaignId = campaignId;
  }

  get devices() {
    if (!this._devices) throw new Error("Devices not initialized");
    return this._devices;
  }
  get candidateDevices() {
    if (!this._candidateDevices) throw new Error("Devices not initialized");
    return this._candidateDevices;
  }

  async init() {
    const deviceQuery = tryber.tables.WpCrowdAppqDevice.do()
      .select(
        tryber.ref("id").withSchema("wp_crowd_appq_device"),
        "manufacturer",
        "pc_type",
        "model",
        "id_profile",
        tryber.ref("form_factor").withSchema("wp_crowd_appq_device"),
        tryber.ref("display_name").withSchema("wp_appq_os").as("os_version"),
        tryber.ref("wp_appq_evd_platform.name").as("os")
      )
      .join("wp_appq_os", "wp_appq_os.id", "wp_crowd_appq_device.os_version_id")
      .join(
        "wp_appq_evd_platform",
        "wp_crowd_appq_device.platform_id",
        "wp_appq_evd_platform.id"
      )
      .whereIn("id_profile", this.candidateIds)
      .where("enabled", 1);

    if (this.filters?.os) {
      const operativeSystems = this.filters.os;
      deviceQuery.where((query) => {
        for (const os of operativeSystems) {
          query.orWhereLike("wp_appq_evd_platform.name", `%${os}%`);
        }
      });
    }

    const candidateDevicesQuery = tryber.tables.WpCrowdAppqHasCandidate.do()
      .join(
        "wp_appq_evd_profile",
        "wp_crowd_appq_has_candidate.user_id",
        "wp_appq_evd_profile.wp_user_id"
      )
      .select(
        tryber.ref("id").withSchema("wp_appq_evd_profile").as("id"),
        "devices"
      )
      .where("campaign_id", this.campaignId)
      .whereIn("wp_appq_evd_profile.id", this.candidateIds);

    const [devices, candidateDevices] = await Promise.all([
      deviceQuery,
      candidateDevicesQuery,
    ]);
    this._devices = devices;
    this._candidateDevices = candidateDevices;

    return;
  }

  getCandidateData(candidate: { id: number }) {
    const candidateDevices = this.devices.filter(
      (device) => device.id_profile === candidate.id
    );

    const deviceData = this.getDeviceData(candidate);

    if (deviceData === "none") return [];

    const results =
      deviceData === "all"
        ? candidateDevices
        : candidateDevices.filter((device) =>
            deviceData.includes(device.id.toString())
          );

    return results.map((device) => ({
      id: device.id,
      ...(device.form_factor === "PC"
        ? {}
        : {
            manufacturer: device.manufacturer,
            model: device.model,
          }),
      os: device.os,
      osVersion: device.os_version,
    }));
  }

  private getDeviceData(candidate: { id: number }) {
    const candidateDevicesIds = this.candidateDevices.find(
      (cand) => cand.id === candidate.id
    );

    if (!candidateDevicesIds) return "none";

    if (candidateDevicesIds.devices === "0") return "all";

    return candidateDevicesIds.devices.split(",");
  }

  isCandidateFiltered(candidate: { id: number }) {
    const devices = this.getCandidateData(candidate).filter((device) => {
      if (this.filters?.os) {
        return this.filters.os.reduce((acc, os) => {
          if (device.os.toLowerCase().includes(os.toLowerCase())) return true;
          return acc;
        }, false as boolean);
      }

      return true;
    });

    if (devices.length === 0) return false;

    return true;
  }
}

export { CandidateDevices };
