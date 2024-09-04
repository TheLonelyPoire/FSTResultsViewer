import * as THREE from 'three';
import { getSheetData } from './getSheetData.js';
import { FSTViewerScene } from './scene.js';

const LMB = 0;
const MMB = 1;
const RMB = 2;

const DRAG_DELTA_THRESHOLD_SQ = 20;

const selectedCubeMaterial = new THREE.MeshBasicMaterial({color : 0xffff30,
    transparent : false});   

export class InputManager {
    
    #fstScene;
    
    #camera;
    #cameraControls;

    #renderer;

    #mouseDownEvents;
    #mouseDownPositions;
    #mouseDownObjects;

    #keyDownEvents;

    #selectedCube;
    #oldSelectedMaterial;

    constructor(fstScene, camera, cameraControls, renderer){
        this.#fstScene = fstScene;
        
        this.#camera = camera;
        this.#cameraControls = cameraControls;

        this.#renderer = renderer;

        this.#mouseDownEvents = {};
        this.#mouseDownPositions = {};
        this.#mouseDownObjects = {};

        this.#keyDownEvents = {};

        this.#selectedCube = null;
        this.#oldSelectedMaterial = null;

        window.addEventListener("pointerdown", (event) => { this.pointerDown(event); });
        window.addEventListener("pointerup", (event) => { this.pointerUp(event); });

        window.addEventListener("keydown", (event) => { this.keyDown(event); });
        window.addEventListener("keyup", (event) => { this.keyUp(event); });
    }

    #getActiveLayer() {
        return document.getElementById("platformDropdown").value == "pyra" ? 
                FSTViewerScene.PYRA_LAYER : FSTViewerScene.MYTHRA_LAYER;
    }

    #getFirstHoveredCube(pointer, camera){
        // Raycast into scene
        const intersects = this.#fstScene.raycastBlocks(pointer, 
                                                        camera,
                                                        this.#getActiveLayer());

        if(intersects.length == 0) {
            return;
        }

        // Discard invalid intersections using "clickable" property
        while(intersects.length > 0) {
            // Get closest intersection
            const closestIntersection = intersects.shift();

            const obj = closestIntersection.object;

            // Skip any non-objects
            if(!(obj instanceof THREE.Object3D)) {  
                continue;
            }

            // Skip any line objects if clickLines argument is false
            if(obj instanceof THREE.Line) {
                continue;
            }

            // Skip any invisible objects
            if(!obj.visible || (obj.parent != null && !obj.parent.visible)) {
                continue;
            }
            
            return closestIntersection.object;
        }  

    }

    #getNoramlizedMousePosition(mousePos) {
        const rect = this.#renderer.domElement.getBoundingClientRect();

        const mouseViewX = (mousePos.x - rect.left) / rect.width * 2 - 1;
        const mouseViewY = -(mousePos.y - rect.top) / rect.height * 2 + 1;

        return new THREE.Vector2(mouseViewX, mouseViewY);
    }

    #clearMouseEvent(mouseButton) {
        delete this.#mouseDownEvents[mouseButton];
        delete this.#mouseDownPositions[mouseButton];
        delete this.#mouseDownObjects[mouseButton];
    }

    #setRunInfoFields(object) {
        const runInfoXRangeLabel = document.getElementById("runInfoXRange");
        const runInfoYRangeLabel = document.getElementById("runInfoYRange");
        const runInfoXZSumRangeLabel = document.getElementById("runInfoXZSumRange");

        const runInfoPlatformLabel = document.getElementById("runInfoPlatform");

        const runInfoNameLabel = document.getElementById("runInfoName");
        const runInfoDateLabel = document.getElementById("runInfoDate");

        const runInfoCompletedLabel = document.getElementById("runInfoCompleted");
        const runInfoSolutionsLabel = document.getElementById("runInfoSolutions");
        const runInfoWarningsLabel = document.getElementById("runInfoWarnings");
        const runInfoStageLabel = document.getElementById("runInfoStage");
        const runInfoRowHyperlink = document.getElementById("runInfoRowHyperlink");


        runInfoXRangeLabel.textContent = "(" + object.userData["xMin"].toFixed(2) + " to "
                                            + object.userData["xMax"].toFixed(2) + ")";
        runInfoYRangeLabel.textContent = "(" + object.userData["yMin"].toFixed(2) + " to "
                                            + object.userData["yMax"].toFixed(2) + ")";
        runInfoXZSumRangeLabel.textContent = "(" + object.userData["xzMin"].toFixed(2) + " to "
                                                + object.userData["xzMax"].toFixed(2) + ")";

        runInfoPlatformLabel.textContent = object.userData["platform"];

        runInfoNameLabel.textContent = object.userData["name"];
        runInfoDateLabel.textContent = object.userData["date"];

        runInfoCompletedLabel.textContent = object.userData["completed"];
        runInfoSolutionsLabel.textContent = object.userData["solutions"];
        runInfoWarningsLabel.textContent = object.userData["warnings"];
        runInfoStageLabel.textContent = object.userData["stage"];
        runInfoRowHyperlink.href = object.userData["rowHyperlink"];
    }

    pointerDown(pointerEvent) {
        // Get the run info element
        const settingsWindow = document.getElementById('userSettingsContainer');
        
        // Check if the run info element is active AND
        // if the click is within the run info element
        if (settingsWindow.contains(pointerEvent.target)) {
            return; // Exit the function to prevent further processing
        }
        
        // Get the run info element
        const runInfoWindow = document.getElementById('runInfoWindow');

        // Check if the run info element is active AND
        // if the click is within the run info element
        if (runInfoWindow.className != 'hidden' &&
            runInfoWindow.contains(pointerEvent.target)) {
            return; // Exit the function to prevent further processing
        }

        // Get relevant mouse event details
        const mousePos = new THREE.Vector2(pointerEvent.clientX, pointerEvent.clientY);
        const mouseButton = pointerEvent.button;

        // Normalize mouse position
        const normMousePos = this.#getNoramlizedMousePosition(mousePos);

        // Get hovered cube
        const cube = this.#getFirstHoveredCube(normMousePos, this.#camera);

        // Update state variables
        this.#mouseDownEvents[mouseButton] = pointerEvent;
        this.#mouseDownPositions[mouseButton] = mousePos;
        this.#mouseDownObjects[mouseButton] = cube;
    }

    pointerUp(pointerEvent) {
        // Get the run info element
        const settingsWindow = document.getElementById('userSettingsContainer');

        // Check if the run info element is active AND
        // if the click is within the run info element
        if (settingsWindow.contains(pointerEvent.target)) {
            return; // Exit the function to prevent further processing
        }

        // Get the run info element
        const runInfoWindow = document.getElementById('runInfoWindow');
        
        // Check if the run info element is active AND
        // if the click is within the run info element
        if (runInfoWindow.className != 'hidden' &&
            runInfoWindow.contains(pointerEvent.target)) {
            this.#clearMouseEvent(mouseButton);
            return; // Exit the function to prevent further processing
        }

        // Get relevant mouse event details
        const mousePos = new THREE.Vector2(pointerEvent.clientX, pointerEvent.clientY);
        const mouseButton = pointerEvent.button;

        // Get the mouse down event corresponding to this mouse-up event
        const mouseDownEvent = this.#mouseDownEvents[mouseButton];

        // Compute mouse displacement
        const mouseDelta = new THREE.Vector2(mousePos.x - mouseDownEvent.clientX,
                                            mousePos.y - mouseDownEvent.clientY);

        // Normalize mouse position
        const normMousePos = this.#getNoramlizedMousePosition(mousePos);

        // Get hovered cube
        const cube = this.#getFirstHoveredCube(normMousePos, this.#camera);

        switch(mouseButton){
            case LMB:
                if(mouseDelta.lengthSq() >= DRAG_DELTA_THRESHOLD_SQ) {
                    this.#clearMouseEvent();
                    return;
                }
                
                if(cube == null ||
                    cube != this.#mouseDownObjects[mouseButton]) 
                {
                    document.getElementById("runInfoWindow").className = "hidden";

                    if(this.#selectedCube != null) {
                        this.#selectedCube.material = this.#oldSelectedMaterial;
                        this.#selectedCube = null;
                    }

                    this.#clearMouseEvent();
                    return;
                }

                if(this.#selectedCube != null && this.#selectedCube != cube) {
                    this.#selectedCube.material = this.#oldSelectedMaterial;
                }

                if(this.#selectedCube != cube) {
                    this.#oldSelectedMaterial = cube.material;
                }

                this.#setRunInfoFields(cube);
                document.getElementById("runInfoWindow").className = "run-info-window";

                cube.material = selectedCubeMaterial;
                this.#selectedCube = cube;
                
                break;   
        }

        // Update state variables
        this.#clearMouseEvent(mouseButton);
    }

    keyDown(keyEvent) {
        const key = keyEvent.key.toLowerCase();

        // Update state variable
        this.#keyDownEvents[key] = keyEvent;
    }

    keyUp(keyEvent) {
        const key = keyEvent.key.toLowerCase();
        let target, disp, newDisp;

        switch(key){
            // Transform Shortcuts
            case "h":
                const settingsMenu = document.getElementById("userSettingsContainer");
                if(settingsMenu.className != "hidden") {
                    settingsMenu.className = "hidden";
                    settingsMenu.disabled = true;
                    console.log("Settings Hidden! Press H to Unhide!");
                }
                else {
                    settingsMenu.className = "user-settings-menu";
                    settingsMenu.disabled = false;
                }
                break;

            case "p":
                const platformDropdown = document.getElementById("platformDropdown");

                if(platformDropdown.value == "pyra") {
                    platformDropdown.value = "mythra";
                    this.#camera.layers.enable(FSTViewerScene.MYTHRA_LAYER);
                    this.#camera.layers.disable(FSTViewerScene.PYRA_LAYER);
                    
                }
                else {
                    platformDropdown.value = "pyra";
                    this.#camera.layers.enable(FSTViewerScene.PYRA_LAYER);
                    this.#camera.layers.disable(FSTViewerScene.MYTHRA_LAYER);
                }

                break;
            
            case "r":
                getSheetData({
                    sheetID: "1EGJgRTOo6Hph2YJcyH14hHgj72eQYHEj-r-8sAJQ3GM",
                    sheetName: "FST Normal Search Ranges",
                    query: "SELECT * WHERE J != ''",
                    callback: (sheetData) => { this.#fstScene.setData(sheetData); },
                });
                console.log("Sheet data refreshed!");
                break;

            case "1":
                target = new THREE.Vector3().copy(this.#cameraControls.target);
                disp = new THREE.Vector3().subVectors(target, this.#camera.position);

                newDisp = new THREE.Vector3(0, disp.length(), 0);
                this.#camera.position.copy(new THREE.Vector3().addVectors(target, newDisp));
                this.#camera.lookAt(target);
                break;

            case "2":
                target = new THREE.Vector3().copy(this.#cameraControls.target);
                disp = new THREE.Vector3().subVectors(target, this.#camera.position);

                newDisp = new THREE.Vector3(disp.length(), 0, 0);
                this.#camera.position.copy(new THREE.Vector3().addVectors(target, newDisp));
                this.#camera.lookAt(target);
                break;

            case "3":
                target = new THREE.Vector3().copy(this.#cameraControls.target);
                disp = new THREE.Vector3().subVectors(target, this.#camera.position);

                newDisp = new THREE.Vector3(0, 0, disp.length());
                this.#camera.position.copy(new THREE.Vector3().addVectors(target, newDisp));
                this.#camera.lookAt(target);
                break;

            case "4":
                target = new THREE.Vector3().copy(this.#cameraControls.target);
                disp = new THREE.Vector3().subVectors(target, this.#camera.position);

                newDisp = new THREE.Vector3(0, -disp.length(), 0);
                this.#camera.position.copy(new THREE.Vector3().addVectors(target, newDisp));
                this.#camera.lookAt(target);
                break;

            case "5":
                target = new THREE.Vector3().copy(this.#cameraControls.target);
                disp = new THREE.Vector3().subVectors(target, this.#camera.position);

                newDisp = new THREE.Vector3(-disp.length(), 0, 0);
                this.#camera.position.copy(new THREE.Vector3().addVectors(target, newDisp));
                this.#camera.lookAt(target);
                break;

            case "6":
                target = new THREE.Vector3().copy(this.#cameraControls.target);
                disp = new THREE.Vector3().subVectors(target, this.#camera.position);

                newDisp = new THREE.Vector3(0, 0, -disp.length());
                this.#camera.position.copy(new THREE.Vector3().addVectors(target, newDisp));
                this.#camera.lookAt(target);
                break;

            case " ":
                this.#fstScene.printScene();
                console.log(this.#renderer.info);
                break;

            default:
                console.log("\'" + key + "\' Pressed!");
                break;
        }
        
        // Update state variable
        delete this.#keyDownEvents[key];
    }
}