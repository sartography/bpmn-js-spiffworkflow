import CustomContextPadProvider from './contextPad/CustomContextPadProvider';
import ExtensionsPropertiesProvider from './propertiesPanel/ExtensionsPropertiesProvider';

export default {
  __init__: [ 'extensionsPropertiesProvider', 'customContextPadProvider' ],
  extensionsPropertiesProvider: [ 'type', ExtensionsPropertiesProvider ],
  customContextPadProvider: [ 'type', CustomContextPadProvider ],
};

