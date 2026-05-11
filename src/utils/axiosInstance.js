// src/utils/axiosInstance.js
import axios from "axios";
import { settings } from "@/config/settings";

const queue = [];
let activeRequests = 0;
let tokens = 3;

setInterval(() => {
  tokens = 3;
  drainQueue();
}, 1000);

function drainQueue() {
  if (activeRequests > 0 || tokens <= 0 || queue.length === 0) return;
  tokens -= 1;
  activeRequests += 1;

  const { config, resolve } = queue.shift();
  resolve(config);
  activeRequests -= 1;
  drainQueue();
}

function scheduleRequest(config) {
  return new Promise((resolve) => {
    queue.push({ config, resolve });
    drainQueue();
  });
}

// Create a shared axios instance - now uses PHP proxy to hide API key
const axiosInstance = axios.create({
  baseURL: settings.nlm.proxyUrl,
  headers: { Accept: "application/json, text/plain, */*" },
  timeout: 10000, // 10 seconds
});

// Wrap each request with the limiter
axiosInstance.interceptors.request.use((config) => {
  return scheduleRequest(config);
});

// Add a response interceptor for handling retries
axiosInstance.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error) => {
    const { config, response } = error;

    // If there's no config or retries option, reject
    if (!config || !config.retry) {
      return Promise.reject(error);
    }

    // Determine if the error is retryable
    const retryable =
      !response || // Network or CORS errors
      response.status === 429 || // Too Many Requests
      response.status >= 500; // Server errors

    if (!retryable) {
      return Promise.reject(error);
    }

    // Initialize the retry count
    config.__retryCount = config.__retryCount || 0;

    // Check if max retries have been reached
    if (config.__retryCount >= config.retry) {
      return Promise.reject(error);
    }

    // Increment the retry count
    config.__retryCount += 1;

    // Calculate exponential backoff delay
    const delay = Math.pow(2, config.__retryCount) * 1000; // 2000ms, 4000ms, etc.

    console.warn(`Retrying request (${config.__retryCount}/${config.retry}) in ${delay}ms...`);

    // Wait for the delay before retrying
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry the request using the shared axiosInstance
    return axiosInstance(config);
  }
);

export default axiosInstance;
