import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Capa de abstracción para persistencia segura multiplataforma.
 * En dispositivos móviles utiliza SecureStore (Keychain en iOS, Keystore en Android).
 * En la web recurre a localStorage de forma segura.
 */
class StorageService {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`Error al leer la clave "${key}" del almacenamiento:`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn(`Error al guardar la clave "${key}" en el almacenamiento:`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn(`Error al eliminar la clave "${key}" del almacenamiento:`, error);
    }
  }
}

export const storage = new StorageService();
