import socketc from "socket.io-client";

let socketInstance = null;

const getTokenFromCookie = () => {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((c) => c.trim());
  const match = parts.find((p) => p.startsWith("token="));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1]);
};

export const initializeSocket = (projectId) => {
  if (socketInstance) return socketInstance;

  const cookieToken = getTokenFromCookie();
  const storageToken = localStorage.getItem("token");
  const token = cookieToken || storageToken || null;
  console.log(
    "Initializing socket with token:",
    token,
    "and projectId:",
    projectId
  );
  const url = import.meta.env.VITE_API_URL || window.location.origin;

  socketInstance = socketc(url, {
    auth: {
      token,
    },
    query: {
      projectId,
    },
    withCredentials: true,
    transports: ["websocket"],
  });

  return socketInstance;
};

export const receviceMessage = (eventName, cb) => {
  if (!socketInstance) return;
  socketInstance.on(eventName, cb);
};

export const sendMessage = (eventName, data) => {
  if (!socketInstance) return;
  socketInstance.emit(eventName, data);
};
