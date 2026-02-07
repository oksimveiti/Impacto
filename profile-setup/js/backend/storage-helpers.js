export const STORAGE_KEYS = {
  PROFILE_PIC: "profilePicture",
  BIO: "bio",
  GENDER: "gender",
  HOBBIES: "hobbies",
  EVENT_PREFS: "eventPreferences",
  NOTIFICATIONS: "notifications",
  PRIVACY: "privacy",
  LOCATION: "location",
};

export const storageHelpers = {
  // Save data to sessionStorage
  save: function (key, value) {
    // Convert value to string if it's not already a string
    const valueToStore =
      typeof value === "string" ? value : JSON.stringify(value);
    sessionStorage.setItem(key, valueToStore);
  },

  // Get data from sessionStorage
  get: function (key, defaultValue = null) {
    const value = sessionStorage.getItem(key);
    if (!value) return defaultValue;

    // Try to parse JSON if the value looks like JSON
    try {
      if (value.startsWith("[") || value.startsWith("{")) {
        return JSON.parse(value);
      }
    } catch (e) {
      console.error(`Error reading data for key ${key}:`, e);
    }

    return value;
  },
};
