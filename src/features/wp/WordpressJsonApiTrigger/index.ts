import axios from "axios";

class WordpressJsonApiTrigger {
  constructor(private campaign: number) {}

  public async generateUseCase() {
    await this.postToWordpress(
      `regenerate-campaign-use-cases/${this.campaign}`
    );
  }

  public async generateMailMerges() {
    await this.postToWordpress(`regenerate-campaign-crons/${this.campaign}`);
  }

  public async generatePages() {
    await this.postToWordpress(`regenerate-campaign-pages/${this.campaign}`);
  }

  public async generateTasks() {
    await this.postToWordpress(`regenerate-campaign-tasks/${this.campaign}`);
  }

  private async postToWordpress(url: string) {
    try {
      await axios({
        method: "GET",
        url: `${process.env.WORDPRESS_API_URL}/${url}`,
        headers: {
          "User-Agent": "Tryber API",
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
      console.error("Error triggering wp", e);
      throw e;
    }
  }
}

export default WordpressJsonApiTrigger;
