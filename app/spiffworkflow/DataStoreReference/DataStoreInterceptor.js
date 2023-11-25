import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { getDi, is } from 'bpmn-js/lib/util/ModelUtil';

const HIGH_PRIORITY = 1500;

/**
 * 
 */
export default class DataStoreInterceptor extends CommandInterceptor {

  constructor(eventBus, bpmnFactory, commandStack, bpmnUpdater) {
    super(eventBus);

    /* 
     * 
     */
    // bpmnUpdater.updateSemanticParent = (businessObject, parentBusinessObject) => {
    //   if (is(businessObject, 'bpmn:DataStoreReference')) {
    //     console.log('updateSemanticParent', businessObject);
    //   }
    // };

    /**
     * 
     */
    // this.preExecute(['shape.create'], HIGH_PRIORITY, function (event) {
    //   const { context } = event;
    //   const { shape } = context;
    //   if (is(shape, 'bpmn:DataStoreReference') && shape.type !== 'label') {
    //     // event.stopPropagation();*
    //     console.log('preExecute shape.create', shape, context);
    //   }
    // });

    /**
     * 
     */
    // this.executed(['shape.create'], HIGH_PRIORITY, function (event) {
    //   const { context } = event;
    //   const { shape } = context;
    //   if (is(shape, 'bpmn:DataStoreReference') && shape.type !== 'label') {
    //     console.log('executed shape.create', shape, context);
    //   }
    // });

    /**
     * 
     */
    // this.postExecuted(['shape.create'], HIGH_PRIORITY, function (event) {
    //   const { context } = event;
    //   const { shape } = context;
    //   if (is(shape, 'bpmn:DataStoreReference') && shape.type !== 'label') {
    //     console.log('postExecuted shape.create', shape, context);
    //   }
    // });

    /**
     * 
     */
    this.executed(['shape.delete'], HIGH_PRIORITY, function (event) {
      const { context } = event;
      const { shape } = context;
      if (is(shape, 'bpmn:DataStoreReference') && shape.type !== 'label') {
        console.log('executed shape.delete', shape, context);
      }
    });
  }
}

DataStoreInterceptor.$inject = ['eventBus', 'bpmnFactory', 'commandStack', 'bpmnUpdater'];
