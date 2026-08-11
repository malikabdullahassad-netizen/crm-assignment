export {};

declare module '../api/axios' {
  import type { AxiosInstance } from 'axios';
  const API: AxiosInstance;
  export default API;
}
