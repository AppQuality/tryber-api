import getCrowdOption from "@src/features/wp/getCrowdOption";

import getAdditionalData from "./getAdditionalData";
import getApprovedBugsData from "./getApprovedBugsData";
import getAttendedCpData from "./getAttendedCpData";
import getCertificationsData from "./getCertificationsData";
import getEducationData from "./getEducationData";
import getLanguagesData from "./getLanguagesData";
import getPendingBootyData from "./getPendingBootyData";
import getBootyData from "./getBootyData";
import getProfessionData from "./getProfessionData";
import getProfileData from "./getProfileData";

const basicFields = [
  "name",
  "surname",
  "email",
  "is_verified",
  "username",
  "wp_user_id",
];
const acceptedFields = [
  ...basicFields,
  "image",
  "role",
  "rank",
  "approved_bugs",
  "onboarding_completed",
  "attended_cp",
  "total_exp_pts",
  "booty",
  "booty_threshold",
  "pending_booty",
  "languages",
  "additional",
  "gender",
  "birthDate",
  "phone",
  "education",
  "profession",
  "certifications",
  "country",
  "city",
];

export default async (
  id: string,
  fields: string[] | false
): Promise<
  StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"]
> => {
  let isComplete = false;
  if (!fields) fields = basicFields;
  if (fields[0] === "all") {
    fields = acceptedFields;
    isComplete = true;
  }
  try {
    const validFields = fields.filter((f) => acceptedFields.includes(f));

    let data: StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"] =
      { id: 0 };

    try {
      data = { ...data, ...(await getProfileData(id, validFields)) };
    } catch (e) {
      console.log(e);
    }

    if (validFields.includes("pending_booty")) {
      try {
        data = { ...data, ...(await getPendingBootyData(id)) };
      } catch (e) {}
    }

    if (validFields.includes("booty")) {
      try {
        data = { ...data, ...(await getBootyData(id)) };
      } catch (e) {}
    }

    if (validFields.includes("rank")) {
      try {
        data = { ...data, rank: "0" };
      } catch (e) {}
    }

    if (validFields.includes("approved_bugs")) {
      try {
        data = { ...data, ...(await getApprovedBugsData(id)) };
      } catch {}
    }

    if (validFields.includes("attended_cp")) {
      try {
        data = { ...data, ...(await getAttendedCpData(id)) };
      } catch {}
    }

    if (validFields.includes("certifications")) {
      try {
        data = { ...data, ...(await getCertificationsData(id)) };
      } catch {}
    }

    if (validFields.includes("profession")) {
      try {
        data = { ...data, ...(await getProfessionData(id)) };
      } catch {}
    }

    if (validFields.includes("education")) {
      try {
        data = { ...data, ...(await getEducationData(id)) };
      } catch {}
    }

    if (validFields.includes("languages")) {
      try {
        data = { ...data, ...(await getLanguagesData(id)) };
      } catch {}
    }

    if (validFields.includes("additional")) {
      try {
        data = { ...data, ...(await getAdditionalData(id)) };
      } catch (e) {
        console.log(e);
      }
    }
    if (validFields.includes("booty_threshold")) {
      try {
        let bootyThreshold: StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"]["booty_threshold"] =
          { value: 0, isOver: false };

        let trbPendingBooty = (await getPendingBootyData(id)).pending_booty;

        const bootyThresholdVal = await getCrowdOption("minimum_payout");
        if (bootyThresholdVal) {
          bootyThreshold.value = parseFloat(bootyThresholdVal);
          if (trbPendingBooty.gross.value >= bootyThreshold.value) {
            bootyThreshold.isOver = true;
          }
        }

        data = { ...data, ...{ booty_threshold: bootyThreshold } };
      } catch (e) {
        console.log(e);
      }
    }

    if (!Object.keys(data).length) throw Error("Invalid data");

    Object.keys(data).forEach((k) => {
      if (data[k as keyof typeof data] === null)
        delete data[k as keyof typeof data];
    });

    return data;
  } catch (e) {
    if (process.env && process.env.NODE_ENV === "development") {
      console.log(e);
    }
    throw e;
  }
};
