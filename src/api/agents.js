import { agents } from './client';

export const createConversation = input => agents.createConversation(input);

export const getConversation = conversationOrId => agents.getConversation(conversationOrId);

export const subscribeToConversation = (conversationOrId, callback) =>
  agents.subscribeToConversation(conversationOrId, callback);

export const addMessage = (conversationOrId, message) =>
  agents.addMessage(conversationOrId, message);
