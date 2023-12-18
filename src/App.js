import React, { useEffect, useRef } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';

import spiffworkflow from './spiffworkflow';

import './App.css';


// Import BPMN JS CSS
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'
import 'bpmn-js-properties-panel/dist/assets/properties-panel.css'

// Import Font Awesome
import 'font-awesome/css/font-awesome.min.css';

function App() {

  const modelerRef = useRef(null);
  const panelRef = useRef(null);
  // const codeEditorRef = useRef(null);
  // const markdownTextareaRef = useRef(null);

  useEffect(() => {

    console.log('Hi App!');


    // If modelerRef or panelRef are not empty, make it empty
    if (modelerRef.current) {
      modelerRef.current.innerHTML = '';
    }
    if (panelRef.current) {
      panelRef.current.innerHTML = '';
    }

    // Initialize BPMN Modeler
    const spiffModdleExtension = require('./spiffworkflow/moddle/spiffworkflow.json');
    let bpmnModeler;

    // Initialize BPMN Modeler
    try {
      bpmnModeler = new BpmnModeler({
        container: modelerRef.current,
        keyboard: { bindTo: document },
        propertiesPanel: {
          parent: panelRef.current,
        },
        additionalModules: [
          spiffworkflow,
          BpmnPropertiesPanelModule,
          BpmnPropertiesProviderModule,
        ],
        moddleExtensions: {
          spiffworkflowModdle: spiffModdleExtension,
        },
      });
      // ... rest of the initialization code
      
      // Declare XML content as string example
      try {
        let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
        <bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
          <bpmn:process id="Process_1" isExecutable="false">
            <bpmn:startEvent id="StartEvent_1"/>
            <bpmn:task id="Task_1" name="Sample Task"/>
            <bpmn:endEvent id="EndEvent_1"/>
            <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1"/>
            <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1"/>
          </bpmn:process>
          <bpmndi:BPMNDiagram id="BPMNDiagram_1">
            <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
              <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
                <dc:Bounds x="173" y="102" width="36" height="36"/>
              </bpmndi:BPMNShape>
              <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
                <dc:Bounds x="233" y="80" width="100" height="80"/>
              </bpmndi:BPMNShape>
              <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
                <dc:Bounds x="383" y="102" width="36" height="36"/>
              </bpmndi:BPMNShape>
              <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
                <di:waypoint x="209" y="120"/>
                <di:waypoint x="233" y="120"/>
              </bpmndi:BPMNEdge>
              <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
                <di:waypoint x="333" y="120"/>
                <di:waypoint x="383" y="120"/>
              </bpmndi:BPMNEdge>
            </bpmndi:BPMNPlane>
          </bpmndi:BPMNDiagram>
        </bpmn:definitions>
        `
        bpmnModeler.importXML(xmlContent).then(() => { });
      } catch (error) {
        console.log(error);      
      }
      // setupFileOperations(bpmnModeler);

    } catch (error) {
      // Error handling
      console.error(error);
    }

    // Initialize CodeMirror and SimpleMDE if necessary
    // ...

    return () => {
      // Cleanup
      // Destroy instances or remove event listeners if necessary
    };
  }, []);

  return (
    <div className="App">
      <div id="menu">
        <button id="downloadButton" className="bpmn-js-spiffworkflow-btn"><i className="fa fa-download"></i> Download</button>
        <button id="uploadButton" className="bpmn-js-spiffworkflow-btn">Open a file</button>
      </div>
      <div id="container">
        <div id="modeler" ref={modelerRef}></div>
        <div id="panel" ref={panelRef}></div>
      </div>
    </div>
  );
}

export default App;
