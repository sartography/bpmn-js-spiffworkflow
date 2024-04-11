import {
  query as domQuery
} from 'min-dom';
import { bootstrapPropertiesPanel, CONTAINER, expectSelected, findGroupEntry } from './helpers';
import inputOutput from '../../app/spiffworkflow/InputOutput';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import { fireEvent } from '@testing-library/preact';

describe('BPMN Input / Output Variables', function () {

  let xml = require('./bpmn/io_variables.bpmn').default;

  beforeEach(bootstrapPropertiesPanel(xml, {
    debounceInput: false,
    additionalModules: [
      inputOutput,
      BpmnPropertiesPanelModule,
      BpmnPropertiesProviderModule
    ]
  }));

  it('should be able to add a new input to the user task', async function () {

    // We Select a userTask element
    const shapeElement = await expectSelected('Activity_1hmit5k');
    expect(shapeElement, "I can't find ManualTask element").to.exist;

    // Expect shapeElement.businessObject.ioSpecification to be undefined
    expect(shapeElement.businessObject.ioSpecification).to.be.undefined;

    // Add new dataInput
    const entry = findGroupEntry('inputParameters', CONTAINER);
    let addButton = domQuery('.bio-properties-panel-add-entry', entry);
    fireEvent.click(addButton);

    expect(shapeElement.businessObject.ioSpecification).not.to.be.undefined;
    expect(shapeElement.businessObject.ioSpecification.dataInputs.length).to.equal(1);
  });

  it('should be able to add a new output to the user task', async function () {

    // We Select a userTask element
    const shapeElement = await expectSelected('Activity_1hmit5k');
    expect(shapeElement, "I can't find Uset Task element").to.exist;

    // Expect shapeElement.businessObject.ioSpecification to be undefined
    expect(shapeElement.businessObject.ioSpecification).to.be.undefined;

    // Add new dataOutput
    const entry = findGroupEntry('outputParameters', CONTAINER);
    let addButton = domQuery('.bio-properties-panel-add-entry', entry);
    fireEvent.click(addButton);

    expect(shapeElement.businessObject.ioSpecification).not.to.be.undefined;
    expect(shapeElement.businessObject.ioSpecification.dataOutputs.length).to.equal(1);

  });

  it('should be able to delete an existing input variable from script task', async function () {

    // We Select a scriptTask element
    const shapeElement = await expectSelected('Activity_1dkj93x');
    expect(shapeElement, "I can't find Script Task element").to.exist;
    expect(shapeElement.businessObject.ioSpecification.dataInputs.length).to.equal(1);

    const entry = findGroupEntry('inputParameters', CONTAINER);
    let removeButton = domQuery('.bio-properties-panel-remove-entry', entry);
    fireEvent.click(removeButton);

    expect(shapeElement.businessObject.ioSpecification.dataInputs.length).to.equal(0);
    expect(shapeElement.businessObject.ioSpecification.dataOutputs.length).to.equal(1);
  })


  it('should be able to delete an existing output variable from script task', async function () {

    // We Select a scriptTask element
    const shapeElement = await expectSelected('Activity_1dkj93x');
    expect(shapeElement, "I can't find Script Task element").to.exist;
    expect(shapeElement.businessObject.ioSpecification.dataInputs.length).to.equal(1);

    const entry = findGroupEntry('outputParameters', CONTAINER);
    let removeButton = domQuery('.bio-properties-panel-remove-entry', entry);
    fireEvent.click(removeButton);

    expect(shapeElement.businessObject.ioSpecification.dataInputs.length).to.equal(1);
    expect(shapeElement.businessObject.ioSpecification.dataOutputs.length).to.equal(0);
  })


});
