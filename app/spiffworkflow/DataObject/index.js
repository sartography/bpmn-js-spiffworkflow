import DataObjectInterceptor from './DataObjectInterceptor';
import DataObjectRules from './DataObjectRules';
import RulesModule from 'diagram-js/lib/features/rules';


export default {
  __depends__: [
    RulesModule
  ],
  __init__: [ 'DataInterceptor' ],
  DataInterceptor: [ 'type', DataObjectInterceptor ],
  DataObjectRules:[ 'type', DataObjectRules ]
};

