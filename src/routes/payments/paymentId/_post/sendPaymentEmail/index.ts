import * as db from "@src/features/db";
import { send } from "@src/features/mail/send";

export default async ({
  email,
  template,
}: {
  email: string;
  template: string;
}) => {
  let sqlTemplate = `
	SELECT umt.html_body FROM wp_appq_unlayer_mail_template AS umt
	JOIN wp_appq_event_transactional_mail AS etm ON umt.id = etm.template_id
	WHERE etm.event_name = ?`;
  let templateHtml = await db.query(db.format(sqlTemplate, [template]));

  if (!templateHtml.length) return;

  templateHtml = templateHtml[0].html_body;

  send({
    to: email,
    subject: "[Tryber] Issued Payment Request",
    html: templateHtml,
  });
};
