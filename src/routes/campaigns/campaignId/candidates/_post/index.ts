import Devices from "@src/features/class/Devices";
import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import adminOnly from "@src/features/preconditions/adminOnly";
import { Context } from "openapi-backend";
import createCandidature from "./createCandidature";
import testerShouldNotBeCandidate from "./testerShouldNotBeCandidate";
import { UserDevice } from "@src/routes/users/me/campaigns/campaignId/bugs/_post/types";

const campaignShouldExist = async (campaignId: number) => {
  const campaign = await db.query(
    db.format(`SELECT id FROM wp_appq_evd_campaign WHERE id = ? `, [campaignId])
  );
  if (!campaign.length) {
    throw { status_code: 404, message: "Campaign does not exist" };
  }
};
function userHasdevice(deviceId: number, userDevices: UserDevice[]): boolean {
  return userDevices.map((device) => device.id).includes(deviceId);
}
const testerShouldExist = async (testerId: number) => {
  const tester = await db.query(
    db.format(`SELECT id,wp_user_id FROM wp_appq_evd_profile WHERE id = ? `, [
      testerId,
    ])
  );
  if (!tester.length) {
    throw { status_code: 404, message: "Tester does not exist" };
  }
  return tester[0];
};

const getSelectedDeviceId = async (
  testerId: number,
  params: StoplightOperations["post-campaigns-campaign-candidates"]["parameters"]["query"]
): Promise<number> => {
  const userDevices = await new Devices().getMany({ testerId });
  if (params.device) {
    if (params.device.toString() === "random" && userDevices.length) {
      return userDevices[Math.floor(Math.random() * userDevices.length)].id;
    }
    if (parseInt(params.device) > 0) {
      if (userHasdevice(parseInt(params.device), userDevices)) {
        return parseInt(params.device);
      }
      throw {
        status_code: 404,
        message: "Device does not exist for this Tester",
      };
    }
  }

  return 0;
};
/** OPENAPI-ROUTE: post-campaigns-campaign-candidates */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  const body =
    req.body as StoplightOperations["post-campaigns-campaign-candidates"]["requestBody"]["content"]["application/json"];
  const campaignId = parseInt(
    typeof c.request.params.campaign === "string"
      ? c.request.params.campaign
      : "-1"
  );
  const params =
    req.query as StoplightOperations["post-campaigns-campaign-candidates"]["parameters"]["query"];
  const testerId = body.tester_id;
  let tester;
  try {
    adminOnly(req.user.role);
    await campaignShouldExist(campaignId);
    tester = await testerShouldExist(testerId);
    await testerShouldNotBeCandidate(testerId, campaignId);
  } catch (err) {
    debugMessage(err);
    res.status_code = (err as OpenapiError).status_code || 403;
    return {
      id: testerId,
      element: "candidate",
      message: (err as OpenapiError).message,
    };
  }
  let selectedDeviceId;
  let candidature;
  try {
    selectedDeviceId = await getSelectedDeviceId(testerId, params);
    candidature = await createCandidature(
      tester.wp_user_id,
      campaignId,
      selectedDeviceId
    );
    if (candidature.device > 0) {
      candidature.device = await new Devices().getOne(candidature.device);
    }
  } catch (err) {
    debugMessage(err);
    res.status_code = (err as OpenapiError).status_code || 500;
    return {
      id: testerId,
      element: "candidate",
      message: (err as OpenapiError).message,
    };
  }
  res.status_code = 200;
  return {
    tester_id: candidature.tester_id,
    accepted: candidature.accepted == 1,
    campaign_id: candidature.campaign_id,
    status:
      candidature.status === 0
        ? "ready"
        : candidature.status === -1
        ? "removed"
        : candidature.status === 1
        ? "excluded"
        : candidature.status === 2
        ? "in-progress"
        : candidature.status === 3
        ? "completed"
        : "unknown",
    device: candidature.device == 0 ? "any" : candidature.device,
  };
};
