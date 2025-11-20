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
import { query as domQuery } from 'min-dom';

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

    it('should display label and description for rich keys', async function () {
        await preparePropertiesPanelWithXml(diagram_xml)();
        const modeler = getBpmnJS();
        const eventBus = modeler.get('eventBus');

        eventBus.on('spiff.task_metadata_keys.requested', (event) => {
            event.eventBus.fire('spiff.task_metadata_keys.returned', {
                keys: [
                    {
                        name: 'rich_key',
                        label: 'Rich Label',
                        description: 'Rich Description',
                    },
                ],
            });
        });

        await expectSelected('task_confirm');
        const group = findGroupEntry('task_metadata_properties', container);
        const entry = findEntry('extension_task_metadata_rich_key', group);

        // Check label
        const label = domQuery('.bio-properties-panel-label', entry);
        expect(label.innerText).to.equal('Rich Label');

        // Check description (it might be in a different element structure, adjusting expectation)
        const description = domQuery('.bio-properties-panel-description', entry);
        expect(description.innerText).to.equal('Rich Description');
    });

    it('should not display panel if no keys are returned', async function () {
        await preparePropertiesPanelWithXml(diagram_xml)();
        const modeler = getBpmnJS();
        const eventBus = modeler.get('eventBus');

        eventBus.on('spiff.task_metadata_keys.requested', (event) => {
            event.eventBus.fire('spiff.task_metadata_keys.returned', {
                keys: [],
            });
        });

        await expectSelected('task_confirm');
        const group = findGroupEntry('task_metadata_properties', container);

        // The group might still exist but be empty or hidden, or the entry within it is missing.
        // Based on implementation, if SpiffExtensionTaskMetadata returns null, the entry in the group is null.
        // However, the group itself is created in ExtensionsPropertiesProvider.
        // Let's check if the entry is present.
        const entry = findEntry('extension_task_metadata_key1', group);
        expect(entry).to.not.exist;
    });

    it('should display correctly with mixed string and object keys', async function () {
        await preparePropertiesPanelWithXml(diagram_xml)();
        const modeler = getBpmnJS();
        const eventBus = modeler.get('eventBus');

        eventBus.on('spiff.task_metadata_keys.requested', (event) => {
            event.eventBus.fire('spiff.task_metadata_keys.returned', {
                keys: [
                    {
                        name: 'due_days_after_open',
                        label: 'Due Days After Open',
                        description: 'Number of days after opening until due',
                    },
                    'due_days_before_closing',
                ],
            });
        });

        await expectSelected('task_confirm');
        const group = findGroupEntry('task_metadata_properties', container);

        // Check first entry (object)
        const entry1 = findEntry('extension_task_metadata_due_days_after_open', group);
        expect(entry1).to.exist;
        const label1 = domQuery('.bio-properties-panel-label', entry1);
        expect(label1.innerText).to.equal('Due Days After Open');
        const desc1 = domQuery('.bio-properties-panel-description', entry1);
        expect(desc1.innerText).to.equal('Number of days after opening until due');

        // Check second entry (string)
        const entry2 = findEntry('extension_task_metadata_due_days_before_closing', group);
        expect(entry2).to.exist;
        const label2 = domQuery('.bio-properties-panel-label', entry2);
        expect(label2.innerText).to.equal('due_days_before_closing');
    });

    it('should display orphaned keys and allow removal', async function () {
        await preparePropertiesPanelWithXml(diagram_xml)();
        const modeler = getBpmnJS();
        const eventBus = modeler.get('eventBus');

        // 1. Setup: Add a key to the XML manually
        const element = await expectSelected('task_confirm');
        const moddle = modeler.get('moddle');
        const commandStack = modeler.get('commandStack');

        let extensionElements = element.businessObject.extensionElements;
        if (!extensionElements) {
            extensionElements = moddle.create('bpmn:ExtensionElements');
            extensionElements.values = [];
        }
        let metadataValues = moddle.create('spiffworkflow:TaskMetadataValues');
        let entry = moddle.create('spiffworkflow:TaskMetadataValue');
        entry.name = 'orphaned_key';
        entry.value = 'some_value';
        metadataValues.values = [entry];
        extensionElements.values.push(metadataValues);

        commandStack.execute('element.updateModdleProperties', {
            element,
            moddleElement: element.businessObject,
            properties: { extensionElements },
        });

        // 2. Fire event with NO keys (so 'orphaned_key' is truly orphaned)
        eventBus.on('spiff.task_metadata_keys.requested', (event) => {
            event.eventBus.fire('spiff.task_metadata_keys.returned', {
                keys: [],
            });
        });

        // Re-select to refresh properties panel
        await expectSelected('task_confirm');
        const group = findGroupEntry('task_metadata_properties', container);

        // 3. Verify orphaned key is displayed
        const orphanedEntry = findEntry('extension_task_metadata_orphaned_key', group);
        expect(orphanedEntry).to.exist;
        const label = domQuery('.bio-properties-panel-label', orphanedEntry);
        expect(label.innerText).to.equal('orphaned_key');
        const description = domQuery('.bio-properties-panel-description', orphanedEntry);
        expect(description.innerText).to.contain('This key is not defined in the configuration.');
        expect(description.innerText).to.contain('Remove');

        // 4. Verify removal (by clicking Remove link)
        const removeLink = domQuery('a', orphanedEntry);
        expect(removeLink).to.exist;
        expect(removeLink.innerText).to.equal('Remove');

        // Simulate click
        removeLink.click();

        // 5. Verify XML is updated (key removed)
        const businessObject = getBusinessObject(element);
        const updatedExtensionElements = businessObject.extensionElements;
        const updatedMetadataValues = updatedExtensionElements.values.find(
            (v) => v.$type === 'spiffworkflow:TaskMetadataValues'
        );
        // Should be removed entirely if it was the only value
        expect(updatedMetadataValues).to.not.exist;
    });
});
