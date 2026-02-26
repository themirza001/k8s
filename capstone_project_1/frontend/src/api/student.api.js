import apiClient from "./client";

export const studentApi = {
  addStudent: (student) => apiClient.post("/api/students", student),
  getStudents: () => apiClient.get("/api/students"),
};