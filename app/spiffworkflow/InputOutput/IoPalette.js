import { assign } from 'min-dash';
import translate from 'diagram-js/lib/i18n/translate/translate';

/**
 * Add data inputs and data outputs to the panel.
 */
export default function IoPalette(palette, create, elementFactory, eventBus, handTool, globalConnect, lassoTool, spaceTool) {
  this._create = create;
  this._elementFactory = elementFactory;

  this._handTool = handTool;
  this._globalConnect = globalConnect;
  this._lassoTool = lassoTool;
  this._spaceTool = spaceTool;

  eventBus.on('palette.create', function (event) {
    this.init(event);
  }.bind(this));

  palette.registerProvider(this);
}

IoPalette.$inject = [
  'palette',
  'create',
  'elementFactory',
  'eventBus',
  'handTool',
  'globalConnect',
  'lassoTool',
  'spaceTool'
];

IoPalette.prototype.getPaletteEntries = function (e) {

  const handTool = this._handTool;
  const globalConnect = this._globalConnect;
  const lassoTool = this._lassoTool;
  const spaceTool = this._spaceTool;

  let input_type = 'bpmn:DataInput';
  let output_type = 'bpmn:DataOutput';
  let elementFactory = this._elementFactory, create = this._create;

  function createListener(event, type) {
    let shape = elementFactory.createShape(assign({ type: type }, {}));
    shape.width = 36; // Fix up the shape dimensions from the defaults.
    shape.height = 50;
    create.start(event, shape);
  }

  function createInputListener(event) {
    createListener(event, input_type);
  }

  function createOutputListener(event) {
    createListener(event, output_type);
  }

  function createStartEvent(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:StartEvent' }, {}));
    create.start(event, shape);
  }

  function createEndEvent(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:EndEvent' }, {}));
    create.start(event, shape);
  }

  function createIntermediateEvent(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:IntermediateCatchEvent' }, {}));
    create.start(event, shape);
  }

  function createTask(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:Task' }, {}));
    create.start(event, shape);
  }

  function createScriptTask(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:ScriptTask' }, {}));
    create.start(event, shape);
  }

  function createServiceTask(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:ServiceTask' }, {}));
    create.start(event, shape);
  }

  function createUserTask(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:UserTask' }, {}));
    create.start(event, shape);
  }

  function createConditionGateaway(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:ExclusiveGateway' }, {}));
    create.start(event, shape);
  }

  function createParallelGateaway(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:ParallelGateway' }, {}));
    create.start(event, shape);
  }

  function createEventBasedGateaway(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:EventBasedGateway' }, {}));
    create.start(event, shape);
  }

  function createInclusiveGateaway(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:InclusiveGateway' }, {}));
    create.start(event, shape);
  }

  function createDataStore(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:DataStoreReference' }, {}));
    create.start(event, shape);
  }

  function createDataObject(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:DataObjectReference' }, {}));
    create.start(event, shape);
  }

  function createCallActivity(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:CallActivity' }, {}));
    create.start(event, shape);
  }

  function createParticipant(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:Participant' }, {}));
    create.start(event, shape);
  }

  function createSubProcess(event) {
    let shape = elementFactory.createShape(assign({ type: 'bpmn:SubProcess', isExpanded: true }, {}));
    create.start(event, shape);
  }

  return {
    // Events
    'create.start-event': {
      group: 'events',
      className: 'bpmn-icon-start-event-none',
      title: translate('Start'),
      action: {
        dragstart: createStartEvent,
        click: createStartEvent
      }
    },
    'create.intermediate-event': {
      group: 'events',
      className: 'bpmn-icon-intermediate-event-none',
      title: translate('Intermediate'),
      action: {
        dragstart: createIntermediateEvent,
        click: createIntermediateEvent
      }
    },
    'create.end-event': {
      group: 'events',
      className: 'bpmn-icon-end-event-none',
      title: translate('End'),
      action: {
        dragstart: createEndEvent,
        click: createEndEvent
      }
    },
    // Activities
    'create.task': {
      group: 'activities',
      className: 'bpmn-icon-task',
      title: translate('Task'),
      target: {
        type: 'bpmn:Task',
      },
      action: {
        dragstart: createTask,
        click: createTask
      }
    },
    'create.user-task': {
      group: 'activities',
      className: 'bpmn-icon-user',
      title: translate('User Task'),
      target: {
        type: 'bpmn:UserTask',
      },
      action: {
        dragstart: createUserTask,
        click: createUserTask
      }
    },
    'create.scirpt-task': {
      group: 'activities',
      className: 'bpmn-icon-script',
      title: translate('Script Task'),
      target: {
        type: 'bpmn:ScriptTask',
      },
      action: {
        dragstart: createScriptTask,
        click: createScriptTask
      }
    },
    'create.service-task': {
      group: 'activities',
      className: 'bpmn-icon-service',
      title: translate('Service Task'),
      target: {
        type: 'bpmn:ServiceTask',
      },
      action: {
        dragstart: createServiceTask,
        click: createServiceTask
      }
    },
    // Gateways
    'create.condition-gateaway': {
      group: 'decisions',
      className: 'bpmn-icon-gateway-xor',
      title: translate('Decision'),
      target: {
        type: 'bpmn:ExclusiveGateway',
      },
      action: {
        dragstart: createConditionGateaway,
        click: createConditionGateaway
      }
    },
    'create.parallel-gateaway': {
      group: 'decisions',
      className: 'bpmn-icon-gateway-parallel',
      title: translate('Parallel'),
      target: {
        type: 'bpmn:ParallelGateway',
      },
      action: {
        dragstart: createParallelGateaway,
        click: createParallelGateaway
      }
    },
    'create.eventbased-gateaway': {
      group: 'decisions',
      className: 'bpmn-icon-gateway-eventbased',
      title: translate('Event Based'),
      target: {
        type: 'bpmn:EventBasedGateway',
      },
      action: {
        dragstart: createEventBasedGateaway,
        click: createEventBasedGateaway
      }
    },
    'create.inclusive-gateaway': {
      group: 'decisions',
      className: 'bpmn-icon-gateway-or',
      title: translate('xOR'),
      target: {
        type: 'bpmn:InclusiveGateway',
      },
      action: {
        dragstart: createInclusiveGateaway,
        click: createInclusiveGateaway
      }
    },
    // Data Object
    'create.data-store': {
      group: 'advanced',
      className: 'bpmn-icon-data-store',
      title: translate('Data Store'),
      action: {
        dragstart: createDataStore,
        click: createDataStore
      }
    },
    'create.data-object': {
      group: 'advanced',
      className: 'bpmn-icon-data-object',
      title: translate('Data Object'),
      action: {
        dragstart: createDataObject,
        click: createDataObject
      }
    },
    'create.data-input': {
      group: 'advanced',
      className: 'bpmn-icon-data-input',
      title: translate('DataInput'),
      action: {
        dragstart: createInputListener,
        click: createInputListener
      }
    },
    'create.data-output': {
      group: 'advanced',
      className: 'bpmn-icon-data-output',
      title: translate('DataOutput'),
      action: {
        dragstart: createOutputListener,
        click: createOutputListener
      }
    },
    'create.call-activity': {
      group: 'advanced',
      className: 'bpmn-icon-call-activity',
      title: translate('Call Activity'),
      target: {
        type: 'bpmn:CallActivity',
      },
      action: {
        dragstart: createCallActivity,
        click: createCallActivity
      }
    },
    'create.participant': {
      group: 'advanced',
      className: 'bpmn-icon-participant',
      title: translate('Participant'),
      target: {
        type: 'bpmn:Participant',
      },
      action: {
        dragstart: createParticipant,
        click: createParticipant
      }
    },
    'create.sub-process-expanded': {
      group: 'advanced',
      className: 'bpmn-icon-subprocess-expanded',
      title: translate('SubProcess'),
      target: {
        type: 'bpmn:SubProcess',
        isExpanded: true
      },
      action: {
        dragstart: createSubProcess,
        click: createSubProcess
      }
    },
  };
};

IoPalette.prototype.init = function (event) {

  const paletteContainer = event.container;
  const bpmnElementsDiv = document.getElementById('BPMNElements');

  setTimeout(() => {

    // Query all group elements
    const groups = paletteContainer.querySelectorAll('.group');

    groups.forEach(group => {
      const groupName = group.getAttribute('data-group');
      const title = groupName.charAt(0).toUpperCase() + groupName.slice(1).replace(/-/g, ' '); // Capitalize and format the title

      // Check if group title already exists
      let header = group.querySelector('.group-title');
      let entriesContainer = group.querySelector('.entries-container'); // Container for entries

      if (!header) {
        // Creation the collapsible header
        header = document.createElement('div');
        header.classList.add('group-title');

        // Creation the title span
        const titleSpan = document.createElement('span');
        titleSpan.textContent = title;
        header.appendChild(titleSpan);

        // Creation the toggle button
        const toggleButton = document.createElement('button');
        toggleButton.classList.add('group-toggle');
        toggleButton.innerHTML = '<i class="fa fa-chevron-down" aria-hidden="true"></i>';
        header.appendChild(toggleButton);

        // Insert the header 
        group.insertBefore(header, group.firstChild);

        // Create the entries container
        entriesContainer = document.createElement('div');
        entriesContainer.classList.add('entries-container');
        group.appendChild(entriesContainer); // Append entries container after the header

        toggleButton.addEventListener('click', function () {
          entriesContainer.style.display = entriesContainer.style.display === 'none' ? '' : 'none';
          toggleButton.innerHTML = entriesContainer.style.display === 'none' ? '<i class="fa fa-chevron-right" aria-hidden="true"></i>' : '<i class="fa fa-chevron-down" aria-hidden="true"></i>';
        });
      }
      const entries = group.querySelectorAll('.entry');
      entries.forEach(entry => {
        entriesContainer.appendChild(entry); 

        let label = entry.querySelector('.entry-label');
        if (!label) {
          label = document.createElement('span');
          label.classList.add('entry-label');
          entry.appendChild(label);
        }
        label.textContent = entry.getAttribute('title');
      });
    });

    // Move the palette
    bpmnElementsDiv.appendChild(paletteContainer);

  }, 200);

};