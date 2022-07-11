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
    'spiffWorkflowPropertiesProvider',
    'dataObjectInterceptor', 'dataObjectRules',
    'ioPalette', 'ioRules', 'ioInterceptor' ],
  spiffWorkflowPropertiesProvider: [ 'type', SpiffWorkflowPropertiesProvider ],
  dataObjectInterceptor: [ 'type', DataObjectInterceptor ],
  dataObjectRules:[ 'type', DataObjectRules ],
  ioPalette: [ 'type', IoPalette ],
  ioRules: [ 'type', IoRules ],
  ioInterceptor: [ 'type', IoInterceptor ],
};

