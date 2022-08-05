import IoPalette from './InputOutput/IoPalette';
import IoRules from './InputOutput/IoRules';
import IoInterceptor from './InputOutput/IoInterceptor';
import DataObjectInterceptor from './DataObject/DataObjectInterceptor';
import DataObjectRules from './DataObject/DataObjectRules';
import RulesModule from 'diagram-js/lib/features/rules';
import DataObjectRenderer from './DataObject/DataObjectRenderer';
import DataObjectPropertiesProvider from './DataObject/propertiesPanel/DataObjectPropertiesProvider';
import ExtensionsPropertiesProvider from './extensions/propertiesPanel/ExtensionsPropertiesProvider';
import MessagesPropertiesProvider from './messages/propertiesPanel/MessagesPropertiesProvider';

export default {
  __depends__: [ RulesModule ],
  __init__: [
    'dataObjectInterceptor', 'dataObjectRules', 'dataObjectPropertiesProvider',
    'extensionsPropertiesProvider', 'messagesPropertiesProvider',
    'ioPalette', 'ioRules', 'ioInterceptor', 'dataObjectRenderer' ],
  dataObjectInterceptor: [ 'type', DataObjectInterceptor ],
  dataObjectRules:[ 'type', DataObjectRules ],
  dataObjectRenderer: [ 'type', DataObjectRenderer ],
  dataObjectPropertiesProvider: [ 'type', DataObjectPropertiesProvider ],
  extensionsPropertiesProvider: [ 'type', ExtensionsPropertiesProvider ],
  messagesPropertiesProvider: [ 'type', MessagesPropertiesProvider ],
  ioPalette: [ 'type', IoPalette ],
  ioRules: [ 'type', IoRules ],
  ioInterceptor: [ 'type', IoInterceptor ],
};
