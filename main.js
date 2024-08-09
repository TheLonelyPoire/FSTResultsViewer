// Some of the contents of this file were copied from the link below (credit to theotrain):
// https://github.com/theotrain/load-google-sheet-data-using-sql/blob/main/script.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { getSheetData } from './getSheetData.js';
import { InputManager } from './input.js';
import { FSTViewerScene } from './scene.js';
import { initSettings } from './settings.js';


const sheetID = "1EGJgRTOo6Hph2YJcyH14hHgj72eQYHEj-r-8sAJQ3GM";
const sheetName = "FST Normal Search Ranges"


// Set up renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color(0x202030));
renderer.domElement.className = "render-canvas";
document.getElementById("renderContainer").appendChild(renderer.domElement);

// Set up camera
const aspect = window.innerWidth / window.innerHeight;
const cameraStartWidth = 10;

const camera = new THREE.OrthographicCamera(-cameraStartWidth, cameraStartWidth, 
                                            cameraStartWidth/aspect, -cameraStartWidth/aspect, 
                                            0.0001, 1000);
camera.position.set(10, 5, 5);
camera.lookAt(new THREE.Vector3(0,1.5,0));

const camControls = new OrbitControls(camera, renderer.domElement);
camControls.target = new THREE.Vector3(0,1.5,0);
camControls.update();

const fstScene = new FSTViewerScene();
const inputManager = new InputManager(fstScene, camera, camControls, renderer);

function init(){
    initSettings(fstScene, camera);

    window.addEventListener("DOMContentLoaded", (event) => {  
        getSheetData({
            sheetID: "1EGJgRTOo6Hph2YJcyH14hHgj72eQYHEj-r-8sAJQ3GM",
            sheetName: "FST Normal Search Ranges",
            query: "SELECT * WHERE J != ''",
            callback: (sheetData) => { fstScene.setData(sheetData); },
        });
    });

    window.addEventListener("resize", () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        const aspect = window.innerWidth / window.innerHeight;
        const width = camera.right - camera.left;
        camera.top = width / aspect / 2;
        camera.bottom = -width / aspect / 2;
        camera.updateProjectionMatrix();
    });
}

function render() {
    fstScene.renderScene(renderer, camera);
}

function animate() {
	render();

	requestAnimationFrame( animate );
}

init();
animate();