import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { getDi, is } from 'bpmn-js/lib/util/ModelUtil';
import { remove as collectionRemove } from 'diagram-js/lib/util/Collections';
import {
  findDataStores,
  findDataStoreReferences,
  idToHumanReadableName,
} from './DataStoreHelpers';

const HIGH_PRIORITY = 1500;

/**
 * This Command Interceptor functions like the BpmnUpdator in BPMN.js - It hooks into events
 * from Diagram.js and updates the underlying BPMN model accordingly.
 *
 * This handles some special cases we want to handle for DataStores and DataStoreReferences,
 * for instance:
 * 1) TODO: add the special cases
 */
export default class DataStoreInterceptor extends CommandInterceptor {

  constructor(eventBus, bpmnFactory, commandStack, bpmnUpdater) {
    super(eventBus);

    /* The default behavior is to move the data store into whatever object the reference is being created in.
     * If a data store already has a parent, don't change it.
     */
    bpmnUpdater.updateSemanticParent = (businessObject, parentBusinessObject) => {
      // Special case for participant - which is a valid place to drop a data store, but it needs to be added
      // to the particpant's Process (which isn't directly accessible in BPMN.io
      let realParent = parentBusinessObject;
      if (is(realParent, 'bpmn:Participant')) {
        realParent = realParent.processRef;
      }

      if (is(businessObject, 'bpmn:DataStoreReference')) {
        // For data store references, always update the flowElements when a parent is provided
        // The parent could be null if it's being deleted, and I could probably handle that here instead of
        // when the shape is deleted, but not interested in refactoring at the moment.
        if (realParent != null) {
          const flowElements = realParent.get('flowElements');
          const existingElement = flowElements.find(i => i.id === 1);
          if (!existingElement) {
            flowElements.push(businessObject);
          }
        }
      } else if (is(businessObject, 'bpmn:DataStore')) {
        // For data stores, only update the flowElements for new data stores, and set the parent so it doesn't get moved.
        if (typeof (businessObject.$parent) === 'undefined') {
          const flowElements = realParent.get('flowElements');
          flowElements.push(businessObject);
          businessObject.$parent = realParent;
        }
      } else {
        bpmnUpdater.__proto__.updateSemanticParent.call(bpmnUpdater, businessObject, parentBusinessObject);
      }
    };

    /**
     * For DataStoreReferences only ...
     * Prevent this from calling the CreateDataStoreBehavior in BPMN-js, as it will
     * attempt to crete a dataStore immediately.  We can't create the dataStore until
     * we know where it is placed - as we want to reuse data stores of the parent when
     * possible */
    this.preExecute(['shape.create'], HIGH_PRIORITY, function (event) {
      const { context } = event;
      const { shape } = context;
      if (is(shape, 'bpmn:DataStoreReference') && shape.type !== 'label') {
        event.stopPropagation();
      }
    });

    /**
     * Don't just create a new data store, use the first existing one if it already exists
     */
    this.executed(['shape.create'], HIGH_PRIORITY, function (event) {
      const { context } = event;
      const { shape } = context;
      if (is(shape, 'bpmn:DataStoreReference') && shape.type !== 'label') {
        const process = shape.parent.businessObject;
        const existingDataStores = findDataStores(process);
        let dataStore;
        if (existingDataStores.length > 0) {
          dataStore = existingDataStores[0];
        } else {
          dataStore = bpmnFactory.create('bpmn:DataStore');
        }
        // set the reference to the DataStore
        shape.businessObject.dataStoreRef = dataStore;
        shape.businessObject.$parent = process;
      }
    });

    /**
     * In order for the label to display correctly, we need to update it in POST step.
     */
    this.postExecuted(['shape.create'], HIGH_PRIORITY, function (event) {
      const { context } = event;
      const { shape } = context;
      // set the reference to the DataStore
      // Update the name of the reference to match the data store's id.
      if (is(shape, 'bpmn:DataStoreReference') && shape.type !== 'label') {
        commandStack.execute('element.updateProperties', {
          element: shape,
          moddleElement: shape.businessObject,
          properties: {
            name: idToHumanReadableName(shape.businessObject.dataStoreRef.id),
          },
        });
      }
    });

    /**
     * Don't remove the associated DataStore, unless all references to that data store
     * Difficult to do given placement of this logic in the BPMN Updater, so we have
     * to manually handle the removal.
     */
    this.executed(['shape.delete'], HIGH_PRIORITY, function (event) {
      const { context } = event;
      const { shape } = context;
      if (is(shape, 'bpmn:DataStoreReference') && shape.type !== 'label') {
        const dataStore = shape.businessObject.dataStoreRef;
        let parent = shape.businessObject.$parent;
        if (parent.processRef) {
          // Our immediate parent may be a pool, so we need to get the process
          parent = parent.processRef;
        }
        const flowElements = parent.get('flowElements');
        collectionRemove(flowElements, shape.businessObject);
        const references = findDataStoreReferences(flowElements, dataStore.id);
        if (references.length === 0) {
          const dataFlowElements = dataStore.$parent.get('flowElements');
          collectionRemove(dataFlowElements, dataStore);
        }
      }
    });
  }
}

DataStoreInterceptor.$inject = ['eventBus', 'bpmnFactory', 'commandStack', 'bpmnUpdater'];
