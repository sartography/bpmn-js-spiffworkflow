import {
  bootstrapPropertiesPanel,
  expectSelected,
  findEntry,
  PROPERTIES_PANEL_CONTAINER
} from './helpers';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import SpiffWorkflowPropertiesProvider from '../../app/spiffworkflow/PropertiesPanel';
import inputOutput from '../../app/spiffworkflow/InputOutput';

import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';

describe('Properties Panel Script Tasks', function() {
  let xml = require('./diagram.bpmn').default;

  beforeEach(bootstrapPropertiesPanel(xml, {
    debounceInput: false,
    additionalModules: [
      SpiffWorkflowPropertiesProvider,
      BpmnPropertiesPanelModule,
      BpmnPropertiesProviderModule,
    ],
    moddleExtensions: {
      spiffworkflow: spiffModdleExtension
    },
  }));


  it('should allow you to see all data objects', async function() {

    // 1. Select the data object reference 'my_data_ref_1'
    let my_data_ref_1 = await expectSelected('my_data_ref_1');
    expect(my_data_ref_1).to.exist;

    // 2. The props panel should include a dataObjects section.
    let entry = findEntry('dataObjects', PROPERTIES_PANEL_CONTAINER);
    expect(entry).to.exist;

    // 3. There should be two data objects in the BPMN/Moddle


    // 3. The entry List should contain a select box that contains all
    // of the data elements.



  });
});
