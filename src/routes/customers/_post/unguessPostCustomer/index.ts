import axios from "axios";
import config from "@src/config";
const { basePath, username, password } = config.unguessApi || {};

async function authenticateUnguess(): Promise<string> {
  try {
    const response = await axios.post(`${basePath}/authenticate`, {
      username,
      password,
    });

    if (response.data && response.data.token) {
      return response.data.token;
    } else {
      throw new Error("Authentication failed: Token not found");
    }
  } catch (error) {
    console.error("Error authenticating with Unguess API:", error);
    throw error;
  }
}

async function postCustomerUnguess(
  token: string,
  company: string,
  userId: number
): Promise<{ id: number; name: string }> {
  try {
    const response = await axios.post(
      `${basePath}/workspaces`,
      { company, pm_id: userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error posting customer data", error);
    throw error;
  }
}

async function unguessPostCustomer({
  userId,
  company,
}: {
  userId: number;
  company: string;
}): Promise<{ id: number; name: string } | undefined> {
  try {
    const token = await authenticateUnguess();

    const customer = await postCustomerUnguess(token, company, userId);

    return { id: customer.id, name: customer.name };
  } catch (error) {
    console.error("Error in callUnguessPostCustomer:", error);
  }
}

export { unguessPostCustomer };
