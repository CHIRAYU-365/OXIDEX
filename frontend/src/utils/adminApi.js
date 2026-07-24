export const getAdminHeaders = () => {
  const token = localStorage.getItem("token");
  const adminPin = sessionStorage.getItem("adminPin") || "a1b2";
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (adminPin) {
    headers["x-admin-pin"] = adminPin;
  }
  return headers;
};
