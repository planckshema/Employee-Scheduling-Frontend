import axios from "axios";
import Utils from "@/config/utils.js";
import AuthServices from "./authServices.js";
import Router from "../router.js";

const configuredBaseUrl = (process.env.VUE_APP_API_URL || "").trim();
const defaultDevBaseUrl = "http://localhost:3100/tutorial/";
const defaultProdBaseUrl = "/tutorial/";

const baseurl =
  configuredBaseUrl ||
  (process.env.NODE_ENV === "development"
    ? defaultDevBaseUrl
    : defaultProdBaseUrl);

const apiClient = axios.create({
  baseURL: baseurl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Access-Control-Allow-Origin": "*",
    crossDomain: true,
  },
  transformRequest: (data, headers) => {
    const user = Utils.getStore("user");
    if (user != null) {
      const token = user.token;
      let authHeader = "";
      if (token != null && token !== "") authHeader = "Bearer " + token;
      headers.common["Authorization"] = authHeader;
    }
    return JSON.stringify(data);
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
          Router.push({ name: "roleSelection" });
        })
        .catch((error) => {
          console.log("error", error);
        });
    }

    return parsed;
  },
});

export default apiClient;
