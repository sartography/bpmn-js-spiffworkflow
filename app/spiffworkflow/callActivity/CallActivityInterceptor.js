import { is } from 'bpmn-js/lib/util/ModelUtil';

export default function CallActivityInterceptor(eventBus, bpmnUpdater, overlays) {

    let OVERLAY_ID;

    eventBus.on('selection.changed', function (event) {

        var newSelection = event.newSelection;
        const element = (newSelection.length > 0) ? newSelection[0] : null;

        (OVERLAY_ID) ? overlays.remove(OVERLAY_ID) : null;

        if (element && is(element.businessObject, 'bpmn:CallActivity') && newSelection.length === 1) {
            var ARROW_DOWN_SVG = '<svg width="20" height="20" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"> <g id="SVGRepo_bgCarrier" stroke-width="0"> <rect x="0" y="0" width="24.00" height="24.00" rx="0" fill="#2196f3" strokewidth="0"/> </g> <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.048"/> <g id="SVGRepo_iconCarrier"> <path d="M7 17L17 7M17 7H8M17 7V16" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/> </g> </svg>';
            var button = domify('<button class="bjs-drilldown">' + ARROW_DOWN_SVG + '</button>');
            button.addEventListener('click', function () {
                const processId = getCalledElementValue(element);
                if (!processId || processId === '') {
                    alert('Please select a process model first');
                    return;
                }
                eventBus.fire('spiff.callactivity.edit', {
                    element,
                    processId,
                });
            });
            OVERLAY_ID = overlays.add(element.id, 'drilldown', {
                position: {
                    bottom: -10,
                    right: -8
                },
                html: button
            });
        }

    });
}

function domify(htmlString) {
    const template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}

function getCalledElementValue(element) {
    const { calledElement } = element.businessObject;
    if (calledElement) {
        return calledElement;
    }
    return '';
}

CallActivityInterceptor.$inject = ['eventBus', 'bpmnUpdater', 'overlays'];

