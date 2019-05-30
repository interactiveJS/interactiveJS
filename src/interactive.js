/**
 * Make an element interactive.
 * Drag, resize, minimize, maximize, close interactions.
 * 
 * @param {String}  id - Id of the element we're making interactive
 * @param {Object}  config
 */
function interactive(id, config) {

    let element = document.getElementById(id);
    element.classList.add('interactive');
    element.style.zIndex = 'inherit';

    if (config === undefined) { // Default config
        resizable(element);
        draggable(element);
        close(element);
        minMax(element);
    }
    else { // Custom config
        
        if (config.resize !== false) {
            resizable(element);
        }
        if (config.drag !== false) {
            draggable(element);
        }
        if (config.close !== false) {
            close(element);
        }
        if (config.minMax !== false) {
            minMax(element, config.minZone, config.minMaxIcons, config.minDoubleClick);
        }
    }

    element.onmousedown = changeStackOrder;
}

// RESIZABLE ELEMENT ------------------------------------------------------

/**
 * Make an element resizable.
 * Use of left mouse down + drag to resize element.
 * 
 * @param {HTMLelement} element
 */
function resizable(element) {
    
    element.classList.add('resizable');

    /* 
       Add a parent that will contain the element and its resize points
       The resize parent element must have as parent the actual element parent.
       e.g body > element ---> body > parent > element
    */
    let resizeParent = createElementWithIdAndClassName('div', 'parent_' + element.id, 'parentResize');
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

        let div = createElementWithClassName('div', resizePoints[i]);
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
            trackMouseDragPlusAction({
                action: 'resize',
                param: [element, parent, resizePoint.className]
            });
        }
    };
}

/**
 * Change a resizable element size and position accordingly to a resize event
 * 
 * @param {HTMLelement} element
 * @param {HTMLelement} parent
 * @param {String} resizePoint
 * @param {Object} mouseDrag - Total drag movement (mouseDrag.x, mouseDrag.y)
 */
function changeElementSizeAndPosition(element, parent, resizePoint, mouseDrag) {
    
    // Get the zone where the resize point lives
    let zone = getResizePointZone(resizePoint);

    // Change Measures
    changeHorizontalMeasures(element, parent, mouseDrag.x, zone[0]);
    changeVerticalMeasures(element, parent, mouseDrag.y, zone[1]);
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

// DRAGGABLE ELEMENT ------------------------------------------------------

/**
 * Make an element draggable.
 * Use of left mouse down + drag to drag elements.
 *
 * @param {HTMLelement} element
 */
function draggable(element) {

    element.classList.add('draggable');

    // Add header. Will be used as the drag point.
    let dragPoint = createElementWithIdAndClassName('div', element.id + 'Header', 'dragPoint');
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
            trackMouseDragPlusAction({
                action: 'drag',
                param: [element]
            });
        }
    };  
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

/**
 * Use the mouse drag information provided by trackMouseDragPlusAction() to perform an action
 * 
 * @param {Object} action 
 * @param {String} action.action
 * @param {Array}  action.param
 * @param {Object} mouseDrag
 */
function dragAction(action, mouseDrag) {
    if (action.action == 'resize') {
        changeElementSizeAndPosition(action.param[0], action.param[1], action.param[2], mouseDrag);
    }
    if (action.action == 'drag') {
        // Prevent dragging elements outside the screen
        let newPosition = getDragNewPosition(action.param[0], mouseDrag);
        // New position
        action.param[0].style.left = newPosition.x + "px";
        action.param[0].style.top = newPosition.y + "px";
    }
}

// MIN MAX CLOSE FUNCTIONALITY --------------------------------------------

/**
 * Add Close functionality to an element
 * 
 * @param {HTMLelement} element 
 * @param {Boolean} icon 
 */
function close(element) {
    // Add close button
    let svgPath = [ { name: 'close', path: 'M45.1,41.6l-3.3,3.3L5.1,8.2l3.3-3.3L45.1,41.6z M8.4,45.1l-3.3-3.3L41.8,5.1l3.3,3.3L8.4,45.1z'} ];
    addFunctionButton(element, svgPath);

    // Add close functionality
    addCloseFunctionality(element);
}

/**
 * Add the close functionality to the close icon
 * 
 * @param {HTMLElement} element 
 */
function addCloseFunctionality(element) {

    closeBtn = getButton(element, 'closeBtn');
    // Ensure compatilibily with resizable elements
    closeBtn.onclick = function() {
        let parent = element.parentNode;
        if (element.classList.contains('resizable')) {
            parent.parentNode.removeChild(parent);
        }
        else {
            parent.removeChild(element);
        }
    };
}

/**
 * Add minimize and mazimize functionality to an element
 * 
 * @param {HTMLelement} element 
 * @param {Boolean} icons 
 * @param {Boolean} dblClick 
 */
function minMax(element, minZone, icons, dblClick){

    // Add minimize and maximize buttons
    if (icons !== false) {
        let svgPath = [ { name: 'max', path: 'M27.3,45h-4.7V5h4.7V45z M5,27.3v-4.6H45v4.6H5z'},
                        { name: 'min', path: 'M5,27.3v-4.6H45v4.6H5z'} ];
        addFunctionButton(element, svgPath);
    }
    // Add minimize functionality
    addMinimizeFunction(element, minZone, icons, dblClick);
    // Maximize function (screen size)
    addFullScreenMaximizeFunction(element);
}

/**
 * Add the buttons and icons for a minMax or close function to work
 * 
 * @param {HTMLelement} element 
 * @param {Array} svgPath 
 */
function addFunctionButton(element, svgPath) {

    // Ensure compatibility with draggable elements
    let className = 'path';
    if (element.classList.contains('draggable')) {
        element = element.firstElementChild;
        className = 'dragPath';
    }

    let container = createButtonsContainer(element);

    for (let i = 0, len = svgPath.length; i < len; i++) {

        let div = createElementWithClassName('button', svgPath[i].name + 'Btn mmcBtn');
        let svg = createSvgShape({
            svg: [{ attr: 'class', value: 'svgIcon'}, { attr: 'viewBox', value: '0 0 50 50'}],
            shape: [{
                shape: 'path',
                attrList: [
                    { attr: 'd', value: svgPath[i].path },
                    { attr: 'class', value: className}
                ]
            }]
        });

        div.appendChild(svg);
        container.appendChild(div);
    }

    // Ensure buttons are the first element child
    let firstElement = element.firstChild;
    if (firstElement != null) {
        element.insertBefore(container, firstElement);
    }
    else {
        element.appendChild(container);
    }
}

/**
 * Create min, max and close buttons contianer
 * 
 * @returns {HTMLelement} container
 */
function createButtonsContainer(element) {
    
    let container = element.firstElementChild;
    
    if (container === null || container.className !== 'btnContainer') {
        container = createElementWithClassName('div', 'btnContainer');
    }

    return container;
}

/**
 * Add minimize functionality on double click and/or click to an element.
 * 
 * @param {HTMLElement} element 
 * @param {HTMLelement} minZone
 * @param {boolean} icons
 * @param {boolean} doubleClick
 */
function addMinimizeFunction(element, minZone, icons, doubleClick) {

    // Add minimize area
    addMinimizeArea(minZone);

    // Minimize on double click
    if (doubleClick !== false) {
        // Invalidate dblclick on draggable elements, use instead dblclick on element header to minimize. 
        if (element.classList.contains('draggable')) {
            element = element.firstElementChild;
        }
        element.ondblclick = minimize;
    }
    // Minimize on minimize icon click
    if (icons !== false) {
        let minBtn = getButton(element, 'minBtn');
        minBtn.onclick = minimize;
    }
}

/**
 * Adds to an specific element, the zone where the minimized elements will live.
 * The minimize zone will be appended to the body by default.
 * 
 * @param {HTMLelement} minZone
 */
function addMinimizeArea(minZone) {
    if (document.getElementById('minimizeZone') == null) {

        let minArea = document.createElement('div');
        minArea.id = 'minimizeZone';

        if (minZone == undefined) {
            document.body.append(minArea);
        }
        else {
            minZone.append(minArea);
        }
    }
}

/**
 * Minimize element
 */
function minimize() {

    // Store information of the minimized element.
    let element;
    if (event.type == 'dblclick') {
        element = storeMinimizedElement(this);
    }
    if (event.type == 'click') {
        element = storeMinimizedElement(this.parentNode.parentNode);
    }
    
    // Avoid errors by duplicated items caused by event bubbling
    if (deleteDuplicatedItemsMinStorage()) { return; }
    
    // UI adjustments
    minimizeUI(element);
}

/**
 * Keep track of the minimized items and its information.
 * Ensure compatibility with resizable and draggable elements,
 * by returning the element needed for the ui changes.
 * 
 * @param {HTMLelement} element
 * @returns HTML element UI changes
 */
let minStorage = [];
function storeMinimizedElement(element) {

    let template = {
        id: element.id,
        title: element.getAttribute('name')
    };

    // Ensure compatibility
    if (element.classList.contains('resizable')) {
        element = element.parentNode;
    }
    if (element.classList.contains('dragPoint')) {
        element = element.parentNode; // Template compatibility
        template.id = element.id;
        template.title = element.getAttribute('name');

        if (element.classList.contains('resizable')) {
            element = element.parentNode; // UI compatiblity
        }
    }

    minStorage.push(template);

    return element;
}

/**
 * Delete duplicated items inside minStorage caused by event bubbling
 * 
 * @returns {boolean} True if there was a duplicated items else False
 */
let count;
function deleteDuplicatedItemsMinStorage() {
    count = minStorage.length - 1;
    if (count > 0) {
        if (minStorage[count - 1].id == minStorage[count].id) {
            minStorage.pop();
            return true;
        }
    }
    return false;
}

/**
 * Get the number of items needed to fit an element according to the item and element width
 * 
 * @param {HTMLElement} item 
 * @param {HTMLElement} element 
 * @returns Integer - Number of items
 */
let elementWidth;
function getItemCountToFitElementByWidth(item, element) {
    
    if (item != null) {
        let minAreaWidth = element.clientWidth;

        let style = window.getComputedStyle(item);
        let width = parseInt(style.getPropertyValue('width').slice(0, -2));
        let marginLeft = parseInt(style.getPropertyValue('margin-left').slice(0, -2));
        let marginRight = parseInt(style.getPropertyValue('margin-right').slice(0, -2));
        elementWidth = width + marginLeft + marginRight;

        return Math.floor(minAreaWidth / elementWidth);
    }
    
    return undefined;
}

/**
 * Create the horizontal minimized representation for a element
 * 
 * @param {String} id
 * @param {String} title 
 * @returns Minimized representation element
 */
function createMinimizedElementRep(id, title) {
    let element = createElementWithIdAndClassName('span', id, 'minimizedItem');
    let p = createElementWithClassName('p', 'minimizedTitle');
    p.textContent = title;
    p.setAttribute('onselectstart', 'return false;');

    element.appendChild(p);

    return element;
}

/**
 * User Interface adjustments for minimizable elements
 * 
 * @param {HTMLelement} element 
 */
let dropdown, numItems;
function minimizeUI(element) {
    
    let minimizeArea = document.getElementById('minimizeZone');

    if (dropdown === undefined) {
        
        // No. of minimized elements that fit on the minimizeArea
        numItems = getItemCountToFitElementByWidth(minimizeArea.firstElementChild, minimizeArea);
        
        if (minStorage.length > numItems) {
            // Deal with minimizeArea overflow
            horizontalRepToDropdownList(numItems, minimizeArea);
            dropdown = true;
        }
        else {
            // Create the HTML representation of a minimized element
            let minRep = createMinimizedElementRep('' + count, minStorage[count].title);
            minimizeArea.appendChild(minRep);
            // Add maximize function to representation
            minRep.onclick = maximize;
        }
    }
    else if (dropdown === true) {

        // Add minimized item to the dropdown
        let ddList = document.getElementById('dropdownList');
        addDropdownItem('' + count, minStorage[count].title, ddList);
    }

    // Hide original element
    element.style.display = 'none';
}

/** 
 * Maximize element 
 */
function maximize() {

    // Delete representation
    this.parentNode.removeChild(this);

    // Display maximized element. Ensure compatibility with resizable and dragabble elements
    let index = parseInt(this.id);
    let element = document.getElementById(minStorage[index].id);
    if (element.classList.contains('resizable')) {
        element.parentElement.style.display = 'grid';
    }
    else {
        element.style.display = 'block';
    }

    // Empty index on minimizedStorage
    minStorage[index] = '';

    // Change from dropdownList to horizontal minimized representations
    if (dropdown === true) {
        let ddList = document.getElementById('dropdownList');
        if (ddList.childElementCount <= numItems) {
            fromDropdownToHorizontalMinimized(ddList);
        }
    }

    // Update minStorage 
    if (dropdown === undefined) {
        let minArea = document.getElementById('minimizeZone');
        if(minArea.childElementCount == 0) { // When there are no more minimized items
            minStorage.length = 0;
        }
        else {
            // Update min elements
            let children = minArea.childNodes;
            for (let i = 0, len = children.length; i < len; i++) {
                children[i].id = i;
            }
            // Update minStorage
            for (let j = 0, len = minStorage.length; j < len; j++) {
                if (minStorage[len - 1 - j] == '') {
                    minStorage.splice(len - 1 - j, 1);
                }
            }
        }
    }
}

/**
 * Create a dropdown list to store all the minimized items representations.
 * 
 * @param {Integer} count 
 * @param {HTMLElement} ofArea
 */
function horizontalRepToDropdownList(count, ofArea) {
    
    //Delete minimized representations
    deleteMinimizedItems(count, ofArea);
    // Add dropdown
    let dropdown = addDropdown(ofArea);
    // Add dropdown items 
    addDropdownItems(minStorage, dropdown);
}

/**
 * Change the representation of minimized elements from dropdown list to horizontal minimized representations
 * 
 * @param {HTMLelement} ddList
 */
function fromDropdownToHorizontalMinimized(ddList) {
    // Delete dropdown lsit and button
    let btn = ddList.previousSibling;
    let parent = ddList.parentElement;
    parent.removeChild(btn);
    parent.removeChild(ddList);

    dropdown = undefined;

    // Update minStorage
    let count = 0;
    for (let i = 0, len = minStorage.length; i < len; i++) {
        if (minStorage[i] != '') {
            minStorage[count] = {id:  minStorage[i].id, title: minStorage[i].title};
            count++;
        }
    }
    minStorage.length = count;

    // Create horizontal representations
    minimizeArea = document.getElementById('minimizeZone');
    for (let j = 0, len = minStorage.length; j < len; j++) {
        let rep = createMinimizedElementRep('' + j, minStorage[j].title);
        minimizeArea.appendChild(rep);
        // Add maximize functionality
        rep.onclick = maximize;
    }
}

/**
 * Delete # of child items from a parent.
 * Child items to delete must have as id increasing integers starting from 0
 * Items will be deleted from ids 0 to the count value
 * 
 * @param {count} count 
 * @param {HTMLElement} parent 
 */
function deleteMinimizedItems(count, parent) {
    for (let i = 0; i < count; i++) {
        let element = document.getElementById('' + i);
        parent.removeChild(element);
    }
}

/**
 * Append a dropdown to an element
 * 
 * @param {HTMLelement} element
 * @returns HTMLelement Dropdown list
 */
function addDropdown(element) {
    let btn = createElementWithIdAndClassName('button', 'dropdownBtn', 'dropdownBtn');
    btn.innerHTML = '&#11205;';
    btn.setAttribute('onselectstart', 'return false;');

    let list = document.createElement('div');
    list.id = 'dropdownList';

    element.appendChild(btn);
    element.appendChild(list);

    btn.onclick = function() {
        if (list.style.display == 'block') {
            list.style.display = 'none';
            btn.innerHTML = '&#11205;';
        }
        else {
            list.style.display = 'block';
            btn.innerHTML = '&#11206;';
        }
    };

    return list;
}

/**
 * Add a group of items to a dropdown list
 * list = [ {id: <id>, title: <string>}, {id: <id>, title: <string>}, {...}, ...];
 * 
 * @param {Array} items
 * @param {HTMLelement} dropdown
 */
function addDropdownItems(items, dropdown) {
    for (let j = 0, len = items.length; j < len; j++){
        addDropdownItem('' + j, items[j].title, dropdown);
    }
}

/**
 * Add an individual item to a dropdown list
 * 
 * @param {String} id 
 * @param {String} title
 * @param {HTMLElement} dropdown
 */
function addDropdownItem(id, title, dropdown) {
    let newItem = createElementWithIdAndClassName('div', id, 'dropdownItem');
    newItem.textContent = title;
    newItem.setAttribute('onselectstart', 'return false;');
    dropdown.appendChild(newItem);

    // Add maximize functionality
    newItem.onclick = maximize;
}

/**
 * On maximize icon click maximize element (full body).
 * 
 * @param {HTMLelement} element 
 */
let maxStorage = {};
function addFullScreenMaximizeFunction(element) {
    
    let maxBtn =  getButton(element, 'maxBtn');
    
    if (maxBtn == undefined || maxBtn == null) {
        return;
    }
    
    maxBtn.onclick = function() {

        let index = '' + element.id;
        let isResizable;
        if (element.classList.contains('resizable')) { isResizable = true; }

        if (maxStorage[index] === undefined) {
            
            let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            let height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight; 
            
            // Maximized visualization. Ensure compatibility with resizable elements
            let newKey = element.id;
            if (isResizable) {
                let parent = element.parentNode;
                maxStorage[newKey] = {actualSize: getElementSizeAndPosition(parent)}; // Store element size info.
                
                element.style.width = '100%';
                element.style.height = '100%';

                parent.style.top = '0px';
                parent.style.left = '0px';
                parent.style.margin = '0px';
                parent.style.gridTemplateRows = '3px ' + (height - 6) + 'px 3px';
                parent.style.gridTemplateColumns = '3px ' + (width - 6) + 'px 3px'; // Default resizePoint 3px
            }
            else {
                maxStorage[newKey] = {actualSize: getElementSizeAndPosition(element)}; // Store element size info.
                
                element.style.top = '0px';
                element.style.left = '0px';
                element.style.margin = '0px';
                element.style.width = width + 'px';
                element.style.height = height + 'px';
            }
        }
        else {
            // Previous size and offset visualization.
            if (isResizable) {
                let parent = element.parentElement;
                parent.style.top = maxStorage[index].actualSize.top;
                parent.style.left = maxStorage[index].actualSize.left;
                parent.style.margin = maxStorage[index].actualSize.margin;
                parent.style.gridTemplateRows = maxStorage[index].actualSize.gridRow;
                parent.style.gridTemplateColumns = maxStorage[index].actualSize.gridCol;
            }
            else {
                element.style.top = maxStorage[index].actualSize.top;
                element.style.left = maxStorage[index].actualSize.left;
                element.style.width = maxStorage[index].actualSize.width;
                element.style.margin = maxStorage[index].actualSize.margin;
                element.style.height = maxStorage[index].actualSize.height;
            }

            // Update maxStorage
            delete maxStorage[index];
        }
    };
}

/**
 * Get the maximize button of an element
 * 
 * @param {HTMLelement} element
 * @param {String} btn - class name of the button we're looking for
 * @returns {HTMLelement} elements maxBtn
 */
function getButton(element, btn) {
    let buttons;

    // Ensure compatibility with draggable elements
    if (element.classList.contains('draggable')) {
        buttons = element.firstElementChild.firstElementChild.childNodes;
    }
    else {
        buttons = element.firstElementChild.childNodes;
    }

    for (let i = 0, len = buttons.length; i < len; i++) {
        if (buttons[i].classList.contains(btn)) {
            return buttons[i];
        }
    }
}

/**
 * Get the actual size and position of an element
 * 
 * @param {HTMLElement} element 
 * @returns Object containing the width, height, margin, top and left values
 */
function getElementSizeAndPosition(element) {
    let style = window.getComputedStyle(element);
    
    return {
        width: style.getPropertyValue('width'),
        height: style.getPropertyValue('height'),
        top: style.getPropertyValue('top'),
        left: style.getPropertyValue('left'),
        gridCol: style.getPropertyValue('grid-template-columns'),
        gridRow: style.getPropertyValue('grid-template-rows')
    };
}

// Z-INDEX FRONT ----------------------------------------------------------

/**
 * Bring element to the front
 */
function changeStackOrder() {
    let all = document.getElementsByClassName('interactive');

    for (let i = 0, len = all.length; i < len; i++) {
        if (all[i] == this) {
            if (all[i].classList.contains('resizable')) {
                all[i].parentElement.style.zIndex = 2;
            }
            else {
                all[i].style.zIndex = 2;
            }
        }
        else {
            if (all[i].classList.contains('resizable')) {
                all[i].parentElement.style.zIndex = 1;
            }
            else {
                all[i].style.zIndex = 'inherit';
            }
        }
    }
}

// WINDOW.onresize - WINDOW.onload ----------------------------------------

/**
 * Ensure window resize and window load without errors.
 */
window.onresize = onWindowResize;
window.onload = onWindowLoad;

function onWindowResize() {
    resizeOnWindowChange(); // Avoid resizable elements errors
    updateMinimizedItemsOnWindowChange(); // Avoid minimized elements display errors
}

function onWindowLoad() {
    resizeOnWindowChange(); // Avoid resizable elements errors
}


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

/**
 * Avoid minimizeZone overflow by changin the minimized elements display from horizontal to dropdown
 */
function updateMinimizedItemsOnWindowChange() {
    let minimizeArea = document.getElementById('minimizeZone');
    
    if (dropdown === undefined) {
        // No. of minimized elements that fit on the minimizeArea
        numItems = getItemCountToFitElementByWidth(minimizeArea.firstElementChild, minimizeArea);
        
        if (minStorage.length > numItems) {
            // Deal with minimizeArea overflow
            horizontalRepToDropdownList(numItems + 1, minimizeArea);
            dropdown = true;
        }
    }
    else {
        numItems = Math.floor(minimizeArea.clientWidth / elementWidth);
        if (minStorage.length <= numItems) {
            // Horizontal minimized representations
            fromDropdownToHorizontalMinimized(minimizeArea.firstElementChild.nextSibling);
            dropdown = undefined;
        }
    }
}

// HELPERS ----------------------------------------------------------------

/**
 * Create an element, assign an id and a class to it, return the HTML element
 * @param {String} tag 
 * @param {String} id 
 * @param {String} className 
 * @returns HTML element
 */
function createElementWithIdAndClassName(tag, id, className) {
    let element = document.createElement(tag);
    element.id = id;
    element.className = className;
    return element;
}

/**
 * Create an element, assign a class name to it, return the HTML element
 * @param {String} tag 
 * @param {String} className 
 * @returns HTML element
 */
function createElementWithClassName(tag, className) {
    let element = document.createElement(tag);
    element.className = className;
    return element;
}

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

/**
 * Track the mouse drag and use the information to create an action
 * 
 * @param {Object} action 
 * @param {String} action.action
 * @param {Array}  action.param
 */
function trackMouseDragPlusAction(action) {
  
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
        
        dragAction(action, mouseDrag);

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
 * Create an svg with X number of shapes. Each shape can have X number of attributes
 * object = {
 *     svg: [{ attr: 'class', value: 'className'}, { attr: 'viewBox', value; '0 0 50 50'}, ...],
 *     shape: [{ shape: 'path',
 *               attrList: [{ attr: 'd', value: 'M45.1,41.6l-3.3,3.3L5.1z' }, { attr: 'class', value 'clasName' }, ...]}, ...]
 * };
 * 
 * @param {Object} object
 * @returns HTML element containing the created shapes
 */
function createSvgShape(object) {
            
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (let h = 0, len = object.svg.length; h < len; h++) {
        svg.setAttribute(object.svg[h].attr, object.svg[h].value);
    }

    for (let i = 0, len = object.shape.length; i < len; i++) {
        let shape = document.createElementNS('http://www.w3.org/2000/svg', object.shape[i].shape);
        for (let j = 0, len = object.shape[i].attrList.length; j < len; j++) {
            shape.setAttribute(object.shape[i].attrList[j].attr, object.shape[i].attrList[j].value);
        }
        svg.appendChild(shape);
    }
    
    return svg;
}
