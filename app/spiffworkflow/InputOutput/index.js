import IoPalette from './IoPalette';
import IoRules from './IoRules';
import IoInterceptor from './IoInterceptor';
import IoPropertiesProvider from './propertiesProvider/IoPropertiesProvider';

export default {
  __init__: [ 'IoPalette', 'IoRules', 'IoInterceptor' ],
  IoPalette: [ 'type', IoPalette ],
  IoRules: [ 'type', IoRules ],
  IoInterceptor: [ 'type', IoInterceptor ],
  IoPropertiesProvider: [ 'type', IoPropertiesProvider ]
};

