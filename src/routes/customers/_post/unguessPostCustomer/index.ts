import config from "@src/config";
const { basePath, username, password } = config.unguessApi || {};

async function authenticateUnguess(): Promise<string> {
  try {
    const response = await fetch(`${basePath}/authenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.token) {
      return data.token;
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
    const response = await fetch(`${basePath}/workspaces`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ company, pm_id: userId }),
    });

    if (!response.ok) {
      throw new Error(`Error posting customer data: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error posting customer data:", error);
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
