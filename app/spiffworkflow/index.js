import IoPalette from './InputOutput/IoPalette';
import IoRules from './InputOutput/IoRules';
import IoInterceptor from './InputOutput/IoInterceptor';
import SpiffWorkflowPropertiesProvider from './PropertiesPanel/SpiffWorkflowPropertiesProvider';
import DataObjectInterceptor from './DataObject/DataObjectInterceptor';
import DataObjectRules from './DataObject/DataObjectRules';
import RulesModule from 'diagram-js/lib/features/rules';

export default {
  __depends__: [ RulesModule ],
  __init__: [
    'SpiffWorkflowPropertiesProvider',
    'DataObjectInterceptor', 'DataObjectRules',
    'IoPalette', 'IoRules', 'IoInterceptor' ],
  SpiffWorkflowPropertiesProvider: [ 'type', SpiffWorkflowPropertiesProvider ],
  DataObjectInterceptor: [ 'type', DataObjectInterceptor ],
  DataObjectRules:[ 'type', DataObjectRules ],
  IoPalette: [ 'type', IoPalette ],
  IoRules: [ 'type', IoRules ],
  IoInterceptor: [ 'type', IoInterceptor ],
};

