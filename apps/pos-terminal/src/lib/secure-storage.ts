import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

async function webGetItem(key: string): Promise<string | null> {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem(key);
}

async function webSetItem(key: string, value: string): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(key, value);
}

async function webDeleteItem(key: string): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem(key);
}

export const getItemAsync = isWeb ? webGetItem : SecureStore.getItemAsync;
export const setItemAsync = isWeb ? webSetItem : SecureStore.setItemAsync;
export const deleteItemAsync = isWeb ? webDeleteItem : SecureStore.deleteItemAsync;
