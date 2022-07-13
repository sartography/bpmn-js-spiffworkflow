import DataObjectInterceptor from './DataObjectInterceptor';
import DataObjectRules from './DataObjectRules';
import RulesModule from 'diagram-js/lib/features/rules';
import DataObjectRenderer from './DataObjectRenderer';


export default {
  __depends__: [
    RulesModule
  ],
  __init__: [ 'dataInterceptor', 'dataObjectRules', 'dataObjectRenderer' ],
  dataInterceptor: [ 'type', DataObjectInterceptor ],
  dataObjectRules: [ 'type', DataObjectRules ],
  dataObjectRenderer: [ 'type', DataObjectRenderer ]
};

