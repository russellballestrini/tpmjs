/**
 * Package Source Fetcher
 * Fetches full source code for npm packages via multiple CDN sources
 */

export interface PackageFile {
  path: string;
  content: string;
}

export interface PackageSource {
  packageName: string;
  version: string;
  files: PackageFile[];
  packageJson: Record<string, unknown>;
}

// Maximum files to fetch per package
const MAX_FILES_PER_PACKAGE = 10;
// Maximum file size to fetch (50KB)
const MAX_FILE_SIZE = 50 * 1024;
// Timeout for individual fetches
const FETCH_TIMEOUT_MS = 10000;

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'tpmjs-skills-generator/1.0',
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch package.json from npm registry
 */
async function fetchPackageJson(
  packageName: string,
  version?: string
): Promise<{ packageJson: Record<string, unknown>; resolvedVersion: string }> {
  const registryUrl = `https://registry.npmjs.org/${packageName}`;
  const response = await fetchWithTimeout(registryUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch package.json for ${packageName}: ${response.status}`);
  }

  const data = await response.json();
  const resolvedVersion = version || data['dist-tags']?.latest;

  if (!resolvedVersion) {
    throw new Error(`Could not resolve version for ${packageName}`);
  }

  const versionData = data.versions?.[resolvedVersion];
  if (!versionData) {
    throw new Error(`Version ${resolvedVersion} not found for ${packageName}`);
  }

  return { packageJson: versionData, resolvedVersion };
}

/**
 * Get list of entry point files from package.json
 */
function getEntryPoints(packageJson: Record<string, unknown>): string[] {
  const entryPoints: string[] = [];

  // Check main entry point
  if (typeof packageJson.main === 'string') {
    entryPoints.push(packageJson.main);
  }

  // Check module entry point (ES modules)
  if (typeof packageJson.module === 'string') {
    entryPoints.push(packageJson.module);
  }

  // Check exports field (modern packages)
  if (packageJson.exports) {
    const exports = packageJson.exports as Record<string, unknown>;
    extractExportPaths(exports, entryPoints);
  }

  // Check types entry point
  if (typeof packageJson.types === 'string') {
    entryPoints.push(packageJson.types);
  }
  if (typeof packageJson.typings === 'string') {
    entryPoints.push(packageJson.typings);
  }

  // Default fallbacks if nothing found
  if (entryPoints.length === 0) {
    entryPoints.push('index.js', 'index.ts', 'src/index.js', 'src/index.ts');
  }

  // Dedupe and normalize paths
  const normalized = [...new Set(entryPoints)].map((p) => (p.startsWith('./') ? p.slice(2) : p));

  return normalized;
}

/**
 * Recursively extract paths from exports field
 */
function extractExportPaths(exports: Record<string, unknown>, paths: string[]): void {
  for (const value of Object.values(exports)) {
    if (typeof value === 'string') {
      paths.push(value);
    } else if (typeof value === 'object' && value !== null) {
      // Handle conditional exports like { "import": "./dist/index.mjs", "require": "./dist/index.cjs" }
      extractExportPaths(value as Record<string, unknown>, paths);
    }
  }
}

/**
 * Try to fetch a file from unpkg CDN
 */
async function fetchFromUnpkg(
  packageName: string,
  version: string,
  filePath: string
): Promise<string | null> {
  const url = `https://unpkg.com/${packageName}@${version}/${filePath}`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;

    // Check content length before reading
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
      console.warn(`File too large: ${filePath} (${contentLength} bytes)`);
      return null;
    }

    const text = await response.text();
    if (text.length > MAX_FILE_SIZE) {
      return null;
    }

    return text;
  } catch {
    return null;
  }
}

/**
 * Try to fetch a file from esm.sh CDN (with ?raw for source)
 */
async function fetchFromEsmSh(
  packageName: string,
  version: string,
  filePath: string
): Promise<string | null> {
  // esm.sh requires different URL patterns for raw source
  const url = `https://esm.sh/${packageName}@${version}/${filePath}?raw`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;

    const text = await response.text();
    if (text.length > MAX_FILE_SIZE) {
      return null;
    }

    return text;
  } catch {
    return null;
  }
}

/**
 * Fetch a single file from CDN (tries multiple sources)
 */
async function fetchFile(
  packageName: string,
  version: string,
  filePath: string
): Promise<string | null> {
  // Try unpkg first (more reliable for source files)
  let content = await fetchFromUnpkg(packageName, version, filePath);
  if (content) return content;

  // Try esm.sh as fallback
  content = await fetchFromEsmSh(packageName, version, filePath);
  if (content) return content;

  return null;
}

/**
 * Resolve a relative import path to an absolute path
 */
function resolveImportPath(importPath: string, baseDir: string): string {
  if (importPath.startsWith('./')) {
    return baseDir ? `${baseDir}/${importPath.slice(2)}` : importPath.slice(2);
  }

  if (importPath.startsWith('../')) {
    const parts = baseDir.split('/');
    const importParts = importPath.split('/');
    const upCount = importParts.filter((p) => p === '..').length;
    const remaining = importParts.slice(upCount).join('/');
    const baseParts = parts.slice(0, parts.length - upCount);
    return baseParts.length > 0 ? `${baseParts.join('/')}/${remaining}` : remaining;
  }

  return importPath;
}

/**
 * Add file path variations with common extensions
 */
function addPathVariations(resolvedPath: string, imports: string[]): void {
  if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(resolvedPath)) {
    imports.push(resolvedPath);
  } else {
    imports.push(`${resolvedPath}.ts`);
    imports.push(`${resolvedPath}.js`);
    imports.push(`${resolvedPath}/index.ts`);
    imports.push(`${resolvedPath}/index.js`);
  }
}

/**
 * Discover additional source files from a fetched file
 */
function discoverImports(content: string, basePath: string): string[] {
  const imports: string[] = [];
  const baseDir = basePath.includes('/') ? basePath.substring(0, basePath.lastIndexOf('/')) : '';

  // Match import/export statements for local files
  const importRegex = /(?:import|export).*from\s+['"](\.[^'"]+)['"]/g;
  const matches = content.matchAll(importRegex);

  for (const match of matches) {
    const importPath = match[1];
    if (!importPath) continue;

    const resolvedPath = resolveImportPath(importPath, baseDir);
    addPathVariations(resolvedPath, imports);
  }

  return imports;
}

/**
 * Fetch source files for an npm package
 */
export async function fetchPackageSource(
  packageName: string,
  version?: string
): Promise<PackageSource> {
  // 1. Fetch package.json to get metadata and entry points
  const { packageJson, resolvedVersion } = await fetchPackageJson(packageName, version);

  // 2. Get entry points to fetch
  const entryPoints = getEntryPoints(packageJson);
  const filesToFetch = new Set<string>();
  const fetchedFiles: PackageFile[] = [];
  const fetchedPaths = new Set<string>();

  // Add entry points to fetch queue
  for (const entry of entryPoints) {
    filesToFetch.add(entry);
  }

  // 3. Fetch files breadth-first, discovering imports
  const queue = [...filesToFetch];

  while (queue.length > 0 && fetchedFiles.length < MAX_FILES_PER_PACKAGE) {
    const filePath = queue.shift();
    if (!filePath) break;

    // Skip if already fetched
    if (fetchedPaths.has(filePath)) continue;
    fetchedPaths.add(filePath);

    // Try to fetch the file
    const content = await fetchFile(packageName, resolvedVersion, filePath);
    if (!content) continue;

    fetchedFiles.push({ path: filePath, content });

    // Discover imports and add to queue
    const imports = discoverImports(content, filePath);
    for (const importPath of imports) {
      if (!fetchedPaths.has(importPath) && !queue.includes(importPath)) {
        queue.push(importPath);
      }
    }
  }

  return {
    packageName,
    version: resolvedVersion,
    files: fetchedFiles,
    packageJson,
  };
}

/**
 * Fetch sources for multiple packages concurrently
 */
export async function fetchMultiplePackageSources(
  packages: Array<{ name: string; version?: string }>
): Promise<PackageSource[]> {
  const results = await Promise.allSettled(
    packages.map(({ name, version }) => fetchPackageSource(name, version))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<PackageSource> => r.status === 'fulfilled')
    .map((r) => r.value);
}
