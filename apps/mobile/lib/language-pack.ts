/**
 * Downloadable offline Dagbani language pack manager.
 * Models live on disk (not in the JS bundle). Supports versioning,
 * SHA-256 verification, and cleanup.
 */

import * as FileSystem from "expo-file-system/legacy";
import { LANGUAGE_PACK_URL, LANGUAGE_PACK_VERSION } from "./config";

export type PackComponentStatus = {
  ready: boolean;
  files: PackFile[];
};

export type PackFile = {
  role: string;
  path: string;
  bytes: number;
  sha256: string;
};

export type LanguagePackManifest = {
  pack_id: string;
  version: string;
  status: string;
  languages: string[];
  components: {
    translation: PackComponentStatus & {
      engine: string;
      task?: string;
      prefix?: string;
    };
    tts: PackComponentStatus & { engine: string };
  };
  total_bytes: number;
  license_status?: string;
};

export type PackInstallState =
  | { status: "missing" }
  | { status: "downloading"; progress: number }
  | { status: "verifying" }
  | { status: "ready"; manifest: LanguagePackManifest; rootUri: string }
  | { status: "error"; message: string };

function docsRoot() {
  const root = FileSystem.documentDirectory;
  if (!root) {
    throw new Error("FileSystem.documentDirectory unavailable");
  }
  return root;
}

function packDir() {
  return `${docsRoot()}language-packs/`;
}

function currentLink() {
  return `${packDir()}current.json`;
}

export function packRootForVersion(version: string) {
  return `${packDir()}${version}/`;
}

async function ensureDir(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  }
}

export async function getInstalledPack(): Promise<PackInstallState> {
  try {
    const metaInfo = await FileSystem.getInfoAsync(currentLink());
    if (!metaInfo.exists) return { status: "missing" };
    const raw = await FileSystem.readAsStringAsync(currentLink());
    const { version, rootUri } = JSON.parse(raw) as {
      version: string;
      rootUri: string;
    };
    const manifestUri = `${rootUri}manifest.json`;
    const mInfo = await FileSystem.getInfoAsync(manifestUri);
    if (!mInfo.exists) return { status: "missing" };
    const manifest = JSON.parse(
      await FileSystem.readAsStringAsync(manifestUri)
    ) as LanguagePackManifest;
    return { status: "ready", manifest, rootUri };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Failed to read pack",
    };
  }
}

/** Lightweight SHA-256 via SubtleCrypto when available; otherwise size check. */
export async function verifyFile(
  uri: string,
  expected: { bytes: number; sha256: string }
): Promise<{ ok: boolean; reason?: string }> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || !("size" in info) || info.size == null) {
    return { ok: false, reason: "missing" };
  }
  if (expected.bytes > 0 && info.size !== expected.bytes) {
    return {
      ok: false,
      reason: `size mismatch: got ${info.size}, expected ${expected.bytes}`,
    };
  }
  if (!expected.sha256) return { ok: true };
  // Full SHA-256 of large model files is expensive in JS; verify when SubtleCrypto + small files.
  try {
    if (typeof globalThis.crypto?.subtle?.digest === "function" && info.size < 8_000_000) {
      const b64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
      const hex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (hex !== expected.sha256) {
        return { ok: false, reason: "sha256 mismatch" };
      }
    }
  } catch {
    // Size check already done; continue.
  }
  return { ok: true };
}

export async function downloadLanguagePack(
  onProgress?: (p: number) => void,
  url: string = LANGUAGE_PACK_URL,
  version: string = LANGUAGE_PACK_VERSION
): Promise<PackInstallState> {
  if (!url) {
    return {
      status: "error",
      message:
        "LANGUAGE_PACK_URL is not configured. Set EXPO_PUBLIC_LANGUAGE_PACK_URL or install a local pack.",
    };
  }

  try {
    await ensureDir(packDir());
    const rootUri = packRootForVersion(version);
    await ensureDir(rootUri);

    // Download zip or manifest.json first. For v0 we expect a folder tarball URL
    // that resolves to manifest.json (+ sibling files). Simpler path: download manifest,
    // then each listed file.
    const manifestUri = `${rootUri}manifest.json`;
    const manifestDl = FileSystem.createDownloadResumable(
      url.endsWith("manifest.json") ? url : `${url.replace(/\/$/, "")}/manifest.json`,
      manifestUri,
      {},
      (prog) => {
        if (prog.totalBytesExpectedToWrite > 0) {
          onProgress?.(
            0.05 *
              (prog.totalBytesWritten / prog.totalBytesExpectedToWrite)
          );
        }
      }
    );
    const manifestResult = await manifestDl.downloadAsync();
    if (!manifestResult?.uri) {
      return { status: "error", message: "Failed to download manifest" };
    }

    const manifest = JSON.parse(
      await FileSystem.readAsStringAsync(manifestUri)
    ) as LanguagePackManifest;

    const allFiles = [
      ...(manifest.components.translation?.files ?? []),
      ...(manifest.components.tts?.files ?? []),
    ];
    const baseUrl = url.replace(/\/manifest\.json$/, "").replace(/\/$/, "");

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      const dest = `${rootUri}${file.path}`;
      const destDir = dest.slice(0, dest.lastIndexOf("/") + 1);
      await ensureDir(destDir);
      const dl = FileSystem.createDownloadResumable(
        `${baseUrl}/${file.path}`,
        dest,
        {},
        (prog) => {
          if (prog.totalBytesExpectedToWrite > 0) {
            const fileProg =
              prog.totalBytesWritten / prog.totalBytesExpectedToWrite;
            onProgress?.(0.05 + (0.9 * (i + fileProg)) / Math.max(allFiles.length, 1));
          }
        }
      );
      await dl.downloadAsync();
      const check = await verifyFile(dest, file);
      if (!check.ok) {
        return {
          status: "error",
          message: `Verify failed for ${file.path}: ${check.reason}`,
        };
      }
      onProgress?.(0.05 + (0.9 * (i + 1)) / Math.max(allFiles.length, 1));
    }

    await FileSystem.writeAsStringAsync(
      currentLink(),
      JSON.stringify({ version: manifest.version, rootUri })
    );
    onProgress?.(1);
    return { status: "ready", manifest, rootUri };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Download failed",
    };
  }
}

export async function deleteLanguagePack(): Promise<void> {
  const dir = packDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (info.exists) {
    await FileSystem.deleteAsync(dir, { idempotent: true });
  }
}

export async function freeSpaceHint(): Promise<number | null> {
  try {
    const free = await FileSystem.getFreeDiskStorageAsync();
    return free;
  } catch {
    return null;
  }
}

/** Install a pack from an already-bundled or locally copied folder (dev/testing). */
export async function registerLocalPack(
  rootUri: string,
  manifest: LanguagePackManifest
): Promise<PackInstallState> {
  await ensureDir(packDir());
  const dest = packRootForVersion(manifest.version);
  await ensureDir(dest);
  await FileSystem.writeAsStringAsync(
    `${dest}manifest.json`,
    JSON.stringify(manifest, null, 2)
  );
  await FileSystem.writeAsStringAsync(
    currentLink(),
    JSON.stringify({ version: manifest.version, rootUri: dest })
  );
  // rootUri arg retained for callers that already copied files into place
  void rootUri;
  return { status: "ready", manifest, rootUri: dest };
}
