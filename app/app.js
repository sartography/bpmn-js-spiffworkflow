import BpmnModeler from 'bpmn-js/lib/Modeler';
import diagramXML from '../resources/diagram.bpmn';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import inputOutput from './spiffworkflow/InputOutput';
import SpiffWorkflowPropertiesProvider from './spiffworkflow/PropertiesPanel';

// Examples for extending the xml language can be found at
//  https://github.com/camunda/camunda-bpmn-moddle/blob/master/resources/camunda.json
import SpiffModdleProvider from './spiffworkflow/PropertiesPanel/descriptors/spiffworkflow';

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
    SpiffWorkflowPropertiesProvider,
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
  ],
  moddleExtensions: {
    spiffworkflow: SpiffModdleProvider
  }
});

// import XML
bpmnModeler.importXML(diagramXML).then(() => {});
