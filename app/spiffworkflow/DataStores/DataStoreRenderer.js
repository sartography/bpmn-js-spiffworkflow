import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

import {
  attr as svgAttr
} from 'tiny-svg';

import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';
import { findDataStore } from './DataStoreHelpers';

const HIGH_PRIORITY = 1500;

/**
 * Work in progress -- render data object references in red if they are
 * not valid.
 */
export default class DataStoreRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);
    this.bpmnRenderer = bpmnRenderer;
  }

  canRender(element) {
    return isAny(element, [ 'bpmn:DataStoreReference' ]) && !element.labelTarget;
  }

  drawShape(parentNode, element) {
    const shape = this.bpmnRenderer.drawShape(parentNode, element);
    if (is(element, 'bpmn:DataStoreReference')) {
      let businessObject = getBusinessObject(element);
      let dataStore = businessObject.dataStoreRef;
      if (dataStore && dataStore.id) {
        let parentObject = businessObject.$parent;
        dataStore = findDataStore(parentObject, dataStore.id);
      }
      if (!dataStore) {
        svgAttr(shape, 'stroke', 'red');
      }
      return shape;
    }
  }
}

DataStoreRenderer.$inject = [ 'eventBus', 'bpmnRenderer' ];
