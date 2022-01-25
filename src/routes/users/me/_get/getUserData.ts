import getAdditionalData from "./getAdditionalData";
import getApprovedBugsData from "./getApprovedBugsData";
import getAttendedCpData from "./getAttendedCpData";
import getCertificationsData from "./getCertificationsData";
import getEducationData from "./getEducationData";
import getLanguagesData from "./getLanguagesData";
import getProfessionData from "./getProfessionData";
import getProfileData from "./getProfileData";
import getRankData from "./getRankData";

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
  "completionPercent",
];

export default (id: string, fields: string[]) => {
  let isComplete = false;
  if (!fields) fields = basicFields;
  if (fields[0] === "all") {
    fields = acceptedFields;
    isComplete = true;
  }
  return new Promise(async (resolve, reject) => {
    const validFields = fields.filter((f) => acceptedFields.includes(f));

    let data = {};

    try {
      data = { ...data, ...(await getProfileData(id, validFields)) };
    } catch (e) {}

    if (validFields.includes("rank")) {
      try {
        data = { ...data, ...(await getRankData(id)) };
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

    if (!Object.keys(data).length) return reject(Error("Invalid data"));

    Object.keys(data).forEach((k) => {
      if (data[k as keyof typeof data] === null)
        delete data[k as keyof typeof data];
    });

    if (isComplete) {
      data = {
        ...data,
        completionPercent:
          (100 * (Object.keys(data).length + 1)) / validFields.length,
      };
    }
    return resolve(data);
  });
};
