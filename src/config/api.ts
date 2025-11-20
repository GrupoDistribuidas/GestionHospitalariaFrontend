// Centraliza la URL base de la API para que no esté hardcodeada en múltiples archivos.
// Usa Vite env var VITE_API_BASE_URL si está presente, si no usa el valor por defecto de desarrollo.
export const API_BASE: string =
  (import.meta as any)?.env?.VITE_API_BASE_URL ?? "https://api-gateway.agreeablepond-a64b7258.brazilsouth.azurecontainerapps.io/api";
 