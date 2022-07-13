import {
  bootstrapPropertiesPanel, changeInput,
  expectSelected,
  findEntry,
  getPropertiesPanel
} from './helpers';
import {
  query as domQuery,
} from 'min-dom';

import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';
import SpiffWorkflowPropertiesProvider from '../../app/spiffworkflow/PropertiesPanel';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

describe('Business Rule Properties Panel', function() {
  let xml = require('./bpmn/diagram.bpmn').default;

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

  it('should display a text box to select the called decision id', async function() {

    expectSelected('business_rule_task');

    // THEN - a properties panel exists with a section for editing that script
    let entry = findEntry('extension_called_decision', getPropertiesPanel());
    expect(entry).to.exist;
    const textInput = domQuery('input', entry);
    expect(textInput).to.exist;
  });

  it('should update the spiffworkflow:calledDecision tag when you modify the called decision text input', async function() {

    // IF - a script tag is selected, and you change the script in the properties panel
    const businessRuleTask = await expectSelected('business_rule_task');
    let entry = findEntry('extension_called_decision', getPropertiesPanel());
    const textInput = domQuery('input', entry);
    changeInput(textInput, 'wonderful');

    // THEN - the script tag in the BPMN Business object / XML is updated as well.
    let businessObject = getBusinessObject(businessRuleTask);
    expect(businessObject.extensionElements).to.exist;
    let element = businessObject.extensionElements.values[0];
    expect(element.decisionId).to.equal('wonderful');
  });

});
