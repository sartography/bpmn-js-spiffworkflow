import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { is } from 'bpmn-js/lib/util/ModelUtil';
var HIGH_PRIORITY = 1500;

/**
 * This Command Interceptor functions like the BpmnUpdator in BPMN.js - It hooks into events
 * from Diagram.js and updates the underlying BPMN model accordingly.
 *
 * This handles the case where a new DataObjectReference is added to the diagram. In such case
 * do NOT just create a new DataObject - rather, check to see if at least one DataObject already
 * exists, and if so, use that one.
 */
export default class DataObjectInterceptor extends CommandInterceptor {
  constructor(eventBus, bpmnFactory, bpmnUpdater) {
    super(eventBus);

    /**
     * Prevent this from calling th CreateDataObjectBehavior in BPMN-js, as it will
     * attempt to crete a dataObject immediately.  We can't create the dataObject until
     * it is placed - as we want to reuse data objects if and when possible.     */
    this.preExecute([ 'shape.create' ], HIGH_PRIORITY, function(event) {
      event.stopPropagation();
    });

    /**
     * Don't just create a new data object, use the first existing one if it already exists
     */
    this.executed([ 'shape.create' ], HIGH_PRIORITY, function(event) {
      const context = event.context, shape = context.shape;
      if (is(shape, 'bpmn:DataObjectReference') && shape.type !== 'label') {
        console.log("Data Object Ref Exectuted");
        let process = shape.parent.businessObject;
        let existingDataObjects = findDataObjects(process);
        console.log("Existing Data Objects:", existingDataObjects);
        let dataObject;
        if (existingDataObjects.length > 0) {
          dataObject = existingDataObjects[0];
        } else {
          dataObject = bpmnFactory.create('bpmn:DataObject');
        }

        // set the reference to the DataObject
        shape.businessObject.dataObjectRef = dataObject;
      }
    });


    /**
     * Don't remove the associated DataObject, unless all references to that data object were removed.
     */
    this.execute([ 'shape.delete' ], HIGH_PRIORITY, function(event) {
      let context = event.context;
      if ([ 'bpmn:DataObjectReference' ].includes(context.shape.type)) {
      }
    });
  }
}

DataObjectInterceptor.$inject = [ 'eventBus', 'bpmnFactory', 'bpmnUpdater' ];

function findDataObjects(process) {
  let dataObjects = [];
  for (const element of process.flowElements) {
    if (element.$type === 'bpmn:DataObject') {
      dataObjects.push(element);
    }
  }
  return dataObjects;
}
