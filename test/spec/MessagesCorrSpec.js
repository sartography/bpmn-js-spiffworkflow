import TestContainer from 'mocha-test-container-support';
import {
  query as domQuery,
  queryAll as domQueryAll,
} from 'min-dom';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import {
  bootstrapPropertiesPanel,
  expectSelected,
  findEntry,
  findGroupEntry,
  findSelect,
  findTextarea,
  findInput,
  pressButton,
  findButtonByClass,
  getPropertiesPanel,
  changeInput,
  findDivByClass
} from './helpers';
import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';
import messages from '../../app/spiffworkflow/messages';
import { fireEvent } from '@testing-library/preact';
import { getBpmnJS, inject } from 'bpmn-js/test/helper';
import { findCorrelationProperties, findMessageModdleElements } from '../../app/spiffworkflow/messages/MessageHelpers';
import {spiffExtensionOptions} from "../../app/spiffworkflow/extensions/propertiesPanel/SpiffExtensionSelect";

describe('Multiple messages should work', function () {
  const xml = require('./bpmn/two_messages.bpmn').default;
  let container;

  beforeEach(function () {
    container = TestContainer.get(this);
  });

  beforeEach(
    bootstrapPropertiesPanel(xml, {
      container,
      debounceInput: false,
      additionalModules: [
        messages,
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
      ],
      moddleExtensions: {
        spiffworkflow: spiffModdleExtension,
      },
    })
  );


  const new_message_event = (eventBus) => {
    eventBus.fire('spiff.add_message.returned', {
      elementId: "ActivityA",
      name: "messageA",
      correlation_properties:
        { "new_name": { retrieval_expression: "new_exp" }}
    });
  };


  it('and it should be possible to change a correlation property name', async function () {
    const modeler = getBpmnJS();

    const sendShape = await expectSelected('ActivityA');
    expect(sendShape, "Can't find Send Task").to.exist;

    const oldName = "old_name"
    const newName = "new_name"

    const labels = domQueryAll(`.bio-properties-panel-label`, container);
    const oldNameFound = Array.from(labels).some(label => label.textContent.includes(oldName));
    expect(oldNameFound).to.be.true;

    //Update message
    new_message_event(modeler.get('eventBus'))
    const sendShape2 = await expectSelected('ActivityA');

    // The old name should no longer be there, but the new name should exist.
    const labels2 = domQueryAll(`.bio-properties-panel-label`, container);
    const oldNameFound2 = Array.from(labels2).some(label => label.textContent.includes(oldName));
    expect(oldNameFound2).to.be.false;
    const newNameFound2 = Array.from(labels2).some(label => label.textContent.includes(newName));
    expect(newNameFound2).to.be.true;


  });

});
