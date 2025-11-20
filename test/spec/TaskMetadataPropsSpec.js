import {
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import { getBpmnJS } from 'bpmn-js/test/helper';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import TestContainer from 'mocha-test-container-support';
import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';
import {
    bootstrapPropertiesPanel,
    changeInput,
    expectSelected,
    findGroupEntry,
    findEntry,
    findInput,
} from './helpers';
import extensions from '../../app/spiffworkflow/extensions';

describe('Properties Panel for Task Metadata', function () {
    const diagram_xml = require('./bpmn/diagram.bpmn').default;
    let container;

    beforeEach(function () {
        container = TestContainer.get(this);
    });

    function preparePropertiesPanelWithXml(xml) {
        return bootstrapPropertiesPanel(xml, {
            container,
            debounceInput: false,
            additionalModules: [
                extensions,
                BpmnPropertiesPanelModule,
                BpmnPropertiesProviderModule,
            ],
            moddleExtensions: {
                spiffworkflow: spiffModdleExtension,
            },
        });
    }

    it('should display task metadata inputs when keys are provided', async function () {
        await preparePropertiesPanelWithXml(diagram_xml)();
        const modeler = getBpmnJS();
        const eventBus = modeler.get('eventBus');

        eventBus.on('spiff.task_metadata_keys.requested', (event) => {
            event.eventBus.fire('spiff.task_metadata_keys.returned', {
                keys: ['key1', 'key2'],
            });
        });

        // Select a user task
        await expectSelected('task_confirm');

        // Check for the group
        const group = findGroupEntry('task_metadata_properties', container);
        expect(group).to.exist;

        // Check for inputs
        const entry1 = findEntry('extension_task_metadata_key1', group);
        expect(entry1).to.exist;
        const entry2 = findEntry('extension_task_metadata_key2', group);
        expect(entry2).to.exist;
    });

    it('should update task metadata when inputs are changed', async function () {
        await preparePropertiesPanelWithXml(diagram_xml)();
        const modeler = getBpmnJS();
        const eventBus = modeler.get('eventBus');

        eventBus.on('spiff.task_metadata_keys.requested', (event) => {
            event.eventBus.fire('spiff.task_metadata_keys.returned', {
                keys: ['key1'],
            });
        });

        const element = await expectSelected('task_confirm');
        const group = findGroupEntry('task_metadata_properties', container);
        const entry = findEntry('extension_task_metadata_key1', group);
        const input = findInput('text', entry);

        changeInput(input, 'value1');

        const businessObject = getBusinessObject(element);
        const extensionElements = businessObject.extensionElements;
        const metadataValues = extensionElements.values.find(
            (v) => v.$type === 'spiffworkflow:TaskMetadataValues'
        );
        expect(metadataValues).to.exist;
        expect(metadataValues.values).to.have.length(1);
        expect(metadataValues.values[0].name).to.equal('key1');
        expect(metadataValues.values[0].value).to.equal('value1');
    });
});
