import IoPalette from './IoPalette';
import IoRules from './IoRules';
import IoInterceptor from './IoInterceptor';
import IoPropertiesProvider from './propertiesProvider/IoPropertiesProvider';
import DataInputOutputPropertiesProvider from 'propertiesProvider/DataInputOutputPropertiesProvider';

export default {
  __init__: ['IoPalette', 'IoRules', 'IoInterceptor', 'IoPropertiesProvider', 'DataInputOutputPropertiesProvider'],
  IoPalette: ['type', IoPalette],
  IoRules: ['type', IoRules],
  IoInterceptor: ['type', IoInterceptor],
  IoPropertiesProvider: ['type', IoPropertiesProvider],
  DataInputOutputPropertiesProvider: ['type', DataInputOutputPropertiesProvider],
};
