import { readDomainDefaults } from "../exec";
import type { DefaultsSettings, CollectionResult, DefaultsDomain } from "../types";
import { COMMON_DEFAULTS_DOMAINS } from "../types";

/**
 * Collect macOS defaults from common domains
 */
export async function collectDefaults(): Promise<CollectionResult<DefaultsSettings>> {
  const defaults: DefaultsSettings = {};
  const errors: string[] = [];

  for (const domain of COMMON_DEFAULTS_DOMAINS) {
    try {
      const domainDefaults = await readDomainDefaults(domain);
      if (domainDefaults) {
        // Filter out null values and convert to our format
        const filtered: DefaultsDomain = {};
        for (const [key, value] of Object.entries(domainDefaults)) {
          if (
            value !== null &&
            (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
          ) {
            filtered[key] = value;
          }
        }

        if (Object.keys(filtered).length > 0) {
          defaults[domain] = filtered;
        }
      }
    } catch (error) {
      errors.push(`Failed to collect ${domain}: ${(error as Error).message}`);
    }
  }

  return {
    success: Object.keys(defaults).length > 0,
    data: defaults,
    error: errors.length > 0 ? errors.join("\n") : undefined,
  };
}

/**
 * Collect defaults from a specific domain
 */
export async function collectDomainDefaults(domain: string): Promise<CollectionResult<DefaultsDomain>> {
  try {
    const domainDefaults = await readDomainDefaults(domain);
    if (!domainDefaults) {
      return {
        success: false,
        error: `Could not read defaults for ${domain}`,
      };
    }

    const filtered: DefaultsDomain = {};
    for (const [key, value] of Object.entries(domainDefaults)) {
      if (value !== null && (typeof value === "string" || typeof value === "number" || typeof value === "boolean")) {
        filtered[key] = value;
      }
    }

    return {
      success: true,
      data: filtered,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
