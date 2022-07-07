import { bootstrapPropertiesPanel, findDataObjects } from './helpers';
import dataObjectInterceptor from '../../app/spiffworkflow/DataObject';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import {
  inject,
} from 'bpmn-js/test/helper';

describe('DataObject Interceptor', function() {

  let xml = require('./empty_diagram.bpmn').default;

  beforeEach(bootstrapPropertiesPanel(xml, {
    debounceInput: false,
    additionalModules: [
      dataObjectInterceptor,
      BpmnPropertiesPanelModule,
      BpmnPropertiesProviderModule,
    ]
  }));

  it('New Data Object References should create a data object if none exist.', inject(function(canvas, modeling) {

    // IF - a new dataObjectReference is created
    let rootShape = canvas.getRootElement();
    const dataObjectRefShape1 = modeling.createShape({ type: 'bpmn:DataObjectReference' },
      { x: 220, y: 220 }, rootShape);

    // THEN - a new DataObject is also created.
    const dataObjects = findDataObjects(rootShape.businessObject);
    expect(dataObjects.length).to.equal(1);
    expect(dataObjects[0]).to.equal(dataObjectRefShape1.businessObject.dataObjectRef);

  }));

  it('New Data Object References should connect to the first available data Object if it exists', inject(function(canvas, modeling) {

    // IF - two dataObjectReferences are created
    let rootShape = canvas.getRootElement();
    const dataObjectRefShape1 = modeling.createShape({ type: 'bpmn:DataObjectReference' },
      { x: 220, y: 220 }, rootShape);
    const dataObjectRefShape2 = modeling.createShape({ type: 'bpmn:DataObjectReference' },
      { x: 320, y: 220 }, rootShape);

    // THEN - only one new DataObject is created, and both references point to it..
    const dataObjects = findDataObjects(rootShape.businessObject);
    expect(dataObjects.length).to.equal(1);
    expect(dataObjects[0]).to.equal(dataObjectRefShape1.businessObject.dataObjectRef);
    expect(dataObjects[0]).to.equal(dataObjectRefShape2.businessObject.dataObjectRef);

  }));

});
