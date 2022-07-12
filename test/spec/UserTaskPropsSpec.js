import {
  bootstrapPropertiesPanel, changeInput,
  expectSelected,
  findEntry, findGroupEntry, findInput
} from './helpers';
import {
  query as domQuery,
} from 'min-dom';

import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';
import SpiffWorkflowPropertiesProvider from '../../app/spiffworkflow/PropertiesPanel';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import TestContainer from 'mocha-test-container-support';

describe('Properties Panel for User Tasks', function() {
  let xml = require('./bpmn/user_form.bpmn').default;
  let container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  beforeEach(bootstrapPropertiesPanel(xml, {
    container,
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

  it('should display a panel for setting the web form properties', async function() {

    // IF - you select a user task
    const userTask = await expectSelected('my_user_task');
    expect(userTask).to.exist;

    // THEN - a property panel exists with a section for editing web forms
    let group = findGroupEntry('user_task_properties', container);
    expect(group).to.exist;
  });

  it('should allow you to edit a web form property.', async function() {

    // IF - you select a user task and change the formJsonSchemaFilename text field
    const userTask = await expectSelected('my_user_task');
    let group = findGroupEntry('user_task_properties', container);
    let entry = findEntry('extension_formJsonSchemaFilename', group);
    let input = findInput('text', entry);
    expect(input).to.exist;
    changeInput(input, 'my_filename.json');

    // THEN - the input is updated.
    let businessObject = getBusinessObject(userTask);
    expect(businessObject.extensionElements).to.exist;
    let property = businessObject.extensionElements.values[1];
    expect(property.value).to.equal('my_filename.json');
    expect(property.name).to.equal('formJsonSchemaFilename');
  });



});
