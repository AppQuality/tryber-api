import app from "@src/app";
import request from "supertest";

export default (data: any) => {
  return async () => {
    const response = await request(app)
      .get("/users/me/rank/list")
      .set("authorization", "Bearer tester");
    expect(response.body).toHaveProperty("peers");
    expect(response.body.peers).toEqual([
      {
        position: 1,
        image: data.tester1.image,
        name: data.tester1.short_name,
        id: data.tester1.id,
        monthly_exp: data.tester1.exp.amount,
      },
      {
        position: 2,
        image: data.tester2.image,
        name: data.tester2.short_name,
        id: data.tester2.id,
        monthly_exp: data.tester2.exp.amount,
      },
      {
        position: 3,
        image: data.tester4.image,
        name: data.tester4.short_name,
        id: data.tester4.id,
        monthly_exp: data.tester4.exp.amount,
      },
      {
        position: 4,
        image: data.tester5.image,
        name: data.tester5.short_name,
        id: data.tester5.id,
        monthly_exp: data.tester5.exp.amount,
      },
      {
        position: 5,
        image: data.tester6.image,
        name: data.tester6.short_name,
        id: data.tester6.id,
        monthly_exp: data.tester6.exp.amount,
      },
      {
        position: 6,
        image: data.tester7.image,
        name: data.tester7.short_name,
        id: data.tester7.id,
        monthly_exp: data.tester7.exp.amount,
      },
      {
        position: 7,
        image: data.tester8.image,
        name: data.tester8.short_name,
        id: data.tester8.id,
        monthly_exp: data.tester8.exp.amount,
      },
      {
        position: 8,
        image: data.tester9.image,
        name: data.tester9.short_name,
        id: data.tester9.id,
        monthly_exp: data.tester9.exp.amount,
      },
      {
        position: 9,
        image: data.tester3.image,
        name: data.tester3.short_name,
        id: data.tester3.id,
        monthly_exp: data.tester3.exp.amount,
      },
    ]);
  };
};
