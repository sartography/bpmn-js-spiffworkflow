import CallActivityInterceptor from './CallActivityInterceptor';
import CallActivityPropertiesProvider from './propertiesPanel/CallActivityPropertiesProvider';

export default {
  __init__: ['callActivityPropertiesProvider'],
  callActivityPropertiesProvider: ['type', CallActivityPropertiesProvider],
  callActivityInterceptor: [ 'type', CallActivityInterceptor ],
};
