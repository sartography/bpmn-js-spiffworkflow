import TestContainer from 'mocha-test-container-support';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import {
  bootstrapPropertiesPanel,
  expectSelected,
} from './helpers';
import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';
import messages from '../../app/spiffworkflow/messages';
import { getBpmnJS } from 'bpmn-js/test/helper';

describe('Main correlation key should remain stable', function () {
  const xml = require('./bpmn/message_receive_main_key.bpmn').default;
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

  const updateMessageDefinition = (eventBus) => {
    eventBus.fire('spiff.add_message.returned', {
      elementId: 'Activity_0qpzdpu',
      name: 'B',
      correlation_properties: {
        uid: {
          retrieval_expression: 'uid',
        },
      },
    });
  };

  it('should preserve the existing key id across repeated message-editor saves', async function () {
    const modeler = getBpmnJS();

    const receiveShape = await expectSelected('Activity_0qpzdpu');
    expect(receiveShape, "Can't find Receive Task").to.exist;

    updateMessageDefinition(modeler.get('eventBus'));
    await expectSelected('Activity_0qpzdpu');

    const { xml: firstSaveXml } = await modeler.saveXML({ format: true });
    expect(firstSaveXml).to.include(
      '<bpmn:correlationKey id="CorrelationKey_0sbzdpi" name="MainCorrelationKey">'
    );
    expect(firstSaveXml).to.include(
      '<bpmn:correlationPropertyRef>uid</bpmn:correlationPropertyRef>'
    );

    updateMessageDefinition(modeler.get('eventBus'));
    await expectSelected('Activity_0qpzdpu');

    const { xml: secondSaveXml } = await modeler.saveXML({ format: true });
    expect(secondSaveXml).to.include(
      '<bpmn:correlationKey id="CorrelationKey_0sbzdpi" name="MainCorrelationKey">'
    );
    expect(secondSaveXml).to.include(
      '<bpmn:correlationPropertyRef>uid</bpmn:correlationPropertyRef>'
    );
  });
});
