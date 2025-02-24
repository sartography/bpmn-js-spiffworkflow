import TestContainer from 'mocha-test-container-support';
import {
  query as domQuery,
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
  getPropertiesPanel,
  changeInput,
} from './helpers';
import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';
import messages from '../../app/spiffworkflow/messages';
import { fireEvent } from '@testing-library/preact';
import { getBpmnJS, inject } from 'bpmn-js/test/helper';
import { findCorrelationProperties, findMessageModdleElements } from '../../app/spiffworkflow/messages/MessageHelpers';


describe('Messages should work', function () {
  const xml = require('./bpmn/collaboration.bpmn').default;
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
      name: 'msgName',
      correlation_properties: {
        "c1": {
          "retrieval_expressions": "c1_expression"
        },
        "c2": {
          "retrieval_expressions": "c2_expression"
        }
      }
    });
  };

  // Assure that the list of messages avaiable from the API is empty
  const clear_messages = () => {
    const modeler = getBpmnJS();
    let eventBus = modeler.get('eventBus')
    eventBus.on(`spiff.messages.requested`, (event) => {
      eventBus.fire(`spiff.messages.returned`, { configuration: { messages: [] } });
    });
  }

  it('should show a Message Properties group when a send task is selected', async function () {
    // Select the send Task
    const sendShape = await expectSelected('ActivitySendLetter');
    expect(sendShape, "Can't find Send Task").to.exist;

    // THEN - a select Data Object section should appear in the properties panel
    const entry = findGroupEntry('messages', container);
    expect(entry, "Can't find the message group in the properties panel").to
      .exist;
    await expectSelected('my_collaboration');
  });

  it('should show a list of messages in a drop down inside the message group', async function () {

    clear_messages();

    // Select the send Task
    const sendShape = await expectSelected('ActivitySendLetter');

    // THEN - there are two options to choose from.
    const entry = findEntry('selectMessage', container);
    expect(entry, "Can't find the message select list").to.exist;

    // AND - There should be two entries in it, one for each message.
    const selector = findSelect(entry);
    expect(selector).to.exist;
    expect(selector.length).to.equal(2);
    console.log(selector);
    await expectSelected('my_collaboration');
  });

  it('should show the payload inside the message group', async function () {
    // Select the second Task
    const sendShape = await expectSelected('ActivitySendLetter');
    expect(sendShape, "Can't find Send Task").to.exist;

    // THEN - there is a payload.
    const payload = findEntry('messagePayload', container);
    expect(payload, "Can't find the message payload").to.exist;

    const textArea = findTextarea(
      'bio-properties-panel-messagePayload',
      payload
    );
    expect(textArea, "Can't find the payload textarea").to.exist;
    expect(textArea.value, "Can't find payload value").to.exist;
    expect(textArea.value).to.include("'to': { 'name': my_lover_variable }");
    await expectSelected('my_collaboration');
  });

  it('should be able to create new message from sendMessageTask if no message is found', inject(async function (canvas, modeling) {

    let rootShape = canvas.getRootElement();

    // Retrieve the current number of existing messages
    const messageElemendBeforeDelete = findMessageModdleElements(rootShape.businessObject);
    expect(messageElemendBeforeDelete.length).to.equal(2);

    // Select message element
    const sendShape = await expectSelected('ActivitySendLetter');
    expect(sendShape, "Can't find Send Task").to.exist;

    const entry = findEntry('selectMessage', getPropertiesPanel());
    expect(entry).to.exist;

    let selector = findSelect(entry);
    expect(selector.options.length).to.equal(2);

    changeInput(selector, 'love_letter_response');
    const messageElement = findMessageModdleElements(rootShape.businessObject);
    expect(messageElement.length).to.equal(2);
  }));

  it('should be able to add new message and correlation properties on add_message_event', async function () {

    clear_messages();

    const modeler = getBpmnJS();

    // Select message element
    const sendShape = await expectSelected('ActivitySendLetter');
    expect(sendShape, "Can't find Send Task").to.exist;

    const entry = findEntry('selectMessage', getPropertiesPanel());
    expect(entry).to.exist;

    // Expect to find two existing messages
    let selector = findSelect(entry);
    expect(selector.options.length).to.equal(2);

    // Fire add new message event
    modeler.get('eventBus').on('spiff.add_message.requested', (event) => {
      new_message_event(modeler.get('eventBus'))
    });
    modeler.get('eventBus').fire('spiff.add_message.requested');

    const sendShapecc = await expectSelected('ActivitySendLetter');
    expect(sendShapecc, "Can't find Send Task").to.exist;

    const updatedEntry = findEntry('selectMessage', getPropertiesPanel());
    expect(updatedEntry).to.exist;

    const updatedSelector = findSelect(updatedEntry);
    expect(updatedSelector.options.length).to.equal(3);
    expect(updatedSelector.options[2].value).to.equal('msgName');
  });



  // 🔶🔶 OLD Features

  // // it('should show the correlations inside the message group', async function () {
  // //   // Select the second Task
  // //   const sendShape = await expectSelected('ActivitySendLetter');
  // //   expect(sendShape, "Can't find Send Task").to.exist;

  // //   // Enable correlation
  // //   const checkbox = findInput('checkbox', container);
  // //   pressButton(checkbox);

  // //   // THEN - there are correlations.
  // //   const correlations = findGroupEntry('correlationProperties', container);
  // //   expect(correlations, "Can't find the message correlations").to.exist;
  // //   await expectSelected('my_collaboration');
  // // });

  // it('should not showing the correlations inside the message group if is not enabled', async function () {
  //   // Select the second Task
  //   const sendShape = await expectSelected('ActivitySendLetter');
  //   expect(sendShape, "Can't find Send Task").to.exist;

  //   // Check correlation properties
  //   const correlations = findGroupEntry('correlationProperties', container);
  //   expect(correlations, "Can't find the message correlations").not.to.exist;
  // });

  // // Old Feature
  // // it('should add a new correlation when clicked', async function () {
  // //   // Select the second Task
  // //   const sendShape = await expectSelected('ActivitySendLetter');
  // //   expect(sendShape, "Can't find Send Task").to.exist;

  // //   // Enable correlation
  // //   const checkbox = findInput('checkbox', container);
  // //   pressButton(checkbox);

  // //   const buttonClass =
  // //     'bio-properties-panel-group-header-button bio-properties-panel-add-entry';
  // //   const button = findButtonByClass(buttonClass, container);
  // //   pressButton(button);

  // // });

  // it('should add a new Correlation Key when clicked', async function () {
  //   const buttonClass =
  //     'bio-properties-panel-group-header-button bio-properties-panel-add-entry';
  //   const button = findButtonByClass(buttonClass, container);
  //   pressButton(button);
  //   // THEN - a select Data Object section should appear in the properties panel
  //   const entry = findGroupEntry('correlation_keys', container);
  //   expect(entry).to.exist;
  // });

  // it('should be able to delete an existing message', inject(function (canvas, modeling) {
  //   let rootShape = canvas.getRootElement();
  //   // Retrieve current number of existing messages
  //   const messageElemendBeforeDelete = findMessageModdleElements(rootShape.businessObject);
  //   expect(messageElemendBeforeDelete.length).to.equal(2);
  //   // Trigger delete action
  //   let deleteButton = domQuery('.bio-properties-panel-remove-entry', container);
  //   fireEvent.click(deleteButton);
  //   const messageElemendAfterDelete = findMessageModdleElements(rootShape.businessObject);
  //   expect(messageElemendAfterDelete.length).to.equal(1);
  // }));

  // it('should be able to delete an existing correlation property', inject(function (canvas, modeling) {
  //   let rootShape = canvas.getRootElement();
  //   // Retrieve current number of existing messages
  //   const correlationPropertiesBeforeDelete = findCorrelationProperties(rootShape.businessObject);
  //   expect(correlationPropertiesBeforeDelete.length).to.equal(3);
  //   // Trigger delete action
  //   const correlationPropertiesDiv = domQuery(`div[data-group-id='group-correlation_properties']`, container);
  //   let deleteButton = domQuery('.bio-properties-panel-remove-entry', correlationPropertiesDiv);
  //   fireEvent.click(deleteButton);
  //   const correlationPropertiesAfterDelete = findCorrelationProperties(rootShape.businessObject);
  //   expect(correlationPropertiesAfterDelete.length).to.equal(2);
  // }));

  // it('should allow you to see the collaborations section', async function () {
  //   // THEN - a select Data Object section should appear in the properties panel
  //   const entry = findGroupEntry('correlation_keys', container);
  //   expect(entry).to.exist;
  //   await expectSelected('my_collaboration');
  // });

});
