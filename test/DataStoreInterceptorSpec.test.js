import { bootstrapPropertiesPanel, expectSelected } from './helpers';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import dataStoreInterceptor from '../../app/spiffworkflow/DataStoreReference';

describe('DataStore Interceptor', () => {

    let xml = require('./bpmn/data_store.bpmn').default;
    let modeler;

    beforeEach(() => {
        // Initialize your properties panel and BPMN modeler here
        // You'll need to adapt bootstrapPropertiesPanel to return the modeler instance
        modeler = bootstrapPropertiesPanel(xml, {
            debounceInput: false,
            additionalModules: [
                dataStoreInterceptor,
                BpmnPropertiesPanelModule,
                BpmnPropertiesProviderModule,
            ]
        });
    });

    it('should delete dataStore in case dataStoreRef is deleted - DataStoreReference element', async () => {
        // Replace inject function with direct async function

        // Select a DataStoreReference element
        const shapeElement = await expectSelected('DataStoreReference_0eqeh4p');
        expect(shapeElement).toBeTruthy(); // Jest assertion

        let definitions = modeler.getDefinitions();
        let dataStoreExists = definitions.get('rootElements').some(element =>
            element.$type === 'bpmn:DataStore' && element.id === 'countries'
        );
        expect(dataStoreExists).toBe(true); // Jest assertion

        // Remove dataStoreReference
        modeler.get('modeling').removeShape(shapeElement);
        const nwshapeElement = await expectSelected('DataStoreReference_0eqeh4p');
        expect(nwshapeElement).toBeFalsy(); // Jest assertion

        // Check that DataStore countries is removed from the root of the process
        definitions = modeler.getDefinitions();
        dataStoreExists = definitions.get('rootElements').some(element =>
            element.$type === 'bpmn:DataStore' && element.id === 'countries'
        );
        expect(dataStoreExists).toBe(false); // Jest assertion
    });

    // Additional tests...
});
