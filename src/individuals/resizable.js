/**
 * Make an element resizable.
 * Use of left mouse down + drag to resize element.
 * 
 * @param {String} id
 */
function resizable(id) {
    
    element = document.getElementById(id);
    element.classList.add('resizable');

    /* 
       Add a parent that will contain the element and its resize points
       The resize parent element must have as parent the actual element parent.
       e.g body > element ---> body > parent > element
    */
    let resizeParent = document.createElement('div');
    resizeParent.id = 'parent_' + element.id;
    resizeParent.className = 'parentResize';
    resizeParent.style.zIndex = 1;
    element.parentElement.appendChild(resizeParent);
    resizeParent.appendChild(element);

    // Add the resize points
    addResizePoints(element, resizeParent);
}

/**
 * Add the resize points to a resizable element.
 * Resize points order:
 * | upperLeft |   top   | upperRight
 * | left      | element |    right
 * | lowerLeft | bottom  | lowerRight
 * 
 * @param {HTMLelement} element
 * @param {HTMLelement} parent
 */
function addResizePoints(element, parent) {

    initialResizeCssProperties(element, parent);

    let resizePoints = ['left', 'upperLeft', 'top', 'upperRight', 'right', 'lowerRight', 'bottom', 'lowerLeft'];
    for (let i = 0, len = resizePoints.length; i < len; i++) {

        let div = document.createElement('div');
        div.className = resizePoints[i];
        parent.appendChild(div);  

        addResizePointFunctionality(element, parent, div);
    }
}

/**
 * Set the initial css properties according to the specified css values
 * 
 * @param {HTMLelement} element
 * @param {HTMLelement} parent 
 */
function initialResizeCssProperties(element, parent) {

    let computed = getComputedStyle(element);
    
    // Set width and height to default if no width and height is specified
    let w = computed.getPropertyValue('width');
    let h = computed.getPropertyValue('height');
    if (w == '0px') { w = '200px'; }
    if (h == '0px') { h = '150px'; }

    parent.style.top = computed.getPropertyValue('top');
    parent.style.left = computed.getPropertyValue('left');
    parent.style.gridTemplateRows = '3px ' + h + ' 3px';
    parent.style.gridTemplateColumns = '3px ' + w + ' 3px';
    parent.style.backgroundColor = computed.getPropertyValue('background-color');

    element.style.top = '0px';
    element.style.left = '0px';
    element.style.width = w;
    element.style.height = h;
}

/**
 * Add left mouse down + drag resize functionality to a resize point.
 *
 * @param {HTMLelement} element 
 * @param {HTMLelement} parent 
 * @param {HTMLelement} resizePoint 
 */
function addResizePointFunctionality(element, parent, resizePoint) {
    resizePoint.onmousedown = function() {
        if (event.which == 1) { 
            resize(element, parent, resizePoint);
        }
    };
}

/**
 * Resize element according to mouse drag
 * 
 * @param {HTMLelement} element
 */
function resize(element, parent, resizePoint) {
  
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
        
        // Get the zone where the resize point lives
        let zone = getResizePointZone(resizePoint.className);
        // Change Measures
        changeHorizontalMeasures(element, parent, mouseDrag.x, zone[0]);
        changeVerticalMeasures(element, parent, mouseDrag.y, zone[1]);

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
 * Get the zone where a resizePoint lives
 * zone codes:
 *     0 left     2 top
 *     1 right    3 bottom
 *  
 * @param {String} resizePoint 
 * @returns {Array} [horizontal zone, vertical zone] zone code/s or undefined if the resize point does not correspond to a zone 
 */
function getResizePointZone(resizePoint) {
    return [ 
        getHorizontalResizePointZone(resizePoint), // Horizontal zone
        getVerticalResizePointZone(resizePoint) // Vertical zone
    ];
}

/**
 * Get the horizontal zone where a resize Point lives
 * 
 * @param {String} resizePoint
 */
function getHorizontalResizePointZone(resizePoint) {
    if (resizePoint == 'left' || resizePoint == 'upperLeft' || resizePoint == 'lowerLeft') {
        return 0;
    }
    else if (resizePoint == 'right' || resizePoint == 'upperRight' || resizePoint == 'lowerRight') {
        return 1;
    }
    
    return undefined;
}

/**
 * Get the vertical zone where a resize Point lives
 * 
 * @param {String} resizePoint
 * @returns {Integer|undefined} 2 for top zone, 3 for bottom zone, else undefiend
 */
function getVerticalResizePointZone(resizePoint) {

    if (resizePoint == 'top' || resizePoint == 'upperLeft' || resizePoint == 'upperRight') {
        return 2;
    }
    else if (resizePoint == 'bottom' || resizePoint == 'lowerLeft' || resizePoint == 'lowerRight') {
        return 3;
    }

    return undefined;
}

/**
 * Change the horizontal measures according to the resize event
 * 
 * @param {HTMLelement} element 
 * @param {HTMLelement} parent 
 * @param {Integer} mouseDrag 
 * @param {Integer} zone 
 */
function changeHorizontalMeasures(element, parent, mouseDrag, zone) {
    if (zone === undefined) { return; }
    if (zone == 1) {
        mouseDrag = -mouseDrag;
    }
    let width = parseInt(element.style.width.slice(0, -2)) + mouseDrag;

    // Ensure max width for right zones
    let offsetLeft = parent.offsetLeft;
    if (zone == 1 && offsetLeft + width + 6 > document.body.clientWidth) { // Default resize point width 3px
        return;
    }
    
    if (width >= 5) { // Ensure min width (Default 5px)

        // Change offset for left zones
        if (zone == 0) {
            let newOffset = offsetLeft - mouseDrag; 
            if (newOffset < 0) { return; } // Ensure max width for left zones
            parent.style.left = newOffset + 'px';
        }
        
        element.style.width = width + 'px';
        parent.style.gridTemplateColumns = '3px ' + width + 'px 3px';
    }
}

/**
 * Change the vertical measures according to the resize event
 * 
 * @param {HTMLelement} element 
 * @param {HTMLelement} parent 
 * @param {Integer} mouseDrag 
 * @param {Integer} zone 
 */
function changeVerticalMeasures(element, parent, mouseDrag, zone) {
    if (zone === undefined) { return; }
    
    if (zone == 3) {
        mouseDrag = -mouseDrag;
    }
    
    let height = parseInt(element.style.height.slice(0, -2)) + mouseDrag;
    
    // Ensure max height for bottom zones
    let offsetTop = parent.offsetTop;
    if (zone == 3 && offsetTop + height + 6 > document.body.clientHeight) { // Default resize point width 3px
        return;
    }
    
    
    if (height >= 5) { // Ensure min height (Default 5px)

        // Change offset for top zones
        if (zone == 2) {
            let newOffset = offsetTop - mouseDrag; 
            if (newOffset < 0) { return; } // Ensure max width for left zones
            parent.style.top = newOffset + 'px';
        }
        
        element.style.height = height + 'px';
        parent.style.gridTemplateRows = '3px ' + height + 'px 3px';
    }
}

// WINDOW.onresize - WINDOW.onload ----------------------------------------

/**
 * Ensure window resize and window load without errors.
 */
window.onresize = resizeOnWindowChange;
window.onload = resizeOnWindowChange;

/**
 * Avoid losing resizable elements outside the window when the window is resized
 */
function resizeOnWindowChange() {
    let parents = document.getElementsByClassName('parentResize');
    for (let i = 0, len = parents.length; i < len; i++) { 

        let windowW = document.body.clientWidth;
        let windowH = document.body.clientHeight;

        let element = parents[i].firstElementChild;
        let parent = parents[i];

        // Width adjustments
        let leftOffset = parent.offsetLeft;
        let parentWidth = parseInt(element.style.width.slice(0, -2)) + 6; // Default resize point width 3px
        if (leftOffset + parentWidth > windowW) {
            
            let width = windowW - leftOffset - 6;
            // Ensure min width. (Default 5px)
            if (width >= 5) {
                parent.style.gridTemplateColumns = '3px ' + width + 'px 3px';
                element.style.width = width + 'px';
            }
            else {
                let newOffset = windowW - 5 - 6;
                parent.style.left = newOffset + 'px';
            }
        }
        // Height adjustments
        let offsetTop = parent.offsetTop;
        let parentHeight = parseInt(element.style.height.slice(0, -2)) + 6;
        if (offsetTop + parentHeight > windowH) {

            let height = windowH - offsetTop - 6;
            // Ensure min height. (Default 5px)
            if (height >= 5) {
                parent.style.gridTemplateRows = '3px ' + height + 'px 3px';
                element.style.height = height + 'px';
            }
            else {
                let newOffset = windowH - 5 - 6;
                if (newOffset >= 0) {
                    parent.style.top = newOffset + 'px';
                } 
            }
        }
    }
}
