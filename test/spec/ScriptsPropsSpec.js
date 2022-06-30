import {
  bootstrapPropertiesPanel,
  expectSelected,
  findEntry,
  PROPERTIES_PANEL_CONTAINER
} from './helpers';
import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';
import inputOutput from '../../app/spiffworkflow/InputOutput';
import SpiffWorkflowPropertiesProvider from '../../app/spiffworkflow/PropertiesPanel';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';

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

  it('should allow you to add a script to a script task', async function() {
    // 1. Select the script task 'my_script_task'
    expectSelected('my_script_task');

    // 2. Assure properties panel has a pythonScript
    let entry = findEntry('pythonScript_bpmn:script', PROPERTIES_PANEL_CONTAINER);
    expect(entry).to.exist;

    // 3. Assere there is a text input called 'script'
    // 4. Adding text to that script input updates the script in the bpmn.
  });
});
