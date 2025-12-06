const decodeBase64 = (value) => {
  try {
    const hasWindowAtob = typeof window !== "undefined" && typeof window.atob === "function";
    const hasGlobalAtob = typeof atob === "function";

    if (hasWindowAtob) {
      return window.atob(value);
    }

    if (!hasWindowAtob && hasGlobalAtob) {
      return atob(value);
    }

    const hasBuffer = typeof globalThis !== "undefined" && typeof globalThis.Buffer !== "undefined";
    if (hasBuffer) {
      return globalThis.Buffer.from(value, "base64").toString("binary");
    }
  } catch {
    // ignore
  }

  return "";
};

const decodeJwtComponent = (segment) => {
  if (!segment) return null;

  try {
    const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeBase64(padded);
    if (!decoded) return null;
    // Handle UTF-8 characters
    const json = decodeURIComponent(
      decoded
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const decodeJwt = (token) => {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  return decodeJwtComponent(parts[1]);
};

const parseStoredUser = () => {
  if (typeof window === "undefined") return null;

  const keys = ["usuario", "user", "currentUser"];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch {
      // ignore parsing/storage errors
    }
  }

  return null;
};

export const getUserIdFromToken = (token) => {
  const payload = decodeJwt(token);
  const candidate =
    payload?.userId ??
    payload?.usuarioId ??
    payload?.sub ??
    payload?.id ??
    payload?.user?.id ??
    payload?.usuario?.id ?? null;

  if (candidate !== null && candidate !== undefined) {
    return String(candidate);
  }

  const storedUser = parseStoredUser();
  if (storedUser?.id) {
    return String(storedUser.id);
  }
  if (storedUser?.usuarioId) {
    return String(storedUser.usuarioId);
  }

  return null;
};

export const getUserFromToken = (token) => {
  const payload = decodeJwt(token);
  if (payload?.user && typeof payload.user === "object") {
    return payload.user;
  }
  if (payload?.usuario && typeof payload.usuario === "object") {
    return payload.usuario;
  }
  return parseStoredUser();
};

export default {
  decodeJwt,
  getUserIdFromToken,
  getUserFromToken,
};
