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

  function createShape(type, options = {}) {
    return function(event) {
      let shape = elementFactory.createShape(assign({ type: type }, options));
      create.start(event, shape);
    };
  }

  return {
    // Events
    'create.start-event': {
      group: 'events',
      className: 'bpmn-icon-start-event-none',
      title: translate('Start'),
      action: {
        dragstart: createShape('bpmn:StartEvent'),
        click: createShape('bpmn:StartEvent')
      }
    },
    'create.intermediate-event': {
      group: 'events',
      className: 'bpmn-icon-intermediate-event-none',
      title: translate('Intermediate'),
      action: {
        dragstart: createShape('bpmn:IntermediateCatchEvent'),
        click: createShape('bpmn:IntermediateCatchEvent')
      }
    },
    'create.end-event': {
      group: 'events',
      className: 'bpmn-icon-end-event-none',
      title: translate('End'),
      action: {
        dragstart: createShape('bpmn:EndEvent'),
        click: createShape('bpmn:EndEvent')
      }
    },
    // Activities
    'create.task': {
      group: 'activities',
      className: 'bpmn-icon-task',
      title: translate('Task'),
      action: {
        dragstart: createShape('bpmn:Task'),
        click: createShape('bpmn:Task')
      }
    },
    'create.user-task': {
      group: 'activities',
      className: 'bpmn-icon-user',
      title: translate('User Task'),
      action: {
        dragstart: createShape('bpmn:UserTask'),
        click: createShape('bpmn:UserTask')
      }
    },
    'create.scirpt-task': {
      group: 'activities',
      className: 'bpmn-icon-script',
      title: translate('Script Task'),
      action: {
        dragstart: createShape('bpmn:ScriptTask'),
        click: createShape('bpmn:ScriptTask')
      }
    },
    'create.service-task': {
      group: 'activities',
      className: 'bpmn-icon-service',
      title: translate('Service Task'),
      action: {
        dragstart: createShape('bpmn:ServiceTask'),
        click: createShape('bpmn:ServiceTask')
      }
    },
    // Gateways
    'create.condition-gateaway': {
      group: 'decisions',
      className: 'bpmn-icon-gateway-xor',
      title: translate('Decision'),
      action: {
        dragstart: createShape('bpmn:ExclusiveGateway'),
        click: createShape('bpmn:ExclusiveGateway')
      }
    },
    'create.parallel-gateaway': {
      group: 'decisions',
      className: 'bpmn-icon-gateway-parallel',
      title: translate('Parallel'),
      action: {
        dragstart: createShape('bpmn:ParallelGateway'),
        click: createShape('bpmn:ParallelGateway')
      }
    },
    'create.eventbased-gateaway': {
      group: 'decisions',
      className: 'bpmn-icon-gateway-eventbased',
      title: translate('Event Based'),
      action: {
        dragstart: createShape('bpmn:EventBasedGateway'),
        click: createShape('bpmn:EventBasedGateway')
      }
    },
    'create.inclusive-gateaway': {
      group: 'decisions',
      className: 'bpmn-icon-gateway-or',
      title: translate('xOR'),
      action: {
        dragstart: createShape('bpmn:InclusiveGateway'),
        click: createShape('bpmn:InclusiveGateway')
      }
    },
    // Data Object
    'create.data-store': {
      group: 'advanced',
      className: 'bpmn-icon-data-store',
      title: translate('Data Store'),
      action: {
        dragstart: createShape('bpmn:DataStoreReference'),
        click: createShape('bpmn:DataStoreReference')
      }
    },
    'create.data-object': {
      group: 'advanced',
      className: 'bpmn-icon-data-object',
      title: translate('Data Object'),
      action: {
        dragstart: createShape('bpmn:DataObjectReference'),
        click: createShape('bpmn:DataObjectReference')
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
      action: {
        dragstart: createShape('bpmn:CallActivity'),
        click: createShape('bpmn:CallActivity')
      }
    },
    'create.participant': {
      group: 'advanced',
      className: 'bpmn-icon-participant',
      title: translate('Participant'),
      action: {
        dragstart: createShape('bpmn:Participant'),
        click: createShape('bpmn:Participant')
      }
    },
    'create.sub-process-expanded': {
      group: 'advanced',
      className: 'bpmn-icon-subprocess-expanded',
      title: translate('SubProcess'),
      action: {
        dragstart: createShape('bpmn:SubProcess', {isExpanded: true}),
        click: createShape('bpmn:SubProcess', {isExpanded: true})
      }
    },
  };
};

IoPalette.prototype.init = function (event) {

  // Override Palette DOM Generated by BPMN-JS Library
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