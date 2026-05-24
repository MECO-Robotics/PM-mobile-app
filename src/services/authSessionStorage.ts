import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import type { SessionUser } from "../types/domain";

type PersistedAuthSession = {
  token: string;
  user: SessionUser;
};

const SESSION_STORAGE_KEY = "meco-mobile-auth-session:v1";

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.accountId === "string" &&
    candidate.accountId.length > 0 &&
    (candidate.authProvider === "google" || candidate.authProvider === "email") &&
    typeof candidate.email === "string" &&
    candidate.email.length > 0 &&
    typeof candidate.name === "string" &&
    candidate.name.length > 0 &&
    (candidate.picture === null || typeof candidate.picture === "string") &&
    typeof candidate.hostedDomain === "string" &&
    candidate.hostedDomain.length > 0
  );
}

function parsePersistedSession(rawValue: string | null): PersistedAuthSession | null {
  if (!rawValue) {
    return null;
  }

  let value: unknown;
  try {
    value = JSON.parse(rawValue);
  } catch {
    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.token !== "string" || candidate.token.length === 0) {
    return null;
  }

  if (!isSessionUser(candidate.user)) {
    return null;
  }

  return {
    token: candidate.token,
    user: candidate.user,
  };
}

async function readStoredSessionRaw(): Promise<string | null> {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(SESSION_STORAGE_KEY);
  }

  try {
    return await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function clearLegacyAsyncStorageSession() {
  try {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Legacy fallback cleanup is best-effort; native reads never trust AsyncStorage.
  }
}

async function writeStoredSessionRaw(rawValue: string | null) {
  if (Platform.OS === "web") {
    if (rawValue === null) {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    await AsyncStorage.setItem(SESSION_STORAGE_KEY, rawValue);
    return;
  }

  if (rawValue === null) {
    await clearLegacyAsyncStorageSession();
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
    return;
  }

  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, rawValue);
  await clearLegacyAsyncStorageSession();
}

export async function loadPersistedAuthSession() {
  const rawValue = await readStoredSessionRaw();
  const parsed = parsePersistedSession(rawValue);

  if (!parsed && rawValue !== null) {
    await writeStoredSessionRaw(null);
  }

  return parsed;
}

export async function savePersistedAuthSession(session: PersistedAuthSession) {
  await writeStoredSessionRaw(JSON.stringify(session));
}

export async function clearPersistedAuthSession() {
  await writeStoredSessionRaw(null);
}

export type { PersistedAuthSession };
