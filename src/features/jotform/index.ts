export default class Jotform {
  private apikey: string;
  private baseUrl: string = "https://eu-api.jotform.com";

  constructor() {
    const apikey = process.env.JOTFORM_APIKEY;
    if (!apikey) throw new Error("Jotform apikey not found");
    this.apikey = apikey;
  }

  async getForms(
    acc = [] as { name: string; id: string }[],
    offset: number = 0
  ): Promise<{ name: string; id: string }[]> {
    const forms = await fetch(
      `${this.baseUrl}/user/forms?limit=1000&offset=${offset}`,
      {
        method: "GET",
        headers: {
          APIKEY: this.apikey,
        },
      }
    ).then((response) => response.json());

    if (forms.content.length < 1000) {
      return [
        ...acc,
        ...forms.content.map((form: any) => ({
          id: form.id,
          name: form.title,
        })),
      ];
    }

    return await this.getForms(
      [
        ...acc,
        ...forms.content.map((form: any) => ({
          id: form.id,
          name: form.title,
        })),
      ],
      offset + 1000
    );
  }

  async getForm(formId: string) {
    const questions = await this.getFormQuestions(formId);
    const submissions = await fetch(
      `${this.baseUrl}/form/${formId}/submissions`,
      {
        method: "GET",
        headers: {
          APIKEY: this.apikey,
        },
      }
    ).then((response) => response.json());
    const results = submissions.content
      .map((submission: any) => {
        return {
          id: submission.id,
          answers: Object.entries(submission.answers).reduce(
            (acc, [key, value]: [string, any]) => {
              const question = questions.find(
                (question) => question.id === key
              );
              if (!question) return acc;
              acc[question.name] = {
                type: question.type,
                title: question.title,
                answer: value.answer,
              };
              return acc;
            },
            {} as any
          ),
        };
      })
      .filter((submission: any) => submission.answers);
    return { questions, submissions: results };
  }

  async getFormQuestions(formId: string): Promise<
    {
      id: string;
      type: string;
      title: string;
      description: string;
      name: string;
      options?: string[];
    }[]
  > {
    const results = await fetch(`${this.baseUrl}/form/${formId}/questions`, {
      method: "GET",
      headers: {
        APIKEY: this.apikey,
      },
    }).then((response) => response.json());
    return Object.entries(results.content).map(
      ([key, value]: [string, any]) => {
        const options =
          value.type === "control_yesno"
            ? ["SÌ", "NO"]
            : "options" in value
            ? value.options.split("|")
            : undefined;
        return {
          id: key,
          type: value.type,
          title: value.text,
          description: value.description,
          name: value.name,
          options,
        };
      }
    );
  }
}
