import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { isMessageElement, isMessageRefUsed, setParentCorrelationKeys, synCorrleationProperties, getRoot} from './MessageHelpers';

const HIGH_PRIORITY = 90500;

export default class MessageInterceptor extends CommandInterceptor {

    constructor(eventBus, bpmnFactory, commandStack, bpmnUpdater, moddle) {
        super(eventBus);

        this.postExecuted(['shape.delete'], HIGH_PRIORITY, function (event) {
            const { context } = event;
            const { shape, rootElement } = context;
            const { businessObject } = shape;

            if (isMessageElement(shape)) {

                let oldMessageRef = (businessObject.eventDefinitions) ? businessObject.eventDefinitions[0].messageRef : businessObject.messageRef;

                let definitions = getRoot(rootElement, moddle)
                if (!definitions.get('rootElements')) {
                    definitions.set('rootElements', []);
                }
                
                if (oldMessageRef) {
                    // Remove previous message in case it's not used anymore
                    const isOldMessageUsed = isMessageRefUsed(definitions, oldMessageRef.id);
                    if (!isOldMessageUsed) {
                        const rootElements = definitions.get('rootElements');
                        const oldMessageIndex = rootElements.findIndex(
                            (element) =>
                                element.$type === 'bpmn:Message' && element.id === oldMessageRef.id,
                        );
                        if (oldMessageIndex !== -1) {
                            rootElements.splice(oldMessageIndex, 1);
                            definitions.rootElements = rootElements;
                        }
                    }

                    // Automatic deletion of previous message correlation properties
                    synCorrleationProperties(shape, definitions, moddle);
                }

                // Update Correlation key if Process has collaboration
                try {
                    setParentCorrelationKeys(definitions, bpmnFactory, shape, moddle);
                } catch (error) {
                    console.error('Error Caught while synchronizing Correlation key', error);
                }

            }
        });

    }
}

MessageInterceptor.$inject = ['eventBus', 'bpmnFactory', 'commandStack', 'bpmnUpdater', 'moddle'];
