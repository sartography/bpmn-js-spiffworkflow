import BpmnModeler from 'bpmn-js/lib/Modeler';
import diagramXML from '../resources/diagram.bpmn';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import inputOutput from './spiffworkflow/InputOutput';
import SpiffWorkflowPropertiesProvider from './spiffworkflow/PropertiesPanel/provider';
import SpiffModdleProvider from './spiffworkflow/PropertiesPanel/descriptors/spiff.json';

const modelerEl = document.getElementById('modeler');
const panelEl = document.getElementById('panel');

// create modeler
const bpmnModeler = new BpmnModeler({
  container: modelerEl,
  propertiesPanel: {
    parent: panelEl
  },
  additionalModules: [
    inputOutput,
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
    SpiffWorkflowPropertiesProvider
  ],
  moddleExtensions: {
    magic: SpiffModdleProvider
  }
});

// import XML
bpmnModeler.importXML(diagramXML).then(() => {});
