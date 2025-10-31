const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Use same API base as backend’s `API_BASE`
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// ✅ Full API root
const BASE_URL = `${BACKEND_URL}${API_BASE}`;

// ✅ Direct access to storage files
const STORAGE_BASE_URL = `${BACKEND_URL}/storage`;

const API = {
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    RESEND_OTP: `${BASE_URL}/auth/resend-otp`,
  },
  FILES: {
    UPLOAD: `${BASE_URL}/upload`,
    RETRIEVE: (hash) => `${BASE_URL}/retrieve/${hash}`,
    ENCRYPTED: (hash) => `${BASE_URL}/encrypted/${hash}`,
  },
  STORAGE: {
    FRAGMENTS: `${STORAGE_BASE_URL}/fragments`,
    MANIFESTS: `${STORAGE_BASE_URL}/manifests`,
    ENCRYPTED: `${STORAGE_BASE_URL}/encrypted`,
  },
};

export default API;
