import Jotform from "./index";

const empty = (url: string) => [];
const mockedForm = { id: 1, title: "Form 1" };
const mockedQuestion = {
  text: "Question 1",
  description: "Description",
  type: "control_textbox",
  name: "question1",
};

const mockedFetch = (fn: (url: string) => any) =>
  jest.fn().mockImplementation(async (url: string) => ({
    json: async () => ({
      content: fn(url),
    }),
  }));

describe("Jotform", () => {
  describe("Without apikey", () => {
    it("should throw an error if apikey is not provided", () => {
      expect(() => {
        new Jotform();
      }).toThrowError("Jotform apikey not found");
    });
  });

  describe("With apikey", () => {
    beforeAll(() => {
      process.env.JOTFORM_APIKEY = "apikey";
    });
    afterAll(() => {
      process.env.JOTFORM_APIKEY = undefined;
    });
    it("should not throw an error if apikey is not provided", () => {
      expect(() => {
        new Jotform();
      }).not.toThrowError("Jotform apikey not found");
    });

    describe("getForms", () => {
      it("If there are no forms should return an empty array", async () => {
        const jotform = new Jotform({
          fetch: mockedFetch((url: string) => []),
        });
        expect(await jotform.getForms()).toEqual([]);
      });
      it("If there are more than 1000 form should return all the forms", async () => {
        const jotform = new Jotform({
          fetch: mockedFetch((url: string) => {
            if (Number(url.match(/offset=(\d+)/)?.[1]) === 0)
              return new Array(1000).fill(mockedForm);
            return [mockedForm];
          }),
        });
        expect(await jotform.getForms()).toHaveLength(1001);
      });
      it("If there is a form should return the list", async () => {
        const jotform = new Jotform({
          fetch: mockedFetch((url: string) => {
            return [mockedForm];
          }),
        });
        expect(await jotform.getForms()).toEqual([
          {
            id: 1,
            name: "Form 1",
          },
        ]);
      });
    });

    describe("getFormQuestions", () => {
      it("If there are no questions should return an empty array", async () => {
        const jotform = new Jotform({
          fetch: mockedFetch(empty),
        });
        expect(await jotform.getFormQuestions("1")).toEqual([]);
      });
      it("If there are questions should return the list", async () => {
        const jotform = new Jotform({
          fetch: mockedFetch((url: string) => {
            return {
              1: mockedQuestion,
            };
          }),
        });
        expect(await jotform.getFormQuestions("1")).toEqual([
          {
            id: "1",
            title: "Question 1",
            type: "control_textbox",
            description: "Description",
            name: "question1",
          },
        ]);
      });
    });

    describe("getForm", () => {
      it("If there are no questions should return an empty array", async () => {
        const jotform = new Jotform({
          fetch: mockedFetch(empty),
        });
        expect(await jotform.getForm("1")).toEqual({
          questions: [],
          submissions: [],
        });
      });

      it("If there are questions should return the list", async () => {
        const jotform = new Jotform({
          fetch: mockedFetch((url: string) => {
            if (url.includes("questions")) {
              return {
                1: mockedQuestion,
              };
            }
            if (url.includes("submissions")) {
              return [
                {
                  id: "1",
                  answers: { "1": { answer: "Answer 1" } },
                },
              ];
            }
          }),
        });
        expect(await jotform.getForm("1")).toEqual({
          questions: [
            {
              id: "1",
              title: "Question 1",
              type: "control_textbox",
              description: "Description",
              name: "question1",
            },
          ],
          submissions: [
            {
              id: "1",
              answers: {
                question1: {
                  type: "control_textbox",
                  title: "Question 1",
                  answer: "Answer 1",
                },
              },
            },
          ],
        });
      });
    });
  });
});
