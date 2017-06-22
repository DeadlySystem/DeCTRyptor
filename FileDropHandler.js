"use strict";

class FileDropHandler
{
    constructor(targetElement, fileProcessor)
    {
        this.fileProcessor = fileProcessor;
        this.dragHint = document.querySelector(".DragHint");
        this.fileList = this.dragHint.querySelector(".FileList");
        targetElement.addEventListener('dragover', this.dragOverMarkCopy.bind(this));
        targetElement.addEventListener('dragenter', this.dragOverMarkCopy.bind(this));
        targetElement.addEventListener('dragstart', this.dragOverMarkCopy.bind(this));
        targetElement.addEventListener('dragleave', this.dragLeave.bind(this));
        targetElement.addEventListener('drop', this.dragLeave.bind(this));
        targetElement.addEventListener('drop', this.fileDropped.bind(this));
    }

    dragLeave()
    {
        this.dragHint.style.visibility = "hidden";
    }

    /**
     * @param {DragEvent|Event} event
     */
    dragOverMarkCopy(event)
    {
        event.stopPropagation();
        event.preventDefault();

        event.dataTransfer.dropEffect = 'copy';
        this.dragHint.style.visibility = "visible";

        while(this.fileList.hasChildNodes()) {
            this.fileList.removeChild(this.fileList.firstChild);
        }

        const self = this;
        Array.prototype.forEach.call(
            event.dataTransfer.files,
            function (file) {
                const item = document.createElement("li");
                item.textContent = file.name;
                self.fileList.appendChild(item);
            }
        );
    }

    /**
     * @param {DragEvent|Event} event
     */
    fileDropped(event)
    {
        if(event.dataTransfer.files.length === 0) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();

        const self = this;
        Array.prototype.forEach.call(
            event.dataTransfer.files,
            function (file) {
                const reader = new FileReader();
                reader.addEventListener(
                    'loadend',
                    function (event) {
                        self.fileProcessor(reader.result);
                    }
                );
                reader.readAsArrayBuffer(file);
            }
        );
    }
}