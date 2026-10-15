import TestContainer from 'mocha-test-container-support';
import { act, fireEvent } from '@testing-library/preact';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import { getBpmnJS } from 'bpmn-js/test/helper';
import {
  bootstrapPropertiesPanel,
  expectSelected,
  findEntry,
  findSelect,
  getPropertiesPanel,
} from './helpers';
import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';
import messages from '../../app/spiffworkflow/messages';

describe('Message catalog lifecycle', function () {
  const xml = require('./bpmn/message_receive_main_key.bpmn').default;
  const boundaryXml =
    require('./bpmn/message_boundary_no_collaboration.bpmn').default;
  const receiveId = 'Activity_0qpzdpu';

  const bootstrap = (source) =>
    bootstrapPropertiesPanel(source, {
      debounceInput: false,
      additionalModules: [
        messages,
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
      ],
      moddleExtensions: { spiffworkflow: spiffModdleExtension },
    });

  beforeEach(function () {
    TestContainer.get(this);
  });
  beforeEach(bootstrap(xml));

  const catalog = (eventBus) => {
    let current;
    eventBus.once('spiff.messages.got', (event) => {
      current = event.messages;
    });
    eventBus.fire('spiff.messages.get');
    return current;
  };

  const selectReceive = async () => {
    const modeler = getBpmnJS();
    const task = modeler.get('elementRegistry').get(receiveId);
    const canvas = modeler.get('canvas');
    await act(() => canvas.setRootElement(canvas.findRoot(task)));
    return expectSelected(receiveId);
  };

  it('clears a receive-task message and supports undo and redo', async function () {
    const modeler = getBpmnJS();
    const task = await selectReceive();
    const originalMessage = task.businessObject.messageRef;
    const commandStack = modeler.get('commandStack');

    await act(() =>
      fireEvent.input(
        findSelect(findEntry('selectMessage', getPropertiesPanel())),
        { target: { value: '' } }
      )
    );
    expect(task.businessObject.messageRef).not.to.exist;
    expect(modeler.getDefinitions().rootElements).to.include(originalMessage);

    await act(() => commandStack.undo());
    expect(task.businessObject.messageRef).to.equal(originalMessage);
    await act(() => commandStack.redo());
    expect(task.businessObject.messageRef).not.to.exist;

    const { xml: saved } = await modeler.saveXML({ format: true });
    expect(saved).not.to.match(/<bpmn:receiveTask[^>]*messageRef=/);
    expect(saved).not.to.include('id=""');
  });

  it('clears a message event without losing its other extensions', async function () {
    await bootstrap(boundaryXml).call(this);
    const modeler = getBpmnJS();
    const boundary = await expectSelected('Event_0zmku0c');
    const definition = boundary.businessObject.eventDefinitions[0];
    const originalMessage = definition.messageRef;
    const originalExtensions = definition.extensionElements;

    await act(() =>
      fireEvent.input(
        findSelect(findEntry('selectMessage', getPropertiesPanel())),
        { target: { value: '' } }
      )
    );
    expect(definition.messageRef).not.to.exist;
    expect(definition.extensionElements).to.equal(originalExtensions);
    expect(modeler.getDefinitions().rootElements).to.include(originalMessage);
    await act(() => modeler.get('commandStack').undo());
    expect(definition.messageRef).to.equal(originalMessage);
  });

  it('preserves an unused message, its schema, and correlations after deleting its task', async function () {
    const modeler = getBpmnJS();
    const task = await selectReceive();
    const originalMessage = task.businessObject.messageRef;
    originalMessage.jsonSchemaId = 'callback-schema.json';
    const roots = modeler.getDefinitions().rootElements;
    const originalProperty = roots.find((element) => element.id === 'uid');

    await act(() => modeler.get('modeling').removeShape(task));
    expect(roots).to.include(originalMessage);
    expect(roots).to.include(originalProperty);
    expect(catalog(modeler.get('eventBus'))).to.deep.include({
      identifier: 'B',
      schema_file: 'callback-schema.json',
      correlation_properties: [
        { identifier: 'uid', retrieval_expression: 'uid' },
      ],
    });

    const { xml: saved } = await modeler.saveXML({ format: true });
    await modeler.importXML(saved);
    expect(
      catalog(modeler.get('eventBus')).find(
        (message) => message.identifier === 'B'
      ).schema_file
    ).to.equal('callback-schema.json');
  });

  it('updates an Arena-style message in place without dropping its schema or key', async function () {
    const modeler = getBpmnJS();
    const task = await selectReceive();
    const originalMessage = task.businessObject.messageRef;
    originalMessage.jsonSchemaId = 'callback-schema.json';
    originalMessage.name = 'Shared callback';
    const key = modeler
      .getDefinitions()
      .rootElements.find((element) => element.$type === 'bpmn:Collaboration')
      .correlationKeys[0];

    await act(() =>
      modeler.get('eventBus').fire('spiff.add_message.returned', {
        elementId: receiveId,
        name: 'Shared callback',
        correlation_properties: {
          uid: { retrieval_expression: 'callback["id"]' },
        },
      })
    );

    expect(task.businessObject.messageRef).to.equal(originalMessage);
    expect(originalMessage.id).to.equal('B');
    expect(originalMessage.jsonSchemaId).to.equal('callback-schema.json');
    const property = modeler
      .getDefinitions()
      .rootElements.find((element) => element.id === 'uid');
    expect(
      property.correlationPropertyRetrievalExpression[0].messagePath.body
    ).to.equal('callback["id"]');
    expect(key.id).to.equal('CorrelationKey_0sbzdpi');
    expect(key.correlationPropertyRef).to.include(property);

    const eventBus = modeler.get('eventBus');
    await act(() =>
      eventBus.fire('spiff.messages.save', {
        elementId: receiveId,
        messages: catalog(eventBus),
      })
    );
    expect(property.correlationPropertyRetrievalExpression).to.have.length(1);
    expect(
      property.correlationPropertyRetrievalExpression[0].messageRef
    ).to.equal(originalMessage);
  });

  it('removes deleted message bindings and allows its identifiers to be reused', async function () {
    const modeler = getBpmnJS();
    const task = await selectReceive();
    const eventBus = modeler.get('eventBus');
    await act(() =>
      eventBus.fire('spiff.messages.save', {
        elementId: receiveId,
        messages: catalog(eventBus).filter(
          (message) => message.identifier !== 'B'
        ),
      })
    );

    expect(task.businessObject.messageRef).not.to.exist;
    expect(
      task.businessObject.extensionElements.values.filter(
        (extension) =>
          extension.$type === 'spiffworkflow:ProcessVariableCorrelation'
      )
    ).to.be.empty;
    const roots = modeler.getDefinitions().rootElements;
    expect(roots.some((element) => element.id === 'uid')).to.equal(false);
    const key = roots.find((element) => element.$type === 'bpmn:Collaboration')
      .correlationKeys[0];
    expect(key.correlationPropertyRef).to.be.empty;

    await act(() =>
      eventBus.fire('spiff.messages.save', {
        elementId: receiveId,
        messages: [
          ...catalog(eventBus),
          {
            identifier: 'B',
            schema_file: 'replacement-schema.json',
            correlation_properties: [
              { identifier: 'uid', retrieval_expression: 'uid' },
            ],
          },
        ],
      })
    );
    await act(() =>
      eventBus.fire('spiff.add_message.returned', {
        elementId: receiveId,
        name: 'B',
        correlation_properties: { uid: { retrieval_expression: 'uid' } },
      })
    );
    expect(task.businessObject.messageRef.id).to.equal('B');
    expect(task.businessObject.messageRef.jsonSchemaId).to.equal(
      'replacement-schema.json'
    );
    const { xml: saved } = await modeler.saveXML({ format: true });
    const imported = await modeler.importXML(saved);
    expect(
      imported.warnings.filter((warning) =>
        /unresolved reference/.test(warning.message)
      )
    ).to.be.empty;
  });
});
