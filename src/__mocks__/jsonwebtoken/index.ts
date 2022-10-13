class MockedVerifier {
  private token: string;
  private role: string;
  private roleToken: { [key: string]: any };
  constructor(token: string) {
    this.token = token;
    this.role = token.split(" ")[0];
    this.roleToken = this.getBasicToken(this.role);
  }

  get basicToken() {
    return {
      ID: 1,
      testerId: 1,
      permission: { admin: {} },
      capabilities: [],
      iat: new Date().getTime() + 24 * 60 * 60,
      exp: new Date().getTime() + 24 * 60 * 60,
    };
  }

  get testerToken() {
    return {
      ...this.basicToken,
      role: "tester",
    };
  }

  get adminToken() {
    return {
      ...this.basicToken,
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
    };
  }

  private getBasicToken(role: string) {
    if (role === "tester") {
      return this.testerToken;
    }

    if (role === "admin") {
      return this.adminToken;
    }
    throw new Error(`Invalid role ${role}`);
  }

  public verify() {
    if (this.token === this.role) {
      return this.roleToken;
    }

    return {
      ...this.roleToken,
      ...this.capabilities,
      ...this.olps,
    };
  }

  get olps() {
    const olps = this.decodeOlps();
    if (!olps) return {};
    return {
      permission: {
        admin: {
          ...this.roleToken.permission.admin,
          ...olps,
        },
      },
    };
  }

  private decodeOlps() {
    const tokenItems = this.token.replace(/ +/g, " ").split(" ");
    if (tokenItems.includes("olp")) {
      const capabilityIndex = tokenItems.indexOf("olp") + 1;
      if (capabilityIndex < tokenItems.length) {
        return JSON.parse(tokenItems[capabilityIndex].trim());
      }
    }
    return false;
  }

  get capabilities() {
    const capabilities = this.decodeCapabilities();
    if (!capabilities) return {};
    return {
      capabilities: [...this.roleToken.capabilities, ...capabilities],
    };
  }

  private decodeCapabilities() {
    const tokenItems = this.token.replace(/ +/g, " ").split(" ");
    if (tokenItems.includes("capability")) {
      const capabilityIndex = tokenItems.indexOf("capability") + 1;
      if (capabilityIndex < tokenItems.length) {
        return JSON.parse(tokenItems[capabilityIndex].trim());
      }
    }
    return false;
  }
}

const verify = (token: string, secret: string): any => {
  const verifier = new MockedVerifier(token);
  return verifier.verify();
};

export default {
  verify,
};
