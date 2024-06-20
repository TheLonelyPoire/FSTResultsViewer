// Some of the contents of this file were copied from the link below (credit to theotrain):
// https://github.com/theotrain/load-google-sheet-data-using-sql/blob/main/script.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { getSheetData } from './getSheetData.js';
import { FSTViewerScene } from './scene.js';

const fstScene = new FSTViewerScene();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color(0x202030));
renderer.domElement.className = "render-canvas";
document.getElementById("renderContainer").appendChild(renderer.domElement);

const aspect = window.innerWidth / window.innerHeight;

const camera = new THREE.PerspectiveCamera(45, aspect, 0.0001, 10);
camera.position.set(0.35, 1.0, 0.7);
camera.lookAt(new THREE.Vector3(0.2,0.85,0.55));

const camControls = new OrbitControls(camera, renderer.domElement);
camControls.target = new THREE.Vector3(0.2,0.85,0.55);
camControls.update();

function assignedBlockDataHandler(sheetData) {
    console.log("sheet data: ", sheetData);
    fstScene.setData(sheetData);
};

function init(){
    window.addEventListener("DOMContentLoaded", (event) => {  
        getSheetData({
            sheetID: "1RULqmC9ECUHwaoG7hmXnXoaD7qr0p1IaVug1ITZsc9w",
            sheetName: "Sheet2",
            query: "SELECT * WHERE D != '' AND D != 'Assigned'",
            callback: assignedBlockDataHandler,
        });
    });

    window.addEventListener("resize", () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    window.addEventListener("keydown", (event) => {
        if(event.key == " ") {
            fstScene.printScene();
        }

        if(event.key == "r") {
            getSheetData({
                sheetID: "1RULqmC9ECUHwaoG7hmXnXoaD7qr0p1IaVug1ITZsc9w",
                sheetName: "Sheet2",
                query: "SELECT * WHERE D != '' AND D != 'Assigned'",
                callback: assignedBlockDataHandler,
            });
        }
    })
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