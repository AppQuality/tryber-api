/** OPENAPI-ROUTE: post-users */

import * as db from "@src/features/db";
import { Context } from "openapi-backend";
import { send } from "../../../features/mail/send";
import createWordpressUser from "../../../features/wp/createWordpressUser";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const query = mapObjectToQuery(req.body);

    query.name = (query.name || "")
      .replace(/\s\s+/, " ")
      .replace(/[^A-Za-zÀ-ÿ' ]/gm, " ")
      .trim();
    query.surname = (query.surname || "")
      .replace(/\s\s+/, " ")
      .replace(/[^A-Za-zÀ-ÿ' ]/gm, " ")
      .trim();

    const nameSlug = req.body.name
      .toLowerCase()
      .replace(/'/g, "+")
      .replace(/[^a-zA-Z0-9_+]+/g, " ")
      .replace(/ /g, "-");
    const surnameSlug = req.body.surname
      .toLowerCase()
      .replace(/'/g, "+")
      .replace(/[^a-zA-Z0-9_+]+/g, " ")
      .replace(/ /g, "-");

    const username = `${nameSlug}-${surnameSlug}`;

    const userId = await createWordpressUser(
      username,
      req.body.email,
      req.body.password
    );

    const profileQuery = {
      ...query,
      wp_user_id: userId,
    };

    const testerId = await db.query(
      db.format(
        `INSERT INTO wp_appq_evd_profile (name,surname,email,country,birth_date,wp_user_id) VALUES (?,?,?,?,?,?)`,
        [
          profileQuery.name || "",
          profileQuery.surname || "",
          profileQuery.email || "",
          profileQuery.country || "",
          profileQuery.birth_date || "",
          profileQuery.wp_user_id,
        ]
      )
    );

    let tester = await db.query(
      db.format(`SELECT * FROM wp_appq_evd_profile WHERE id = ?`, [
        testerId.insertId,
      ])
    );
    tester = tester[0];

    let sqlTemplate = `
    SELECT umt.html_body FROM wp_appq_unlayer_mail_template AS umt
    JOIN wp_appq_event_transactional_mail AS etm ON umt.id = etm.template_id
    WHERE etm.event_name = ?`;
    sqlTemplate = db.format(sqlTemplate, [
      tester.country == "Italy" ? "welcome_mail_it" : "welcome_mail_en",
    ]);

    let mailTemplate = await db.query(sqlTemplate);
    mailTemplate = mailTemplate[0];

    let welcomeTemplate = mailTemplate.html_body;
    const optionalFields = {
      "{Profile.id}": `T${tester.id}`,
      "{Profile.name}": tester.name,
      "{Profile.surname}": tester.surname,
      "{Profile.email}": tester.email,
      "{Profile.country}": tester.country,
      "{Profile.address}": tester.address,
      "{Profile.city}": tester.city,
      "{Profile.birth}": tester.birth_date,
      "{Profile.phone}": tester.phone_number,
      "{Profile.totalExp}": tester.total_exp_pts,
    };

    for (const key in optionalFields) {
      if (welcomeTemplate.includes(key)) {
        welcomeTemplate = welcomeTemplate.replace(
          key,
          optionalFields[key as keyof typeof optionalFields]
        );
      }
    }

    send({
      to: tester.email,
      subject: "Thank you for joining Tryber Community!",
      html: welcomeTemplate,
    });

    if (
      req.body.referral &&
      req.body.referral.match(/^[0-9]+-[0-9]+$/) !== null
    ) {
      const referral = req.body.referral.split("-");
      if (referral.length === 2) {
        const [referralId, campaignId] = referral;

        try {
          const insertId = await db.insert("wp_appq_referral_data", {
            referrer_id: parseInt(referralId),
            tester_id: parseInt(testerId.insertId),
            campaign_id: parseInt(campaignId),
          });
        } catch (e) {
          console.error(e);
          throw e;
        }
      }
    }

    res.status_code = 201;
    return tester;
  } catch (err) {
    res.status_code = (err as OpenapiError).status_code || 400;
    return {
      message: (err as OpenapiError).message,
    };
  }
};

const mapObjectToQuery = (user: {
  name?: string;
  surname?: string;
  email?: string;
  password?: string;
  country?: string;
  onboarding_complete?: boolean;
  birthDate?: string;
}) => {
  const data = {
    ...(user.name && { name: user.name }),
    ...(user.surname && { surname: user.surname }),
    ...(user.email && { email: user.email }),
    ...(user.password && { password: user.password }),
    ...(user.country && { country: user.country }),
    ...(user.onboarding_complete && {
      onboarding_complete: user.onboarding_complete,
    }),
    ...(user.birthDate && { birth_date: user.birthDate }),
  };

  if (data.birth_date) {
    const d = new Date(data.birth_date);
    data.birth_date = d.toISOString().split(".")[0].replace("T", " ");
  }

  return data;
};
