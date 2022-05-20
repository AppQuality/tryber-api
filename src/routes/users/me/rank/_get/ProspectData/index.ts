import getLevelDefinitions from "../getLevelDefinitions";
import noLevel from "../noLevel";

export default class ProspectData {
  ready: Promise<any>;
  private definitions: LevelDefinition[];
  private currentLevel: LevelDefinition;
  private monthlyExp: number;
  private totalExp: number;
  private LEGENDARY_LEVEL = 100;
  private LEGENDARY_EXP_POINTS = 100000;

  private prospectLevel: {
    level: { id: number; name: string };
    next?: { level: { id: number; name: string }; points: number };
  };
  private nextLevel: LevelDefinition | undefined;

  constructor(currentLevelId: number, monthlyExp: number, totalExp: number) {
    this.definitions = [];
    this.monthlyExp = monthlyExp;
    this.totalExp = totalExp;
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
      if (this.isLegendary()) {
        this.prospectLevel = {
          level: this.legendaryLevel(),
        };
        return resolve(true);
      }

      if (this.willUpgradeToLegendary()) {
        this.prospectLevel = {
          level: this.legendaryLevel(),
        };
        return resolve(true);
      }
      if (this.isToDowngrade()) {
        try {
          this.prospectLevel = this.getDowngradeLevel();
          return resolve(true);
        } catch (err) {
          return reject(err);
        }
      }

      try {
        this.prospectLevel = this.getUpgradeOrMaintenanceLevel();
      } catch (err) {
        return reject(err);
      }

      if (this.prospectLevelIsCurrentOrHigher()) {
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
      resolve(true);
    });
  }

  getDefinitions = () => {
    return this.definitions;
  };

  getCurrentLevelDefinition = () => {
    return this.currentLevel;
  };

  prospectLevelIsCurrentOrHigher() {
    return this.prospectLevel.level.id >= this.currentLevel.id;
  }
  isToDowngrade = () => {
    return this.monthlyExp < this.currentLevel.hold_exp_pts;
  };

  isLegendary = () => {
    return this.currentLevel.id === this.LEGENDARY_LEVEL;
  };

  willUpgradeToLegendary = () => {
    return this.totalExp >= this.LEGENDARY_EXP_POINTS;
  };

  legendaryLevel = () => {
    const legendaryLevelData = this.definitions.find(
      (level) => level.id === this.LEGENDARY_LEVEL
    );
    if (!legendaryLevelData) return noLevel;
    return {
      id: legendaryLevelData.id,
      name: legendaryLevelData.name,
    };
  };

  getDowngradeLevel = () => {
    const previousLevel = this.definitions
      .reverse()
      .find((definition) => definition.id < this.currentLevel.id);
    if (previousLevel) {
      return {
        level: this.getCurrentLevel(),
        maintenance: this.currentLevel.hold_exp_pts - this.monthlyExp,
      };
    }

    throw new Error("No current level");
  };

  getCurrentLevel = () => {
    return {
      id: this.currentLevel.id,
      name: this.currentLevel.name,
    };
  };

  getUpgradeOrMaintenanceLevel(
    currentLevel?: LevelDefinition
  ): typeof this.prospectLevel {
    const currentLevelDefinition = currentLevel || this.currentLevel;
    let prospectLevel = this.definitions.find(
      (level) =>
        level.reach_exp_pts !== null &&
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
