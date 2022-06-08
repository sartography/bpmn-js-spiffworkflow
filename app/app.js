import BpmnModeler from 'bpmn-js/lib/Modeler';
import diagramXML from '../resources/diagram.bpmn';
import spiffworkflow from './spiffworkflow';
const containerEl = document.getElementById('container');

// create modeler
const bpmnModeler = new BpmnModeler({
  container: containerEl,
  additionalModules: [
    spiffworkflow
  ],
  moddleExtensions: {}
});

// import XML
bpmnModeler.importXML(diagramXML).then(() => {});
