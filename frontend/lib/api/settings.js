import { api } from "./api";
import { mockApiEnabled } from "../config";

const STORAGE_KEY = "wholesaler_os_settings";

const defaultSettings = {
  language: "English",
  gstNo: "",
  upiId: "",
  whatsappToken: "",
  razorpayKey: "",
  tallySync: false,
  creditPolicy: {
    enabled: true,
    defaultCreditDays: 30,
    warningDaysBeforeDue: 3,
    allowOverLimit: false,
  },
};

function delay(ms = 300) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

function getStoredSettings() {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const stored =
      localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return defaultSettings;
    }

    const parsed = JSON.parse(stored);

    return {
      ...defaultSettings,
      ...parsed,
      creditPolicy: {
        ...defaultSettings.creditPolicy,
        ...(parsed.creditPolicy || {}),
      },
    };
  } catch {
    return defaultSettings;
  }
}

export async function getSettings() {
  if (!mockApiEnabled()) {
    const data = await api("/auth/me", { method: "GET" });
    return data?.company?.settings || {};
  }

  await delay();

  return getStoredSettings();
}

export async function updateSettings(settings) {
  if (!mockApiEnabled()) {
    const data = await api("/auth/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    return {
      ...data,
      settings: data?.settings || settings,
    };
  }

  await delay(400);

  if (typeof window !== "undefined") {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );
  }

  return {
    success: true,
    settings,
  };
}

export function getDefaultSettings() {
  return {
    ...defaultSettings,
    creditPolicy: {
      ...defaultSettings.creditPolicy,
    },
  };
}