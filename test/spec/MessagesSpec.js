import TestContainer from 'mocha-test-container-support';
import { getBpmnJS } from 'bpmn-js/test/helper';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import {
  bootstrapPropertiesPanel,
  expectSelected,
  findEntry,
  findGroupEntry,
  // findInput,
  findSelect,
  findTextarea,
  // findButtonByClass,
  // pressButton,
  // findDivByClass,
} from './helpers';
import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';
import messages from '../../app/spiffworkflow/messages';

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

  const messageResponse = (event) => {
    event.eventBus.fire('spiff.messages.returned', {
      messages: [
        { id: 'table_seated' },
        { id: 'order_ready' },
        { id: 'end_of_day_receipts' },
      ],
      correlation_keys: [
        {
          id: 'order',
          correlation_properties: ['table_number', 'franchise_id'],
        },
        {
          id: 'franchise',
          correlation_properties: ['franchise_id'],
        },
      ],
      correlation_properties: [
        {
          id: 'table_number',
          retrieval_expressions: [
            { message_ref: 'table_seated', formal_expression: 'table_number' },
            { message_ref: 'order_ready', formal_expression: 'table_number' },
          ],
        },
        {
          id: 'franchise_id',
          retrieval_expressions: [
            { message_ref: 'table_seated', formal_expression: 'franchise_id' },
            { message_ref: 'order_ready', formal_expression: 'franchise_id' },
            {
              message_ref: 'franchise_report',
              formal_expression: "franchise['id']",
            },
          ],
        },
      ],
    });
  };

  it('should show a list of messages in a drop down inside the message group', async function () {
    // Select the send Task
    const modeler = getBpmnJS();
    modeler.get('eventBus').once('spiff.messages.requested', messageResponse);

    const sendShape = await expectSelected('ActivitySendLetter');
    expect(sendShape, "Can't find Send Task").to.exist;

    // THEN - there are two options to choose from.
    const entry = findEntry('selectMessage', container);
    expect(entry, "Can't find the message select list").to.exist;

    // AND - There should be two entries in it, one for each message.
    const selector = findSelect(entry);
    expect(selector).to.exist;
    expect(selector.length).to.equal(3);
    expect(selector[0].value).to.equal('table_seated');
    expect(selector[1].value).to.equal('order_ready');
    expect(selector[2].value).to.equal('end_of_day_receipts');
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

  it('should allow you to see the collaborations section', async function () {
    // THEN - a select Data Object section should appear in the properties panel
    const entry = findGroupEntry('correlation_keys', container);
    expect(entry).to.exist;
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

  it('should show the correlations inside the message group', async function () {
    // Select the second Task
    const sendShape = await expectSelected('ActivitySendLetter');
    expect(sendShape, "Can't find Send Task").to.exist;

    // THEN - there are correlations.
    const correlations = findGroupEntry('correlationProperties', container);
    expect(correlations, "Can't find the message correlations").to.exist;
    await expectSelected('my_collaboration');
  });

  // it('should add a new correlation when clicked', async function () {
  //   // Select the second Task
  //   const sendShape = await expectSelected('ActivitySendLetter');
  //   expect(sendShape, "Can't find Send Task").to.exist;
  //
  //   const buttonClass =
  //     'bio-properties-panel-group-header-button bio-properties-panel-add-entry';
  //   const button = findButtonByClass(buttonClass, container);
  //   pressButton(button);
  //
  // });
  //
  // it('should add a new Correlation Key when clicked', async function () {
  //   const divClass = 'bio-properties-panel-list';
  //   const divs = findDivByClass(divClass, container);
  //
  //   const buttonClass =
  //     'bio-properties-panel-group-header-button bio-properties-panel-add-entry';
  //   const button = findButtonByClass(buttonClass, container);
  //   pressButton(button);
  //
  //   // THEN - a select Data Object section should appear in the properties panel
  //   const entry = findGroupEntry('correlation_keys', container);
  //   expect(entry).to.exist;
  //
  //   const divs2 = findDivByClass(divClass, container);
  // });
});
