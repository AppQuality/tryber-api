/** OPENAPI-ROUTE: get-projects */
import { Context } from "openapi-backend";

export default (c: Context, req: Request, res: OpenapiResponse) => {
  res.status_code = 200;
  return [
    {
      id: 1,
      name: "Project 1",
      description: "Description 1",
    },
    {
      id: 2,
      name: "Project 2",
      description: "Description 2",
    },
  ];
};
