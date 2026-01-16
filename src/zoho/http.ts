import axios from "axios";

export const http = axios.create({
  timeout: 15_000,
  maxRedirects: 5 // ensure 307 -> /customers/ is followed
});