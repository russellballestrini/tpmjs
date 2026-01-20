// Library exports for programmatic use

export type {
  Agent,
  ApiKey,
  ApiResponse,
  Collection,
  CreateAgentInput,
  CreateCollectionInput,
  PaginatedResponse,
  PaginationOptions,
  Stats,
  Tool,
  ToolSearchOptions,
  TpmClientOptions,
  UpdateAgentInput,
  UpdateCollectionInput,
  User,
} from './lib/api-client.js';
export { ApiError, getClient, TpmClient } from './lib/api-client.js';
export type { TpmConfig, TpmCredentials } from './lib/config.js';
export {
  deleteCredentials,
  getApiKey,
  getApiUrl,
  getConfig,
  getConfigValue,
  hasCredentials,
  loadCredentials,
  saveCredentials,
  setConfig,
  setConfigValue,
} from './lib/config.js';
export type { OutputOptions } from './lib/output.js';
export { createOutput, OutputFormatter } from './lib/output.js';
