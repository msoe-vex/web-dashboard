import { AutonCreator } from "./AutonManager";

export function handleFileSelectEvent(event: any, activeAutonCreator: AutonCreator) {
    event.stopPropagation();
    event.preventDefault();

    var file = event.dataTransfer.files[0];
    var read = new FileReader();
    read.readAsText(file);

    read.onloadend = function() {
        console.log(read.result);
		activeAutonCreator.loadPath(read.result.toString());
    }
}

export function handleDragOverEvent(event: any) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}