import { send } from "@src/features/mail/send";
import { tryber } from "@src/features/database";

export const sendTemplate = async ({
  email,
  subject,
  template,
  optionalFields,
}: {
  email: string;
  subject: string;
  template: string;
  optionalFields?: { [key: string]: any };
}) => {
  const mailTemplate = await tryber.tables.WpAppqUnlayerMailTemplate.do()
    .select("html_body")
    .join(
      "wp_appq_event_transactional_mail",
      "wp_appq_event_transactional_mail.template_id",
      "wp_appq_unlayer_mail_template.id"
    )
    .where("wp_appq_event_transactional_mail.event_name", template)
    .first();
  if (!mailTemplate) return;

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
