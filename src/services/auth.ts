export function parseJwt(token: string | null) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    // base64url -> base64
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if required
    const pad = b64.length % 4;
    const padded = pad === 2 ? b64 + "==" : pad === 3 ? b64 + "=" : b64;
    const decoded = atob(padded);
    // decoded may contain utf-8; use try/catch fallback
    try {
      return JSON.parse(decodeURIComponent(escape(decoded)));
    } catch (e) {
      return JSON.parse(decoded);
    }
  } catch (e) {
    return null;
  }
}

export function getCurrentUserRole() {
  const token = localStorage.getItem("authToken");
  const payload = parseJwt(token);
  if (!payload) return null;
  const candidates = [
    "role",
    "rol",
    "roles",
    "unique_name",
    "name",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
    "rol_empleado",
    "role_usuario",
    "rol_usuario",
  ];

  for (const key of candidates) {
    const val = payload[key];
    if (val != null) {
      // if claim is an object like { value: 'Admin' }
      if (typeof val === "object") {
        if (Array.isArray(val) && val.length > 0) return val[0];
        if ((val as any).value) return (val as any).value;
        if ((val as any).Value) return (val as any).Value;
        return JSON.stringify(val);
      }
      if (Array.isArray(val) && val.length > 0) return val[0];
      return val;
    }
  }

  // try scanning all payload props for 'rol' or 'role' substrings
  for (const k of Object.keys(payload)) {
    if (/role|rol/i.test(k)) {
      const v = payload[k];
      if (v != null) return Array.isArray(v) ? v[0] : v;
    }
  }

  return null;
}

export function getCurrentUserName() {
  const token = localStorage.getItem("authToken");
  const payload = parseJwt(token);
  if (!payload) return null;
  return (
    payload.name ||
    payload.nombre ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ] ||
    null
  );
}

export function isAdmin() {
  const role = getCurrentUserRole();
  if (!role) return false;
  const r = String(role).toLowerCase();
  return (
    r === "admin" ||
    r === "administrador" ||
    r === "administrador".toLowerCase() ||
    r.includes("admin")
  );
}

export function getCurrentUserEmpleadoId(): number | null {
  const token = localStorage.getItem("authToken");
  const payload = parseJwt(token);
  if (!payload) return null;
  const candidates = [
    "id_empleado",
    "idEmpleado",
    "IdEmpleado",
    "id_empleado",
    "id_empleado",
  ];
  for (const k of candidates) {
    if (payload[k] != null) return Number(payload[k]);
  }
  // try other common claim names
  if (payload.idEmpleado) return Number(payload.idEmpleado);
  if (payload.IdEmpleado) return Number(payload.IdEmpleado);
  return null;
}
