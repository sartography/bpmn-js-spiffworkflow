import RulesModule from 'diagram-js/lib/features/rules';
import DataStorePropertiesProvider from './propertiesPanel/DataStorePropertiesProvider';

export default {
  __depends__: [
    RulesModule
  ],
  __init__: [ 'dataSourcePropertiesProvider' ],
  dataSourcePropertiesProvider: [ 'type', DataStorePropertiesProvider ]
};
