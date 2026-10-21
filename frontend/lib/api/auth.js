import { api } from "./api";

function saveAuth(data) {
  if (typeof window === "undefined") {
    return;
  }

  if (data?.accessToken) {
    localStorage.setItem(
      "accessToken",
      data.accessToken
    );
  }

  if (data?.refreshToken) {
    localStorage.setItem(
      "refreshToken",
      data.refreshToken
    );
  }

  if (data?.token) {
    localStorage.setItem(
      "token",
      data.token
    );
  }

  if (data?.user) {
    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );
  }

  if (data?.company) {
    localStorage.setItem(
      "company",
      JSON.stringify(data.company)
    );
  }
}

export async function login(
  email,
  password
) {
  const data = await api(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  saveAuth(data);

  return data;
}

export async function register({
  name,
  subdomain,
  ownerEmail,
  password,
}) {
  const data = await api(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        subdomain,
        ownerEmail,
        password,
      }),
    }
  );

  saveAuth(data);

  return data;
}

export function getCurrentUser() {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const user =
    localStorage.getItem("user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function getCurrentCompany() {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const company =
    localStorage.getItem("company");

  if (!company) {
    return null;
  }

  try {
    return JSON.parse(company);
  } catch {
    return null;
  }
}

export function getAccessToken() {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  return (
    localStorage.getItem(
      "accessToken"
    ) ||
    localStorage.getItem("token")
  );
}

export function logout() {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    "accessToken"
  );

  localStorage.removeItem(
    "refreshToken"
  );

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("company");
}