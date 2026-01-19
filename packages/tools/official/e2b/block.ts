/**
 * Block metadata for E2B tools
 * This file provides metadata for the blocks validator
 */
import {
  createSandbox,
  downloadFile,
  getMetrics,
  getSandbox,
  installPackages,
  killSandbox,
  listFiles,
  listSandboxes,
  makeDirectory,
  pauseSandbox,
  readFile,
  resumeSandbox,
  runCode,
  runCommand,
  setEnvVars,
  setTimeout,
  uploadFile,
  watchDirectory,
  writeFile,
} from './src/index.js';

export const block = {
  name: 'e2b',
  description: 'E2B cloud sandbox tools for AI code execution',
  tools: {
    createSandbox,
    getSandbox,
    listSandboxes,
    killSandbox,
    setTimeout,
    runCode,
    runCommand,
    writeFile,
    readFile,
    listFiles,
    uploadFile,
    downloadFile,
    makeDirectory,
    watchDirectory,
    pauseSandbox,
    resumeSandbox,
    setEnvVars,
    getMetrics,
    installPackages,
  },
};

export default block;
