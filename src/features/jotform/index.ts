const globalFetch = fetch;
type FetchType = typeof globalFetch;

export default class Jotform {
  private apikey: string;
  private baseUrl: string = "https://eu-api.jotform.com";
  private fetch: typeof globalFetch;

  constructor({
    fetch = globalFetch,
  }:
    | {
        fetch?: FetchType;
      }
    | undefined = {}) {
    const apikey = process.env.JOTFORM_APIKEY;
    if (!apikey) throw new Error("Jotform apikey not found");
    this.apikey = apikey;
    this.fetch = fetch;
  }

  private async retrieveForms(offset: number = 0) {
    return await this.fetch(
      `${this.baseUrl}/user/forms?limit=1000&offset=${offset}`,
      {
        method: "GET",
        headers: {
          APIKEY: this.apikey,
        },
      }
    ).then((response) => response.json());
  }
  private async retrieveForm(formId: string) {
    return await this.fetch(`${this.baseUrl}/form/${formId}`, {
      method: "GET",
      headers: {
        APIKEY: this.apikey,
      },
    }).then((response) => response.json());
  }

  private async retrieveSubmissions(formId: string) {
    return await this.fetch(`${this.baseUrl}/form/${formId}/submissions`, {
      method: "GET",
      headers: {
        APIKEY: this.apikey,
      },
    }).then((response) => response.json());
  }

  private async retrieveQuestions(formId: string) {
    return await this.fetch(`${this.baseUrl}/form/${formId}/questions`, {
      method: "GET",
      headers: {
        APIKEY: this.apikey,
      },
    }).then((response) => response.json());
  }

  async getForms(
    acc = [] as { name: string; id: string }[],
    offset: number = 0
  ): Promise<{ name: string; id: string }[]> {
    const forms = await this.retrieveForms(offset);

    if (forms.content.length < 1000) {
      return [
        ...acc,
        ...forms.content.map((form: any) => ({
          id: form.id,
          name: form.title,
          createdAt: form.created_at,
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
    const submissions = await this.retrieveSubmissions(formId);
    const form = await this.retrieveForm(formId);
    const createdAt = form.content.created_at;

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
          date: submission.created_at,
        };
      })
      .filter((submission: any) => submission.answers);
    return { questions, submissions: results, createdAt };
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
    const results = await this.retrieveQuestions(formId);
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
