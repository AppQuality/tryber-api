import sgMail from "@sendgrid/mail";

import config from "../../../config";

sgMail.setApiKey(config.sendgrid.key);

export const send = async ({
  to,
  cc,
  from,
  subject,
  html,
  categories,
}: {
  to: string;
  cc?: string;
  from?: string | { name: string; email: string };
  subject: string;
  html: string;
  categories?: string[];
}) => {
  if (!from) {
    from = config.sendgrid.default_sender;
  }

  if (!categories) {
    categories = [config.sendgrid.default_category];
  }
  const msg = {
    to,
    cc,
    from,
    subject,
    html,
    categories,
  };

  try {
    const d = await sgMail.send(msg);
    return d;
  } catch (err) {
    console.log(err);
    if ((err as any).response) {
      console.error((err as any).response.body);
    }
  }
};
