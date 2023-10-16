import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /custom_user_fields", () => {
  it("Should answer 403 if user is not logged in", async () => {
    const response = await request(app).get("/custom_user_fields");
    expect(response.status).toBe(403);
  });

  it("Should answer 200 if user is logged in", async () => {
    const response = await request(app)
      .get("/custom_user_fields")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });

  describe("No data", () => {
    it("Should answer with an empty array", async () => {
      const response = await request(app)
        .get("/custom_user_fields")
        .set("Authorization", "Bearer tester");
      expect(response.body).toEqual([]);
    });
  });

  describe("With one cuf of every type", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqCustomUserField.do().insert([
        {
          id: 1,
          name: "Text",
          slug: "text",
          type: "text",
          placeholder: "Insert text",
          extras: "",
          custom_user_field_group_id: 0,
          enabled: 1,
          allow_other: 0,
        },
        {
          id: 2,
          name: "Select",
          slug: "select",
          type: "select",
          placeholder: "Select a value",
          extras: "",
          custom_user_field_group_id: 0,
          enabled: 1,
          allow_other: 0,
        },
        {
          id: 3,
          name: "Multiselect",
          slug: "multiselect",
          type: "multiselect",
          placeholder: "Select some values",
          extras: "",
          custom_user_field_group_id: 0,
          enabled: 1,
          allow_other: 0,
        },
      ]);
      await tryber.tables.WpAppqCustomUserFieldExtras.do().insert([
        {
          id: 1,
          custom_user_field_id: 2,
          name: "Option 1",
        },
        {
          id: 2,
          custom_user_field_id: 3,
          name: "Multiselect Option 1",
        },
      ]);
    });
    afterAll(async () => {
      await tryber.tables.WpAppqCustomUserField.do().delete();
      await tryber.tables.WpAppqCustomUserFieldExtras.do().delete();
    });
    it("Should answer with three fields on Other group", async () => {
      const response = await request(app)
        .get("/custom_user_fields")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("group");
      expect(response.body[0].group).toHaveProperty("id", 0);
      expect(response.body[0].group).toHaveProperty("name");
      expect(response.body[0].group.name).toEqual({ it: "Other" });
      expect(response.body[0].group).toHaveProperty("description");
      expect(response.body[0].group.description).toEqual({ it: "Other" });
      expect(response.body[0]).toHaveProperty("fields");
      expect(response.body[0].fields).toHaveLength(3);
    });

    it("Should contain the text field in the fields", async () => {
      const response = await request(app)
        .get("/custom_user_fields")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("fields");
      expect(response.body[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            type: "text",
            name: { it: "Text" },
            placeholder: { it: "Insert text" },
          }),
        ])
      );
    });
    it("Should contain the select field in the fields", async () => {
      const response = await request(app)
        .get("/custom_user_fields")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("fields");
      expect(response.body[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 2,
            type: "select",
            name: { it: "Select" },
            placeholder: { it: "Select a value" },
            options: [{ id: 1, name: "Option 1" }],
          }),
        ])
      );
    });

    it("Should contain the multiselect field in the fields", async () => {
      const response = await request(app)
        .get("/custom_user_fields")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("fields");
      expect(response.body[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 3,
            type: "multiselect",
            name: { it: "Multiselect" },
            placeholder: { it: "Select some values" },
            options: [{ id: 2, name: "Multiselect Option 1" }],
          }),
        ])
      );
    });
  });

  describe("Allow other", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqCustomUserField.do().insert([
        {
          id: 1,
          name: "Select",
          slug: "select",
          type: "select",
          placeholder: "Select a value",
          extras: "",
          custom_user_field_group_id: 0,
          enabled: 1,
          allow_other: 0,
        },
        {
          id: 2,
          name: "Multiselect",
          slug: "multiselect",
          type: "multiselect",
          placeholder: "Select some values",
          extras: "",
          custom_user_field_group_id: 0,
          enabled: 1,
          allow_other: 0,
        },
        {
          id: 3,
          name: "Select allow other",
          slug: "select",
          type: "select",
          placeholder: "Select a value or insert",
          extras: "",
          custom_user_field_group_id: 0,
          enabled: 1,
          allow_other: 1,
        },
        {
          id: 4,
          name: "Multiselect",
          slug: "multiselect",
          type: "multiselect",
          placeholder: "Select some values or insert",
          extras: "",
          custom_user_field_group_id: 0,
          enabled: 1,
          allow_other: 1,
        },
      ]);
    });
    afterAll(async () => {
      await tryber.tables.WpAppqCustomUserField.do().delete();
    });

    it("Should correctly return with allow other true", async () => {
      const response = await request(app)
        .get("/custom_user_fields")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("fields");
      expect(response.body[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 3,
            allow_other: true,
          }),
          expect.objectContaining({
            id: 4,
            allow_other: true,
          }),
        ])
      );
    });
    it("Should correctly return with allow other false", async () => {
      const response = await request(app)
        .get("/custom_user_fields")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("fields");
      expect(response.body[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            allow_other: false,
          }),
          expect.objectContaining({
            id: 2,
            allow_other: false,
          }),
        ])
      );
    });
  });

  describe("Fields Translations", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqCustomUserField.do().insert([
        {
          id: 1,
          name: "Select",
          slug: "select",
          type: "select",
          placeholder: "Select a value",
          extras: "",
          custom_user_field_group_id: 0,
          enabled: 1,
          allow_other: 0,
        },
      ]);

      await tryber.tables.WpAppqCustomUserFieldTranslation.do().insert([
        {
          id: 1,
          field_id: 1,
          lang: "en",
          name: "Eng select",
          placeholder: "Eng placeholder",
        },
      ]);
    });

    afterAll(async () => {
      await tryber.tables.WpAppqCustomUserField.do().delete();
      await tryber.tables.WpAppqCustomUserFieldTranslation.do().delete();
    });

    it("Should translate title", async () => {
      const response = await request(app)
        .get("/custom_user_fields")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("fields");
      expect(response.body[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: { it: "Select", en: "Eng select" },
          }),
        ])
      );
    });
    it("Should translate description", async () => {
      const response = await request(app)
        .get("/custom_user_fields")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("fields");
      expect(response.body[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            placeholder: { it: "Select a value", en: "Eng placeholder" },
          }),
        ])
      );
    });
  });

  describe("Groups Translations", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqCustomUserFieldGroups.do().insert([
        { id: 1, name: "Group", description: "Description" },
      ]);
      await tryber.tables.WpAppqCustomUserField.do().insert([
        {
          id: 1,
          name: "Select",
          slug: "select",
          type: "select",
          placeholder: "Select a value",
          extras: "",
          custom_user_field_group_id: 1,
          enabled: 1,
          allow_other: 0,
        },
      ]);

      await tryber.tables.WpAppqCustomUserFieldGroupTranslation.do().insert([
        {
          id: 1,
          name: "Eng group",
          lang: "en",
          field_id: 1,
          description: "Eng description",
        },
      ]);
    });

    afterAll(async () => {
      await tryber.tables.WpAppqCustomUserField.do().delete();
      await tryber.tables.WpAppqCustomUserFieldGroups.do().delete();
    });

    it("Should translate title", async () => {
      const response = await request(app)
        .get("/custom_user_fields")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("group");
      expect(response.body[0].group).toEqual(
        expect.objectContaining({
          id: 1,
          name: { it: "Group", en: "Eng group" },
        })
      );
    });
    it("Should translate description", async () => {
      const response = await request(app)
        .get("/custom_user_fields")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("group");
      expect(response.body[0].group).toEqual(
        expect.objectContaining({
          id: 1,
          description: { it: "Description", en: "Eng description" },
        })
      );
    });
  });
});
