import RulesModule from 'diagram-js/lib/features/rules';
import CustomDataStorePropertiesProvider from './propertiesPanel/CustomDataStorePropertiesProvider';

export default {
  __depends__: [RulesModule],
  __init__: ['dataSourcePropertiesProvider'],
  dataSourcePropertiesProvider: ['type', CustomDataStorePropertiesProvider],
};
