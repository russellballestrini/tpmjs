/**
 * @tpmjs/npm-client
 * NPM Registry API client for TPMJS
 */

// Changes feed
export {
  type Change,
  type ChangesFeedResponse,
  type FetchChangesOptions,
  type FetchChangesResult,
  fetchChanges,
} from './changes';
// GitHub statistics
export {
  fetchGitHubStars,
  fetchGitHubStarsFromRepository,
  type GitHubRepoResponse,
  parseGitHubUrl,
} from './github';

// Package metadata
export {
  fetchLatestPackageVersion,
  fetchLatestPackageWithMetadata,
  fetchPackageMetadata,
  fetchPackageTpmjsField,
  type PackageMetadata,
  type PackageVersion,
  type PackageVersionWithReadme,
} from './package';
// Rate limiting
export { delay, npmRateLimiter, RateLimiter, retryWithBackoff } from './rate-limiter';
// Keyword search
export {
  type SearchByKeywordOptions,
  type SearchPackage,
  type SearchResponse,
  type SearchResult,
  searchAllByKeyword,
  searchByKeyword,
} from './search';
// Download statistics
export { type DownloadsResponse, fetchBulkDownloadStats, fetchDownloadStats } from './stats';
