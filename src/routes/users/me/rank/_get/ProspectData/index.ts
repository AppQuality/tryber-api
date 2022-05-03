import getLevelDefinitions from "../getLevelDefinitions";
import noLevel from "../noLevel";

export default class ProspectData {
  ready: Promise<any>;
  private definitions: LevelDefinition[];
  private currentLevel: LevelDefinition;
  private monthlyExp: number;

  private prospectLevel: {
    level: { id: number; name: string };
    next?: { level: { id: number; name: string }; points: number };
  };
  private nextLevel: LevelDefinition | undefined;

  constructor(currentLevelId: number, monthlyExp: number) {
    this.definitions = [];
    this.monthlyExp = monthlyExp;
    this.currentLevel = { ...noLevel, reach_exp_pts: 0, hold_exp_pts: 0 };
    this.prospectLevel = { level: noLevel };

    this.ready = new Promise(async (resolve, reject) => {
      this.definitions = await getLevelDefinitions();
      const currentLevel = this.definitions.find(
        (level) => level.id === currentLevelId
      );
      if (!currentLevel) {
        return reject("Could not find current level");
      }
      this.currentLevel = currentLevel;
      if (this.isToDowngrade()) {
        this.prospectLevel = this.getDowngradeLevel();
      } else {
        this.prospectLevel = this.getUpgradeOrMaintenanceLevel();
        if (this.prospectLevel.level.id > currentLevel.id) {
          this.nextLevel = this.definitions.find(
            (definition) => definition.id > this.prospectLevel.level.id
          );
          if (this.nextLevel) {
            this.prospectLevel.next = {
              level: { id: this.nextLevel.id, name: this.nextLevel.name },
              points: this.nextLevel.reach_exp_pts - this.monthlyExp,
            };
          }
        }
      }
      resolve(true);
    });
  }

  getDefinitions = () => {
    return this.definitions;
  };

  getCurrentLevelDefinition = () => {
    return this.currentLevel;
  };

  isToDowngrade = () => {
    return this.monthlyExp < this.currentLevel.hold_exp_pts;
  };

  getDowngradeLevel = () => {
    const previousLevel = this.definitions.find(
      (definition) => definition.id < this.currentLevel.id
    );
    if (previousLevel) {
      return {
        level: { id: previousLevel.id, name: previousLevel.name },
        maintenance: this.currentLevel.hold_exp_pts - this.monthlyExp,
      };
    }

    throw new Error("No current level");
  };

  getUpgradeOrMaintenanceLevel(
    currentLevel?: LevelDefinition
  ): typeof this.prospectLevel {
    const currentLevelDefinition = currentLevel || this.currentLevel;
    let prospectLevel = this.definitions.find(
      (level) =>
        this.monthlyExp >= level.reach_exp_pts &&
        level.id > currentLevelDefinition.id
    );
    if (!prospectLevel) {
      return {
        level: {
          id: currentLevelDefinition.id,
          name: currentLevelDefinition.name,
        },
      };
    }
    return this.getUpgradeOrMaintenanceLevel(prospectLevel);
  }

  getNextLevel = () => {
    return this.nextLevel;
  };

  getProspectLevel = () => {
    return this.prospectLevel;
  };
}
