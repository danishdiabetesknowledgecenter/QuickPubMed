// src/utils/axiosInstance.js
import axios from "axios";
import Bottleneck from "bottleneck";

// Create a Bottleneck limiter to allow max 3 requests per second
const limiter = new Bottleneck({
  reservoir: 3, // initial number of requests
  reservoirRefreshAmount: 3,
  reservoirRefreshInterval: 1000, // every 1000 ms
  maxConcurrent: 1, // one request at a time
});

// Create a shared axios instance
const axiosInstance = axios.create({
  baseURL: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils",
  headers: { Accept: "application/json, text/plain, */*" },
  timeout: 10000, // 10 seconds
});

// Wrap each request with the limiter
axiosInstance.interceptors.request.use((config) => {
  return limiter.schedule(() => Promise.resolve(config));
});

// Add a response interceptor for handling retries
axiosInstance.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error) => {
    const { config, response } = error;

    // If there's no config or retries option, reject
    if (!config || !config.retry) {
      console.log("Request failed without retry option:", config?.url);
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
      console.log(`Max retries reached for: ${config.url}`);
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
