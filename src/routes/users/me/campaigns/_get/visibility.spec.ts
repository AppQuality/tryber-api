import { expect } from "chai";
import RouteItem from "./index";

describe("getVisibility", () => {
  const routeItem = new RouteItem({} as any);

  it("should return 'candidate' if the user is already applied", () => {
    const result = routeItem["getVisibility"]({
      applied: true,
      start_date: "2024-08-01T14:05:35.545180",
    });
    expect(result).to.equal("candidate");
  });

  it("should return 'unavailable' if the start date is in the future", () => {
    const result = routeItem["getVisibility"]({
      applied: false,
      start_date: "2999-08-01T14:05:35.545180",
    });
    expect(result).to.equal("unavailable");
  });

  it("should return 'unavailable' if there are no free spots", () => {
    const result = routeItem["getVisibility"]({
      applied: false,
      start_date: "2024-08-01T14:05:35.545180",
      freeSpots: 0,
    });
    expect(result).to.equal("unavailable");
  });

  it("should return 'available' if the user is not applied, the start date is not in the future, and there are free spots", () => {
    const result = routeItem["getVisibility"]({
      applied: false,
      start_date: "2024-08-01T14:05:35.545180",
      freeSpots: 5,
    });
    expect(result).to.equal("available");
  });
});
