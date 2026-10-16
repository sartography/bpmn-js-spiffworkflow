import { act, fireEvent } from '@testing-library/preact';
import { getBpmnJS } from 'bpmn-js/test/helper';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import {
  bootstrapPropertiesPanel,
  expectSelected,
  getPropertiesPanel,
} from './helpers';
import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';
import messages from '../../app/spiffworkflow/messages';

function diagram(type, extensions = '', properties = true) {
  const receiver =
    type === 'receiveTask'
      ? `<bpmn:receiveTask id="Receiver" messageRef="Reply">${extensions}</bpmn:receiveTask>`
      : `<bpmn:${type} id="Receiver" ${
          type === 'boundaryEvent' ? 'attachedToRef="Activity"' : ''
        }>
        <bpmn:messageEventDefinition id="MessageDefinition" messageRef="Reply">${extensions}</bpmn:messageEventDefinition>
      </bpmn:${type}>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
  <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
    xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
    xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
    xmlns:spiffworkflow="http://spiffworkflow.org/bpmn/schema/1.0/core"
    id="Definitions" targetNamespace="http://bpmn.io/schema/bpmn">
    <bpmn:message id="Reply" name="Reply" />
    ${
      properties
        ? ['order_id', 'customer_id']
            .map(
              (id) => `
    <bpmn:correlationProperty id="${id}" name="${id}">
      <bpmn:correlationPropertyRetrievalExpression messageRef="Reply">
        <bpmn:formalExpression>payload["${id}"]</bpmn:formalExpression>
      </bpmn:correlationPropertyRetrievalExpression>
    </bpmn:correlationProperty>`
            )
            .join('')
        : ''
    }
    <bpmn:process id="Process" isExecutable="true">
      <bpmn:task id="Activity" />
      ${receiver}
    </bpmn:process>
    <bpmndi:BPMNDiagram id="Diagram">
      <bpmndi:BPMNPlane id="Plane" bpmnElement="Process">
        <bpmndi:BPMNShape id="Activity_di" bpmnElement="Activity">
          <dc:Bounds x="100" y="100" width="100" height="80" />
        </bpmndi:BPMNShape>
        <bpmndi:BPMNShape id="Receiver_di" bpmnElement="Receiver">
          <dc:Bounds x="300" y="100" width="100" height="80" />
        </bpmndi:BPMNShape>
      </bpmndi:BPMNPlane>
    </bpmndi:BPMNDiagram>
  </bpmn:definitions>`;
}

const options = {
  debounceInput: false,
  additionalModules: [
    messages,
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
  ],
  moddleExtensions: { spiffworkflow: spiffModdleExtension },
};

async function toggle() {
  const checkbox =
    getPropertiesPanel().querySelector(
      'input[type="checkbox"][name="enable.correlation"]'
    ) || getPropertiesPanel().querySelector('input[type="checkbox"]');
  expect(checkbox, 'condition matching checkbox').to.exist;
  await act(() => fireEvent.click(checkbox));
}

function owner(modeler, type) {
  const bo = modeler.get('elementRegistry').get('Receiver').businessObject;
  return type === 'receiveTask' ? bo : bo.eventDefinitions[0];
}

function expressions(modeler, type) {
  return (owner(modeler, type).get('extensionElements')?.get('values') || [])
    .filter((entry) =>
      entry.$instanceOf('spiffworkflow:ProcessVariableCorrelation')
    )
    .map((entry) => [entry.propertyId, entry.expression]);
}

for (const type of [
  'receiveTask',
  'startEvent',
  'intermediateCatchEvent',
  'boundaryEvent',
]) {
  describe(`Matching condition defaults: ${type}`, function () {
    beforeEach(bootstrapPropertiesPanel(diagram(type), options));

    it('does not change existing diagrams on selection; persists opt-in defaults with undo/redo', async function () {
      const modeler = getBpmnJS();
      const { xml: before } = await modeler.saveXML();
      await expectSelected('Receiver');
      expect((await modeler.saveXML()).xml).to.equal(before);
      expect(expressions(modeler, type)).to.deep.equal([]);

      await toggle();
      expect(expressions(modeler, type)).to.deep.equal([
        ['order_id', 'order_id'],
        ['customer_id', 'customer_id'],
      ]);
      const { xml: enabled } = await modeler.saveXML();
      expect(enabled).to.include('spiffworkflow:isMatchingCorrelation="true"');

      await act(() => modeler.get('commandStack').undo());
      expect((await modeler.saveXML()).xml).to.equal(before);
      await act(() => modeler.get('commandStack').redo());
      expect((await modeler.saveXML()).xml).to.equal(enabled);
      await modeler.importXML(enabled);
      expect(expressions(modeler, type)).to.deep.equal([
        ['order_id', 'order_id'],
        ['customer_id', 'customer_id'],
      ]);
    });

    it('does not backfill an older diagram that already has matching enabled', async function () {
      const modeler = getBpmnJS();
      await modeler.importXML(
        diagram(type).replace(
          'id="Receiver"',
          'id="Receiver" spiffworkflow:isMatchingCorrelation="true"'
        )
      );
      const { xml: before } = await modeler.saveXML();
      await expectSelected('Receiver');
      expect(expressions(modeler, type)).to.deep.equal([]);
      expect((await modeler.saveXML()).xml).to.equal(before);
    });

    it('preserves custom expressions and other extensions across disable/re-enable', async function () {
      const modeler = getBpmnJS();
      await modeler.importXML(
        diagram(
          type,
          `<bpmn:extensionElements>
        <spiffworkflow:messageVariable>reply</spiffworkflow:messageVariable>
        <spiffworkflow:processVariableCorrelation>
          <spiffworkflow:propertyId>order_id</spiffworkflow:propertyId>
          <spiffworkflow:expression>order["id"]</spiffworkflow:expression>
        </spiffworkflow:processVariableCorrelation>
        <spiffworkflow:processVariableCorrelation>
          <spiffworkflow:propertyId>customer_id</spiffworkflow:propertyId>
          <spiffworkflow:expression> </spiffworkflow:expression>
        </spiffworkflow:processVariableCorrelation>
      </bpmn:extensionElements>`
        )
      );
      await expectSelected('Receiver');
      await toggle();
      await toggle();
      await toggle();
      expect(expressions(modeler, type)).to.deep.equal([
        ['order_id', 'order["id"]'],
        ['customer_id', 'customer_id'],
      ]);
      expect((await modeler.saveXML()).xml).to.include(
        '<spiffworkflow:messageVariable>reply</spiffworkflow:messageVariable>'
      );
    });

    it('does not create expressions for a message without correlation properties', async function () {
      const modeler = getBpmnJS();
      await modeler.importXML(diagram(type, '', false));
      await expectSelected('Receiver');
      await toggle();
      expect(expressions(modeler, type)).to.deep.equal([]);
      expect(owner(modeler, type).get('extensionElements')).not.to.exist;
    });
  });
}
