(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.OrthomancerStartup = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function inspectRaw(raw) {
    if (!raw) return { kind: "missing", parsed: null };
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { kind: "corrupt", parsed: null };
      }
      return { kind: "valid", parsed };
    } catch {
      return { kind: "corrupt", parsed: null };
    }
  }

  function resolvePersistentSave(currentRaw, legacyEntries = []) {
    const current = inspectRaw(currentRaw);
    if (current.kind === "valid") {
      return { status: "returning", parsed: current.parsed, legacyKey: null };
    }
    if (current.kind === "corrupt") {
      return { status: "recovered", parsed: null, legacyKey: null };
    }

    let sawCorruptLegacy = false;
    for (const entry of legacyEntries) {
      if (!entry || !entry.raw) continue;
      const inspected = inspectRaw(entry.raw);
      if (inspected.kind === "valid") {
        return { status: "migrated", parsed: inspected.parsed, legacyKey: entry.key || null };
      }
      if (inspected.kind === "corrupt") sawCorruptLegacy = true;
    }

    if (sawCorruptLegacy) {
      return { status: "recovered", parsed: null, legacyKey: null };
    }
    return { status: "fresh", parsed: null, legacyKey: null };
  }

  return { inspectRaw, resolvePersistentSave };
});
