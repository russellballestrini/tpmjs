/**
 * Block metadata for Postmark tools
 * This file provides metadata for the blocks validator
 */
import {
  activateBounce,
  archiveMessageStream,
  bypassInboundRules,
  // Data Removals
  createDataRemoval,
  createDomain,
  createInboundRule,
  createMessageStream,
  createSenderSignature,
  createServer,
  createSuppressions,
  createTemplate,
  createWebhook,
  deleteDomain,
  deleteInboundRule,
  deleteSenderSignature,
  deleteServer,
  deleteSuppressions,
  deleteTemplate,
  deleteWebhook,
  getBounce,
  getBounceDump,
  getBulkEmailStatus,
  getDataRemovalStatus,
  // Bounces
  getDeliveryStats,
  getDomain,
  getInboundMessageDetails,
  getMessageStream,
  getOutboundMessageClicks,
  getOutboundMessageDetails,
  getOutboundMessageDump,
  getOutboundMessageOpens,
  getSenderSignature,
  // Server Config
  getServer,
  getServerById,
  getStatsBounces,
  getStatsClicks,
  getStatsClicksByBrowser,
  getStatsClicksByLocation,
  getStatsClicksByPlatform,
  getStatsOpens,
  getStatsOpensByClient,
  getStatsOpensByPlatform,
  // Stats
  getStatsOverview,
  getStatsSends,
  getStatsSpamComplaints,
  getStatsTracked,
  getTemplate,
  getWebhook,
  // Domains
  listDomains,
  // Inbound Rules
  listInboundRules,
  // Message Streams
  listMessageStreams,
  // Sender Signatures
  listSenderSignatures,
  // Servers Management
  listServers,
  // Suppressions
  listSuppressions,
  // Templates
  listTemplates,
  // Webhooks
  listWebhooks,
  pushTemplates,
  resendSenderConfirmation,
  retryInboundMessage,
  rotateDomainDkim,
  searchBounces,
  // Messages — Inbound
  searchInboundMessages,
  searchMessageClicks,
  // Messages — Search Opens/Clicks
  searchMessageOpens,
  // Messages — Outbound
  searchOutboundMessages,
  sendBatchEmails,
  sendBatchWithTemplates,
  // Bulk Email
  sendBulkEmail,
  // Email Sending
  sendEmail,
  sendEmailWithTemplate,
  unarchiveMessageStream,
  updateDomain,
  updateMessageStream,
  updateSenderSignature,
  updateServer,
  updateServerById,
  updateTemplate,
  updateWebhook,
  validateTemplate,
  verifyDomainDkim,
  verifyDomainReturnPath,
  verifyDomainSpf,
} from './src/index.js';

export const block = {
  name: 'postmark',
  description:
    'Postmark email API tools for AI agents. Send emails, manage templates, bounces, domains, webhooks, and more.',
  tools: {
    // Email Sending
    sendEmail,
    sendBatchEmails,
    sendEmailWithTemplate,
    sendBatchWithTemplates,
    // Bulk Email
    sendBulkEmail,
    getBulkEmailStatus,
    // Bounces
    getDeliveryStats,
    searchBounces,
    getBounce,
    getBounceDump,
    activateBounce,
    // Templates
    listTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    validateTemplate,
    pushTemplates,
    // Server Config
    getServer,
    updateServer,
    // Servers Management
    listServers,
    getServerById,
    createServer,
    updateServerById,
    deleteServer,
    // Message Streams
    listMessageStreams,
    getMessageStream,
    createMessageStream,
    updateMessageStream,
    archiveMessageStream,
    unarchiveMessageStream,
    // Messages — Outbound
    searchOutboundMessages,
    getOutboundMessageDetails,
    getOutboundMessageDump,
    getOutboundMessageOpens,
    getOutboundMessageClicks,
    // Messages — Inbound
    searchInboundMessages,
    getInboundMessageDetails,
    bypassInboundRules,
    retryInboundMessage,
    // Messages — Search Opens/Clicks
    searchMessageOpens,
    searchMessageClicks,
    // Stats
    getStatsOverview,
    getStatsSends,
    getStatsBounces,
    getStatsSpamComplaints,
    getStatsTracked,
    getStatsOpens,
    getStatsOpensByPlatform,
    getStatsOpensByClient,
    getStatsClicks,
    getStatsClicksByBrowser,
    getStatsClicksByPlatform,
    getStatsClicksByLocation,
    // Domains
    listDomains,
    getDomain,
    createDomain,
    updateDomain,
    deleteDomain,
    verifyDomainDkim,
    verifyDomainReturnPath,
    verifyDomainSpf,
    rotateDomainDkim,
    // Sender Signatures
    listSenderSignatures,
    getSenderSignature,
    createSenderSignature,
    updateSenderSignature,
    deleteSenderSignature,
    resendSenderConfirmation,
    // Webhooks
    listWebhooks,
    getWebhook,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    // Suppressions
    listSuppressions,
    createSuppressions,
    deleteSuppressions,
    // Inbound Rules
    listInboundRules,
    createInboundRule,
    deleteInboundRule,
    // Data Removals
    createDataRemoval,
    getDataRemovalStatus,
  },
};

export default block;
