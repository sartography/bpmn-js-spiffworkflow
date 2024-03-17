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
import { inject } from 'bpmn-js/test/helper';
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

  it('should allow you to see the collaborations section', async function () {
    // THEN - a select Data Object section should appear in the properties panel
    const entry = findGroupEntry('correlation_keys', container);
    expect(entry).to.exist;
    await expectSelected('my_collaboration');
  });

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
    // Select the send Task
    const sendShape = await expectSelected('ActivitySendLetter');
    expect(sendShape, "Can't find Send Task").to.exist;

    // THEN - there are two options to choose from.
    const entry = findEntry('selectMessage', container);
    expect(entry, "Can't find the message select list").to.exist;

    // AND - There should be two entries in it, one for each message.
    const selector = findSelect(entry);
    expect(selector).to.exist;
    expect(selector.length).to.equal(2);
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

  // OLD Feature
  // it('should show the correlations inside the message group', async function () {
  //   // Select the second Task
  //   const sendShape = await expectSelected('ActivitySendLetter');
  //   expect(sendShape, "Can't find Send Task").to.exist;

  //   // Enable correlation
  //   const checkbox = findInput('checkbox', container);
  //   pressButton(checkbox);

  //   // THEN - there are correlations.
  //   const correlations = findGroupEntry('correlationProperties', container);
  //   expect(correlations, "Can't find the message correlations").to.exist;
  //   await expectSelected('my_collaboration');
  // });

  it('should not showing the correlations inside the message group if is not enabled', async function () {
    // Select the second Task
    const sendShape = await expectSelected('ActivitySendLetter');
    expect(sendShape, "Can't find Send Task").to.exist;

    // Check correlation properties
    const correlations = findGroupEntry('correlationProperties', container);
    expect(correlations, "Can't find the message correlations").not.to.exist;
  });

  // Old Feature
  // it('should add a new correlation when clicked', async function () {
  //   // Select the second Task
  //   const sendShape = await expectSelected('ActivitySendLetter');
  //   expect(sendShape, "Can't find Send Task").to.exist;

  //   // Enable correlation
  //   const checkbox = findInput('checkbox', container);
  //   pressButton(checkbox);

  //   const buttonClass =
  //     'bio-properties-panel-group-header-button bio-properties-panel-add-entry';
  //   const button = findButtonByClass(buttonClass, container);
  //   pressButton(button);

  // });

  it('should add a new Correlation Key when clicked', async function () {
    const buttonClass =
      'bio-properties-panel-group-header-button bio-properties-panel-add-entry';
    const button = findButtonByClass(buttonClass, container);
    pressButton(button);

    // THEN - a select Data Object section should appear in the properties panel
    const entry = findGroupEntry('correlation_keys', container);
    expect(entry).to.exist;
  });

  it('should be able to delete an existing message', inject(function (canvas, modeling) {

    let rootShape = canvas.getRootElement();

    // Retrieve current number of existing messages
    const messageElemendBeforeDelete = findMessageModdleElements(rootShape.businessObject);
    expect(messageElemendBeforeDelete.length).to.equal(2);

    // Trigger delete action
    let deleteButton = domQuery('.bio-properties-panel-remove-entry', container);
    fireEvent.click(deleteButton);

    const messageElemendAfterDelete = findMessageModdleElements(rootShape.businessObject);
    expect(messageElemendAfterDelete.length).to.equal(1);

  }));

  it('should be able to delete an existing correlation property', inject(function (canvas, modeling) {

    let rootShape = canvas.getRootElement();

    // Retrieve current number of existing messages
    const correlationPropertiesBeforeDelete = findCorrelationProperties(rootShape.businessObject);
    expect(correlationPropertiesBeforeDelete.length).to.equal(3);

    // Trigger delete action
    const correlationPropertiesDiv = domQuery(`div[data-group-id='group-correlation_properties']`, container);
    let deleteButton = domQuery('.bio-properties-panel-remove-entry', correlationPropertiesDiv);
    fireEvent.click(deleteButton);

    const correlationPropertiesAfterDelete = findCorrelationProperties(rootShape.businessObject);
    expect(correlationPropertiesAfterDelete.length).to.equal(2);

  }));

  it('should be able to create new message from sendMessageTask if no message is found', inject(async function (canvas, modeling) {

    let rootShape = canvas.getRootElement();

    // Retrieve the current number of existing messages
    const messageElemendBeforeDelete = findMessageModdleElements(rootShape.businessObject);
    expect(messageElemendBeforeDelete.length).to.equal(2);

    // Trigger delete actions
    let deleteFirstMessageBtn = domQuery('.bio-properties-panel-remove-entry', container);
    fireEvent.click(deleteFirstMessageBtn);
    let deleteSecondMessageBtn = domQuery('.bio-properties-panel-remove-entry', container);
    fireEvent.click(deleteSecondMessageBtn);

    // Retrieve the current number of existing messages after delete actions
    const messageElemendAfterDelete = findMessageModdleElements(rootShape.businessObject);
    expect(messageElemendAfterDelete.length).to.equal(0);

    // Select message element
    const sendShape = await expectSelected('ActivitySendLetter');
    expect(sendShape, "Can't find Send Task").to.exist;

    const entry = findEntry('selectMessage', getPropertiesPanel());
    expect(entry).to.exist;

    let selector = findSelect(entry);
    expect(selector.options.length).to.equal(1);
    expect(selector.options[0].value).to.equal("create_new");

    changeInput(selector, 'create_new');
    const messageElemend = findMessageModdleElements(rootShape.businessObject);
    expect(messageElemend.length).to.equal(1);

  }));

});
