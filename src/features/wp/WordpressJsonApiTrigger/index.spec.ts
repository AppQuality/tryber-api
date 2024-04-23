import axios from "axios";
import WordpressJsonApiTrigger from ".";

// mock axios

jest.mock("axios");

describe("WordpressJsonApiTrigger", () => {
  beforeAll(() => {
    process.env = Object.assign(process.env, {
      WORDPRESS_API_URL: "https://example.com",
    });
  });

  afterAll(() => {
    jest.resetAllMocks();
    process.env = Object.assign(process.env, {
      WORDPRESS_API_URL: "",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it("Should create a new instance of WordpressJsonApiTrigger", () => {
    const instance = new WordpressJsonApiTrigger(1);
    expect(instance).toBeInstanceOf(WordpressJsonApiTrigger);
  });

  it("Should call axios on generateUseCase", async () => {
    const instance = new WordpressJsonApiTrigger(1);

    await instance.generateUseCase();

    expect(axios).toHaveBeenCalledTimes(1);

    expect(axios).toHaveBeenCalledWith({
      headers: { "Content-Type": "application/json" },
      method: "GET",
      url: "https://example.com/regenerate-campaign-use-cases/1",
    });
  });

  it("Should call axios on generateMailmerges", async () => {
    const instance = new WordpressJsonApiTrigger(1);

    await instance.generateMailMerges();

    expect(axios).toHaveBeenCalledTimes(1);

    expect(axios).toHaveBeenCalledWith({
      headers: { "Content-Type": "application/json" },
      method: "GET",
      url: "https://example.com/regenerate-campaign-crons/1",
    });
  });
  it("Should call axios on generatePages", async () => {
    const instance = new WordpressJsonApiTrigger(1);

    await instance.generatePages();

    expect(axios).toHaveBeenCalledTimes(1);

    expect(axios).toHaveBeenCalledWith({
      headers: { "Content-Type": "application/json" },
      method: "GET",
      url: "https://example.com/regenerate-campaign-pages/1",
    });
  });

  it("Should call axios on generateTasks", async () => {
    const instance = new WordpressJsonApiTrigger(1);

    await instance.generateTasks();

    expect(axios).toHaveBeenCalledTimes(1);

    expect(axios).toHaveBeenCalledWith({
      headers: { "Content-Type": "application/json" },
      method: "GET",
      url: "https://example.com/regenerate-campaign-tasks/1",
    });
  });
});
