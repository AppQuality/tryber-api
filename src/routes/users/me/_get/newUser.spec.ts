import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route GET users-me - New User", () => {
  beforeAll(async () => {
    await request(app)
      .post(`/users`)
      .send({
        name: "ciccio",
        surname: "parenzo",
        email: "cparenzo@example.com",
        password: "938393",
        country: "Italy",
        birthDate: "1998-01-02",
        onboarding_complete: false,
      })
      .set("Authorization", `Bearer tester`);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpUsers.do().delete();
  });
  it("Should return basic data + id + role", async () => {
    const response = await request(app)
      .get(`/users/me`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      //basic data
      name: "ciccio",
      surname: "parenzo",
      email: "cparenzo@example.com",
      username: "ciccio-parenzo",
      wp_user_id: 1,
      is_verified: false,
    });
  });
  //basic fields
  it("Should return id, role and email if use ?fields=email parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=email`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      email: "cparenzo@example.com",
    });
  });
  it("Should return id, role and name if use ?fields=name parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=name`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      name: "ciccio",
    });
  });
  it("Should return id, role and surname if use ?fields=surname parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=surname`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      surname: "parenzo",
    });
  });
  it("Should return id, role and username if use ?fields=username parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=username`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      username: "ciccio-parenzo",
    });
  });
  it("Should return id, role and wp_user_id if use ?fields=wp_user_id parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=wp_user_id`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      wp_user_id: 1,
    });
  });
  it("Should return id, role and is_verified if use ?fields=is_verified parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=is_verified`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      is_verified: false,
    });
  });
  //additional fields
  it("Should return id, role if use ?fields=role parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=role`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
    });
  });
  it("Should return id, role and total_exp_pts if use ?fields=total_exp_pts parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=total_exp_pts`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      total_exp_pts: 0,
    });
  });
  it("Should return id, role and rank if use ?fields=rank parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=rank`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      rank: "0",
    });
  });
  it("Should return id, role and onboarding_completed if use ?fields=onboarding_completed parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=onboarding_completed`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      onboarding_completed: false,
    });
  });
  it("Should return id, role and gender if use ?fields=gender parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=gender`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      gender: "not-specified",
    });
  });
  it("Should return id, role and country if use ?fields=country parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=country`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      country: "Italy",
    });
  });
  it("Should return id, role if use ?fields=city parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=city`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      city: undefined,
    });
  });
  it("Should return id, role and gravatar-url if use ?fields=image parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=image`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      image:
        "https://secure.gravatar.com/avatar/f59dea796f4d36b890e7af05749f4baf?s=132&d=https%3A%2F%2Feu.ui-avatars.com%2Fapi%2Fc%2Bp%2F132&r=x",
    });
  });
  it("Should return id, role if use ?fields=phone parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=phone`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      phone: undefined,
    });
  });
  it("Should return id, role if use ?fields=profession parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=profession`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      profession: undefined,
    });
  });
  it("Should return id, role if use ?fields=education parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=education`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      education: undefined,
    });
  });
  it("Should return id, role if use ?fields=certifications parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=certifications`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      certifications: undefined,
    });
  });
  it("Should return id, role and birthDate if use ?fields=birthDate parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=birthDate`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      birthDate: "1998-01-02",
    });
  });
  it("Should return id, role if use ?fields=languages parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=languages`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      languages: undefined,
    });
  });
  it("Should return id, role and pending_booty if use ?fields=pending_booty parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=pending_booty`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      pending_booty: {
        gross: {
          value: 0,
          currency: "EUR",
        },
      },
    });
  });
  it("Should return id, role if use ?fields=booty_threshold parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=booty_threshold`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      booty_threshold: undefined,
    });
  });
  it("Should return id, role and booty if use ?fields=booty parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=booty`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      booty: {
        gross: {
          value: 0,
          currency: "EUR",
        },
      },
    });
  });
  it("Should return id, role and attended_cp if use ?fields=attended_cp parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=attended_cp`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      attended_cp: 0,
    });
  });
  //approved_bugs
  it("Should return id, role and approved_bugs if use ?fields=approved_bugs parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=approved_bugs`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      approved_bugs: 0,
    });
  });
  it("Should return id, role and additional if use ?fields=additional parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=additional`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      additional: [],
    });
  });

  it("Should return all userData if use ?fields=all parameter", async () => {
    const response = await request(app)
      .get(`/users/me?fields=all`)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      wp_user_id: 1,
      role: "tester",
      email: "cparenzo@example.com",
      is_verified: false,
      onboarding_completed: false,
      name: "ciccio",
      surname: "parenzo",
      username: "ciccio-parenzo",
      birthDate: "1998-01-02",
      country: "Italy",
      gender: "not-specified",
      approved_bugs: 0,
      attended_cp: 0,
      total_exp_pts: 0,
      rank: "0",
      additional: [],
      booty: {
        gross: {
          currency: "EUR",
          value: 0,
        },
      },
      pending_booty: {
        gross: {
          currency: "EUR",
          value: 0,
        },
      },
      booty_threshold: undefined,
      city: undefined,
      phone: undefined,
      profession: undefined,
      education: undefined,
      certifications: undefined,
      languages: undefined,

      image:
        "https://secure.gravatar.com/avatar/f59dea796f4d36b890e7af05749f4baf?s=132&d=https%3A%2F%2Feu.ui-avatars.com%2Fapi%2Fc%2Bp%2F132&r=x",
    });
  });
});
