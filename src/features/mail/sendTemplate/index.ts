import * as db from "@src/features/db";
import { send } from "@src/features/mail/send";

type SendParams = {
  email: string;
  subject: string;
  template: string;
  optionalFields?: { [key: string]: any };
};

export const sendTemplate = async ({
  email,
  subject,
  template,
  optionalFields,
}: SendParams) => {
  let sqlTemplate = `
    SELECT umt.html_body FROM wp_appq_unlayer_mail_template AS umt
    JOIN wp_appq_event_transactional_mail AS etm ON umt.id = etm.template_id
    WHERE etm.event_name = ?`;
  sqlTemplate = db.format(sqlTemplate, [template]);

  let mailTemplate = await db.query(sqlTemplate);
  mailTemplate = mailTemplate[0];

  let templateHtml = mailTemplate.html_body;

  if (optionalFields) {
    for (const key in optionalFields) {
      if (templateHtml.includes(key)) {
        templateHtml = templateHtml.replace(
          key,
          optionalFields[key as keyof typeof optionalFields]
        );
      }
    }
  }

  send({
    to: email,
    subject,
    html: templateHtml,
  });
};
