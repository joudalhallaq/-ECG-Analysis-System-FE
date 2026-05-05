import axios from "axios";

const API = axios.create({
  baseURL: "https://ecg-analysis-system-be.onrender.com/api",
  timeout: 90000,
});

export default API;
