import DataStoreInterceptor from './DataStoreInterceptor';
import DataStoreRules from './DataStoreRules';
import RulesModule from 'diagram-js/lib/features/rules';
import DataStoreRenderer from './DataStoreRenderer';
import DataStorePropertiesProvider from './propertiesPanel/DataStorePropertiesProvider';


export default {
  __depends__: [
    RulesModule
  ],
  __init__: [ 'dataInterceptor', 'dataStoreRules', 'dataStoreRenderer', 'dataStorePropertiesProvider' ],
  dataInterceptor: [ 'type', DataStoreInterceptor ],
  dataStoreRules: [ 'type', DataStoreRules ],
  dataStoreRenderer: [ 'type', DataStoreRenderer ],
  dataStorePropertiesProvider: [ 'type', DataStorePropertiesProvider ]
};



