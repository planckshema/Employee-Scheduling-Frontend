import axios from "axios";
import Utils from "@/config/utils.js";
import AuthServices from "./authServices.js";
import Router from "../router.js";

const configuredBaseUrl = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VUE_APP_API_URL ||
  ""
).trim();
const apiPath = "/workerscheduling-t8";
const defaultDevBaseUrl = `http://localhost:3100${apiPath}`;
const defaultProdBaseUrl = apiPath;



// 2. Fix the "Helper" function to look for the right name
const normalizeBaseUrl = (url) => {
  if (!url) return url;

  const trimmedUrl = url.replace(/\/+$/, "");
  const withoutLegacyPath = trimmedUrl.replace(
    /\/(tutorial|workerscheduling-t8)$/,
    ""
  );

  return `${withoutLegacyPath}${apiPath}`;
};

const rawBaseUrl = configuredBaseUrl
  ? normalizeBaseUrl(configuredBaseUrl)
  : (import.meta.env.DEV
      ? defaultDevBaseUrl
      : defaultProdBaseUrl);

const baseurl =
  rawBaseUrl === "/" ? rawBaseUrl : rawBaseUrl.replace(/\/+$/, "");

const apiClient = axios.create({
  baseURL: baseurl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  transformResponse: (data) => {
    if (!data) {
      return data;
    }

    let parsed = data;
    try {
      parsed = JSON.parse(data);
    } catch (err) {
      return data;
    }

    if (
      parsed.message !== undefined &&
      parsed.message.includes("Unauthorized")
    ) {
      AuthServices.logoutUser(Utils.getStore("user"))
        .then(() => {
          Utils.removeItem("user");
          Router.push({ name: "login" });
        })
        .catch((error) => {
          console.log("error", error);
        });
    }

    return parsed;
  },
});

apiClient.interceptors.request.use((config) => {
  const user = Utils.getStore("user");
  const token = user?.token;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;