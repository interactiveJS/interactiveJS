/**
 * Make an element draggable.
 * Use of left mouse down + drag to drag elements.
 *
 * @param {String} id
 */
function draggable(id) {
    
    element = document.getElementById(id);
    element.classList.add('draggable');

    // Add header. Will be used as the drag point.
    let dragPoint = document.createElement('div');
    dragPoint.id = element.id + 'Header';
    dragPoint.className = 'dragPoint';
    initialDragPointStyling(dragPoint);
    // Ensure the drag point is the first element child
    let firstChild = element.firstChild;
    if (firstChild !== null) {
        element.insertBefore(dragPoint, firstChild);
    }
    else {
        element.appendChild(dragPoint);
    }

    // Drag config for resizable elements
    if (element.classList.contains('resizable')) {
        // Ensures an element is a interactive.js resizable element
        let parent = element.parentElement;
        if (parent.classList.contains('parentResize')) {
            // resizePoints styling
            resizePointsStyling(element, dragPoint);
            element = parent;
        }
    }

    dragPoint.onmousedown = function() {
        if (event.which == 1) {
            drag(element);
        }
    };  
}

/**
 * Change the element position according to the mouse drag
 * 
 * @param {HTMLelement} element 
 */
function drag(element) {
    // Cursor initial position
    let x1 = event.clientX;
    let y1 = event.clientY;

    document.onmouseup = dragMouseStop;
    document.onmousemove = function() {

        // Cursor actual position
        let x2 = event.clientX;
        let y2 = event.clientY;

        // Calculate mouse movement
        let mouseDrag = { x: x1 - x2, y: y1 - y2 };
        
        // Prevent dragging elements outside the screen
        let newPosition = getDragNewPosition(element, mouseDrag);
        // New position
        element.style.left = newPosition.x + "px";
        element.style.top = newPosition.y + "px";

        // Take the actual mouse position as the new initial position
        x1 = x2;
        y1 = y2;
    };
}

/**
 * Stop drag movement
 */
function dragMouseStop() {
    document.onmouseup = null;
    document.onmousemove = null;
}

/**
 * Style dragPoint
 * 
 * @param {HTMLelement} dragPoint 
 */
function initialDragPointStyling(dragPoint) {
    dragPoint.style.width = '100%';
    dragPoint.style.height = '20px';
    dragPoint.style.backgroundColor = 'rgb(48, 55, 97)';
}

/**
 * Style the resizePoints according to the element header style properties
 * 
 * @param {HTMLelement} element 
 * @param {HTMLelement} dragPoint 
 */
function resizePointsStyling(element, dragPoint) { 
    for (let i = 0; i < 5; i++) {
        let sibling = element.nextSibling;
        if (sibling.className == 'left' || sibling.className == 'right') {
            sibling.style.borderTop = dragPoint.style.height + ' solid ' + dragPoint.style.backgroundColor;
        }
        else {
            sibling.style.backgroundColor = dragPoint.style.backgroundColor;
        }
        element = sibling;
    }
}

/**
 * Calculate the new position for the element.
 * Prevent dragging elements outside the screen.
 * 
 * @param {HTMLElement} ele - element
 * @param {Object} mouseDrag
 * @returns {Object} The new X and Y position fot the element
 */
function getDragNewPosition(ele, mouseDrag) {
    
    // Get element properties
    let element = getElementOffsetAndMeasures(ele);

    // Calculate the new position of the element
    let newPosition = {
        x : element.left - mouseDrag.x,
        y : element.top - mouseDrag.y
    };

    // Get element boundaries
    let boundaries = {
        left : newPosition.x,
        top : newPosition.y,
        right: newPosition.x + element.width,
        bottom: newPosition.y + element.height,
    };
  
    return preventDragOutsideScreen(element, newPosition, boundaries);
}

/**
 * Get the offset, height and width of an element
 * 
 * @param {HTMLelement} element 
 */
function getElementOffsetAndMeasures(element) {
    return {
        left: element.offsetLeft,
        top: element.offsetTop,
        height: element.offsetHeight,
        width: element.offsetWidth
    };
}

/**
 * Prevent from dragging an element outside the body document
 * 
 * @param {Object} element - Element original properties offset, width, height
 * @param {*} newPosition
 * @param {*} boundaries - Element boundaries based on new position
 */
function preventDragOutsideScreen(element, newPosition, boundaries) {
    // Get the document limits
    let limit = getDocumentBodyLimits();

    // Assign the previous position to the new postion if limit is exceeded
    if (boundaries.left < limit.left) {
        newPosition.x = element.left;
    }
    if (boundaries.top < limit.top) {
        newPosition.y = element.top;
    }
    if (boundaries.right > limit.right) {
        newPosition.x = element.left;
    }
    if (boundaries.bottom > limit.bottom) {
        newPosition.y = element.top;
    }

    return newPosition;
}

// HELPERS

/**
 * Get the boundaries of a document body
 */
function getDocumentBodyLimits() {
    return {
        left : 0,
        right : document.body.clientWidth,
        top: 0,
        bottom: document.body.clientHeight
    };
}
