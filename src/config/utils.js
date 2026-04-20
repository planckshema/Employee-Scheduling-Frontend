export default class Utils {
  static rolePreferenceKeyPrefix = "lastSelectedRole:";
  // set local storage
  static setStore = (name, content) => {
    if (!name) return;
    if (typeof content !== "string") {
      content = JSON.stringify(content);
    }
    return window.localStorage.setItem(name, content);
  };
  // get local storage
  static getStore = (name) => {
    if (!name) return;
    return JSON.parse(window.localStorage.getItem(name));
  };
  // remove item
  static removeItem = (name) => {
    if (!name) return;
    return window.localStorage.removeItem(name);
  };
  // get the local storage key used for a user's role preference
  static getRolePreferenceKey = (userOrUserId) => {
    const userId =
      typeof userOrUserId === "object" ? userOrUserId?.userId : userOrUserId;

    if (userId === undefined || userId === null || userId === "") {
      return null;
    }

    return `${Utils.rolePreferenceKeyPrefix}${userId}`;
  };
  // persist the last workspace role selected for a user
  static setLastSelectedRole = (userOrUserId, role) => {
    const storageKey = Utils.getRolePreferenceKey(userOrUserId);

    if (!storageKey || !role) return;
    return window.localStorage.setItem(storageKey, role);
  };
  // read the last workspace role selected for a user
  static getLastSelectedRole = (userOrUserId) => {
    const storageKey = Utils.getRolePreferenceKey(userOrUserId);

    if (!storageKey) return null;
    return window.localStorage.getItem(storageKey);
  };
  // resolve the best landing route for the signed-in user
  static getDefaultRouteForUser = (user) => {
    if (!user) {
      return { name: "login" };
    }

    if (user.isAdmin) {
      return { name: "adminDashboard" };
    }

    const lastSelectedRole = Utils.getLastSelectedRole(user);

    if (lastSelectedRole === "employer") {
      return { name: "employerSchedule" };
    }

    if (lastSelectedRole === "employee") {
      return { name: "employeeSchedule" };
    }

    return { name: "roleSelection" };
  };
  // validate email
  static isValidEmail = (value) => {
    return value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,64}$/i.test(value)
      ? false
      : true;
  };
}
