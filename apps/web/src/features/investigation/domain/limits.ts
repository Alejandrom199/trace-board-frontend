export const MAX_FILE_MB = 10;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
// Base64 expands three bytes to four characters, plus the data URL header.
export const MAX_ASSET_URL_LENGTH = Math.ceil(MAX_FILE_BYTES / 3) * 4 + 128;
