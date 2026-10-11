const DEFAULT_API_BASE_URL = "https://geasteats.ngolab.online";

export const REMOTE_API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

// In development the Vite server forwards these requests to the remote API,
// so the browser only makes same-origin requests to localhost.
export const API_BASE_URL = import.meta.env?.DEV
  ? "/membership-api"
  : REMOTE_API_BASE_URL;
