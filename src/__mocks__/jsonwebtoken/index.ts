const verify = (token: string, secret: string): any => {
  const tokenItems = token.split(" ");
  const role = tokenItems[0];
  if (token === "tester") {
    return {
      ID: 1,
      testerId: 1,
      role: "tester",
      permission: { admin: {} },
      capabilities: [],
      iat: new Date().getTime() + 24 * 60 * 60,
      exp: new Date().getTime() + 24 * 60 * 60,
    };
  }

  if (token === "admin") {
    return {
      ID: 1,
      testerId: 1,
      role: "administrator",
      capabilities: [],
      permission: {
        admin: {
          appq_bug: true,
          appq_campaign_dashboard: true,
          appq_campaign: true,
          appq_course: true,
          appq_manual: true,
          appq_preview: true,
          appq_prospect: true,
          appq_task_dashboard: true,
          appq_task: true,
          appq_tester_selection: true,
          appq_mail_merge: true,
          appq_video_dashboard: true,
          appq_profile: true,
          appq_custom_user_field: true,
          appq_campaign_category: true,
          appq_quality_badge: true,
          appq_fiscal_profile: true,
          appq_message_center: true,
          appq_email_templates: true,
          appq_simple_editor: true,
          appq_token_handling: true,
        },
      },
      iat: new Date().getTime() + 24 * 60 * 60,
      exp: new Date().getTime() + 24 * 60 * 60,
    };
  }

  const result = verify(role, "");
  if (result) {
    if (token.includes("capability ")) {
      const capabilityIndex = tokenItems.indexOf("capability") + 1;
      if (capabilityIndex < tokenItems.length) {
        const capabilities = JSON.parse(tokenItems[capabilityIndex].trim());
        result.capabilities = [...result.capabilities, ...capabilities];
      }
    }
    if (token.includes("olp ")) {
      const olpIndex = tokenItems.indexOf("olp") + 1;
      if (olpIndex < tokenItems.length) {
        const olp = JSON.parse(tokenItems[olpIndex].trim());
        result.permission.admin = { ...result.permission.admin, ...olp };
      }
    }
  }
  return result;
};

export default {
  verify,
};
