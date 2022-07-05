import {
  bootstrapPropertiesPanel, changeInput,
  expectSelected,
  findEntry, findGroupEntry, findSelect,
} from './helpers';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import SpiffWorkflowPropertiesProvider from '../../app/spiffworkflow/PropertiesPanel';

import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';
import TestContainer from 'mocha-test-container-support';

describe('Properties Panel Script Tasks', function() {
  let xml = require('./diagram.bpmn').default;
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

  it('should allow you to see a list of data objects', async function() {

    // IF - a data object reference is selected
    let my_data_ref_1 = await expectSelected('my_data_ref_1');
    expect(my_data_ref_1).to.exist;

    // THEN - a select Data Object section should appear in the properties panel
    let entry = findEntry('selectDataObject', container);
    expect(entry).to.exist;

    // AND - That that properties' pane selection should contain a dropdown with a value in it.
    let selector = findSelect(entry);
    expect(selector).to.exist;
    expect(selector.length).to.equal(3);
  });

  it('should allow you to edit the data objects', async function() {

    // IF - a data object reference is selected
    let my_data_ref_1 = await expectSelected('my_data_ref_1');

    // THEN - an edit Data Objects group section should appear in the properties panel
    let entry = findGroupEntry('editDataObjects', container);
    expect(entry).to.exist;

    // And it should contain three items in the group.



  });


  it('selecting a data object should change the data model.', async function() {

    // IF - a data object reference is selected
    let my_data_ref_1 = await expectSelected('my_data_ref_1');

    let entry = findEntry('selectDataObject', container);
    let selector = findSelect(entry);
    let businessObject = my_data_ref_1.businessObject;

    // AND we select a dataObjectReference (we know it has this value, because we created the bpmn file)
    changeInput(selector, 'my_third_data_object');

    // then this data reference object now references that data object.
    expect(businessObject.get('dataObjectRef').id).to.equal('my_third_data_object');
  });


});
