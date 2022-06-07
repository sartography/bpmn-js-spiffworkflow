import BpmnModeler from 'bpmn-js/lib/Modeler';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import diagramXML from '../resources/diagram.bpmn';
// import customModule from './custom';
// import qaExtension from '../resources/qa';

const HIGH_PRIORITY = 1500;

const containerEl = document.getElementById('container')
// create modeler
const bpmnModeler = new BpmnModeler({
    container: containerEl,
    additionalModules: [
        ],
    moddleExtensions: {
    }
});

// import XML
bpmnModeler.importXML(diagramXML).then(() => {})
