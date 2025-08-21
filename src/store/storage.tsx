import AsyncStorage from '@react-native-async-storage/async-storage';

// Define interfaces for storage
interface StorageInterface {
  getString: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

// Create AsyncStorage-based implementations
const tokenStorage: StorageInterface = {
  getString: async (key: string) => await AsyncStorage.getItem(`token:${key}`),
  set: async (key: string, value: string) => await AsyncStorage.setItem(`token:${key}`, value),
  delete: async (key: string) => await AsyncStorage.removeItem(`token:${key}`),
  clearAll: async () => {
    const keys = await AsyncStorage.getAllKeys();
    const tokenKeys = keys.filter(key => key.startsWith('token:'));
    await AsyncStorage.multiRemove(tokenKeys);
  }
};

const storage: StorageInterface = {
  getString: async (key: string) => await AsyncStorage.getItem(`app:${key}`),
  set: async (key: string, value: string) => await AsyncStorage.setItem(`app:${key}`, value),
  delete: async (key: string) => await AsyncStorage.removeItem(`app:${key}`),
  clearAll: async () => {
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter(key => key.startsWith('app:'));
    await AsyncStorage.multiRemove(appKeys);
  }
};

// Export the storage interfaces
export { tokenStorage, storage };

// Create a storage API compatible with the rest of the app
export const mmkvStorage = {
  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },
  getItem: async (key: string) => {
    return await AsyncStorage.getItem(key);
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};
