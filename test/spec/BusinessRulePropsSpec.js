import { query as domQuery } from 'min-dom';
import { getBpmnJS } from 'bpmn-js/test/helper';

import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import spiffModdleExtension from '../../app/spiffworkflow/moddle/spiffworkflow.json';
import {
  bootstrapPropertiesPanel,
  changeInput,
  expectSelected,
  findEntry,
  findSelect,
  getPropertiesPanel,
} from './helpers';
import extensions from '../../app/spiffworkflow/extensions';

describe('Business Rule Properties Panel', function () {
  const xml = require('./bpmn/diagram.bpmn').default;

  beforeEach(
    bootstrapPropertiesPanel(xml, {
      debounceInput: false,
      additionalModules: [
        extensions,
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
      ],
      moddleExtensions: {
        spiffworkflow: spiffModdleExtension,
      },
    })
  );

  function addOptionsToEventBus(bpmnModeler) {
    bpmnModeler.on('spiff.options.requested', (event) => {
      if (event.optionType === 'dmn') {
        event.eventBus.fire('spiff.options.returned.dmn', {
          options: [
            { label: 'Calculate Pizza Price', value: 'Decision_Pizza_Price' },
            { label: 'Viking Availability', value: 'Decision_Vikings' },
            { label: 'Test Decision', value: 'test_decision' },
          ],
        });
      }
    });
  }

  it('should display a dropdown to select from available decision tables', async function () {
    const modeler = getBpmnJS();
    addOptionsToEventBus(modeler);
    expectSelected('business_rule_task');

    // THEN - a properties panel exists with a section for editing that script
    const entry = findEntry('extension_calledDecisionId', getPropertiesPanel());
    expect(entry).to.exist;
    const selectList = findSelect(entry);
    expect(selectList).to.exist;
  });

  it('should update the spiffworkflow:calledDecisionId tag when you modify the called decision select box', async function () {
    // IF - a script tag is selected, and you change the script in the properties panel
    const modeler = getBpmnJS();
    addOptionsToEventBus(modeler);
    const businessRuleTask = await expectSelected('business_rule_task');
    const entry = findEntry('extension_calledDecisionId', getPropertiesPanel());
    const selectList = findSelect(entry);
    changeInput(selectList, 'Decision_Pizza_Price');

    // THEN - the script tag in the BPMN Business object / XML is updated as well.
    const businessObject = getBusinessObject(businessRuleTask);
    expect(businessObject.extensionElements).to.exist;
    const element = businessObject.extensionElements.values[0];
    expect(element.calledDecisionId).to.equal('Decision_Pizza_Price');
  });

  it('should load up the xml and the value for the called decision should match the xml', async function () {
    const businessRuleTask = await expectSelected('business_rule_task');
    const entry = findEntry('extension_calledDecisionId', getPropertiesPanel());
    const selectList = findSelect(entry);
    expect(selectList.value).to.equal('test_decision');

    // THEN - the script tag in the BPMN Business object / XML is updated as well.
    const businessObject = getBusinessObject(businessRuleTask);
    expect(businessObject.extensionElements).to.exist;
    const element = businessObject.extensionElements.values[0];
    expect(element.calledDecisionId).to.equal('test_decision');
  });
});
