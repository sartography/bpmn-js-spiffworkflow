import TestContainer from 'mocha-test-container-support';
import { bootstrapPropertiesPanel, findEntry } from './helpers';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';
import messages from '../../app/spiffworkflow/messages';


describe('Messages should work', function() {
  let xml = require('./bpmn/collaboration.bpmn').default;
  let container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  beforeEach(bootstrapPropertiesPanel(xml, {
    container,
    debounceInput: false,
    additionalModules: [
      messages,
      BpmnPropertiesPanelModule,
      BpmnPropertiesProviderModule,
    ],
    moddleExtensions: {
      spiffworkflow: spiffModdleExtension
    },
  }));

  it('should allow you to see the collaborations section', async function() {

    // THEN - a select Data Object section should appear in the properties panel
    let entry = findEntry('edit_message_correlations', container);
    expect(entry).to.exist;
  });

});
