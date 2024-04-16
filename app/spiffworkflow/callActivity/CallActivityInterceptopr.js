import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { getDi, is } from 'bpmn-js/lib/util/ModelUtil';
import { remove as collectionRemove } from 'diagram-js/lib/util/Collections';

const HIGH_PRIORITY = 1500;

export default class CallActivityInterceptor extends CommandInterceptor {

    constructor(eventBus, bpmnFactory, commandStack, bpmnUpdater, modeling, elementRegistry, overlays) {
        super(eventBus);

        bpmnUpdater.updateSemanticParent = (businessObject, parentBusinessObject) => {
            if (is(businessObject, 'bpmn:CallActivity')) {
                console.log('updateSemanticParent', businessObject, parentBusinessObject, eventBus, bpmnFactory, commandStack, bpmnUpdater, modeling, overlays);
                // modeling.updateProperties(businessObject, {
                //     style: {
                //         stroke: 'blue',
                //         strokeWidth: 2
                //     }
                // });
                overlays.add(
                    businessObject.id,
                    {
                        // position: 'bottom-right',
                        // // label: `${element.completeScope}`,
                        // style: {
                        //     font: { color: 'white', size: 16 },
                        //     fill: { color: 'grey', opacity: 50 },
                        //     // stroke: { color: 'grey', width: 2 },
                        //     stroke: 'blue',
                        // },
                        // html: '<h1>dd</h1>'
                        html: '<div>I am an overlay!</div>',
                        position: {
                          top: 0,
                          right: 0
                        },
                        show: {
                          minZoom: 0.8, // overlay will not be visible at zoom <0.8
                          maxZoom: 1.2 // overlay will not be visible at zoom >1.2
                        },
                        scale: {
                          min: 0.8, // overlay will not scale below 0.8
                          max: 1.2 // overlay will not scale above 1.2
                        }

                    },
                );


            }
        };

        this.preExecute(['shape.create'], HIGH_PRIORITY, function (event) {
            const { context } = event;
            const { shape } = context;
            if (is(shape, 'bpmn:CallActivity')) {
                console.log('preExecute shape.create');
                event.stopPropagation();
            }
        });

        /**
         * Don't just create a new data object, use the first existing one if it already exists
         */
        this.executed(['shape.create'], HIGH_PRIORITY, function (event) {
            const { context } = event;
            const { shape } = context;
            if (is(shape, 'bpmn:CallActivity')) {
                console.log('executed shape.create');
            }
        });

        this.postExecuted(['shape.create'], HIGH_PRIORITY, function (event) {
            const { context } = event;
            const { shape } = context;
            if (is(shape, 'bpmn:CallActivity')) {
                console.log('postExecuted shape.create');
            }
        });

        this.executed(['shape.delete'], HIGH_PRIORITY, function (event) {
            const { context } = event;
            const { shape } = context;
            if (is(shape, 'bpmn:CallActivity')) {
                console.log('executed shape.delete');
            }
        });

    }
}

CallActivityInterceptor.$inject = ['eventBus', 'bpmnFactory', 'commandStack', 'bpmnUpdater', 'modeling', 'elementRegistry', 'overlays'];
