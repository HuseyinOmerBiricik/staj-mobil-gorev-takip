import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const getApiUrl = () => {
  // Expo'nun çalıştığı bilgisayarın adresi
  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    const host = hostUri.split(":")[0];

    return `http://${host}:3000/api`;
  }

  // Production / fallback
  return process.env.EXPO_PUBLIC_API_URL;
};

const API_URL = getApiUrl();

console.log("API URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("token");

      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
    }

    return Promise.reject(error);
  }
);

export default api;