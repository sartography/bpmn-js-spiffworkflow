import MessageInterceptor from './MessageInterceptor';
import MessagesPropertiesProvider from './propertiesPanel/MessagesPropertiesProvider';

export default {
  __init__: ['messagesPropertiesProvider', 'messageInterceptor'],
  messagesPropertiesProvider: ['type', MessagesPropertiesProvider],
  messageInterceptor: [ 'type', MessageInterceptor ],

};
