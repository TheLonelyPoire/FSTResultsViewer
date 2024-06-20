import * as THREE from "three";

const zoneSize = 0.01;
const eps = 0.0001;
const cubeSize = zoneSize - eps;

const assignedCubeGeo = new THREE.BoxGeometry(cubeSize,cubeSize,cubeSize,1,1,1);
const assignedCubeMaterial = new THREE.MeshBasicMaterial({color : 0xa01010,
                                                            transparent : true,
                                                            opacity : 0.8});
const completedCubeMaterial = new THREE.MeshBasicMaterial({color : 0x20e020,
                                                            transparent : true,
                                                            opacity : 0.8});

const gridMaterial = new THREE.LineBasicMaterial({color : 0xffffff,
                                                transparent : true,
                                                opacity : 0.2});

export class FSTViewerScene {
    #scene;

    #data;

    #grid;
    #axes;

    #minViewX;
    #maxViewX;
    #minViewY;
    #maxViewY;
    #minViewXZ;
    #maxViewXZ;

    constructor(data) {
        this.#scene = new THREE.Scene();

        this.#data = data;
        
        this.#axes = new THREE.AxesHelper(1);
        this.#axes.setColors(new THREE.Color(0xff0000),
                                new THREE.Color(0x00ff00),
                                new THREE.Color(0xff00ff),);
        this.#scene.add(this.#axes);

        this.#minViewX = 0.15;
        this.#maxViewX = 0.25;
        this.#minViewY = 0.8;
        this.#maxViewY = 0.9;
        this.#minViewXZ = 0.5;
        this.#maxViewXZ = 0.6;

        this.generateGrid();
    }

    setData(data) {
        this.#data = data;
        this.generateGrid();
        this.generateBlocks();
    }

    generateGrid() {
        this.#grid = new THREE.Group();

        const step = 0.01;

        const linePoints = [];

        const halfStep = step/2;

        // X Lines
        for(let y = this.#minViewY; y <= this.#maxViewY + halfStep; y+=step){
            for(let xz = this.#minViewXZ; xz <= this.#maxViewXZ + halfStep; xz+=step) {
                linePoints.push(new THREE.Vector3(this.#minViewX, y, xz));
                linePoints.push(new THREE.Vector3(this.#maxViewX, y, xz));
            }
        }

        // Y Lines
        for(let x = this.#minViewX; x <= this.#maxViewX + halfStep; x+=step){
            for(let xz = this.#minViewXZ; xz <= this.#maxViewXZ + halfStep; xz+=step) {
                linePoints.push(new THREE.Vector3(x, this.#minViewY, xz));
                linePoints.push(new THREE.Vector3(x, this.#maxViewY, xz));
            }
        }

        // XZ Lines
        for(let x = this.#minViewX; x <= this.#maxViewX + halfStep; x+=step){
            for(let y = this.#minViewY; y <= this.#maxViewY + halfStep; y+=step) {
                linePoints.push(new THREE.Vector3(x, y, this.#minViewXZ));
                linePoints.push(new THREE.Vector3(x, y, this.#maxViewXZ));
            }
        }

        const gridGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
        this.#grid = new THREE.LineSegments(gridGeom, gridMaterial);
        this.#scene.add(this.#grid);

        this.#axes.position.set(this.#minViewX - 2*step, 
                                this.#minViewY - 2*step, 
                                this.#minViewXZ - 2*step);
    }

    generateBlocks(){
        this.#scene.clear();

        this.#scene.add(this.#grid);
        this.#scene.add(this.#axes);

        this.#data.forEach(row => {
            const xC = parseFloat(row["Block Min X"]) + zoneSize / 2;
            const yC = parseFloat(row["Block Min Y"]) + zoneSize / 2;
            const xzC = parseFloat(row["Block Min XZSum"]) + zoneSize / 2;

            if(this.#minViewX <= xC && this.#maxViewX >= xC && 
                this.#minViewY <= yC && this.#maxViewY >= yC && 
                this.#minViewXZ <= xzC && this.#maxViewXZ >= xzC) 
            {
                const mat = row["Completed"] != "" ? completedCubeMaterial : assignedCubeMaterial;
                const assignedBlockMesh = new THREE.Mesh(assignedCubeGeo, mat);
                assignedBlockMesh.position.set(xC,yC,xzC);

                this.#scene.add(assignedBlockMesh);
            }
        });
    }

    printScene() {
        console.log(this.#scene);
    }

    renderScene(renderer, camera) {
        renderer.render(this.#scene, camera);
    }
}