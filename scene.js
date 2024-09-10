import * as THREE from "three";

import { defaults } from "./defaults.js";

const zoneSize = 0.01;
const eps = 0.025;
const cubeSize = 0.2 - eps;

const blockCubeGeo = new THREE.BoxGeometry(cubeSize,cubeSize,cubeSize,1,1,1);

 
const fullSolutionsBlockMaterial = new THREE.MeshBasicMaterial({color : new THREE.Color(defaults.defaultColorFullSolutions),
                                                                transparent : false});                                 
const fullSolutionsWarningsBlockMaterial = new THREE.MeshBasicMaterial({color : new THREE.Color(defaults.defaultColorFullSolutionsWarnings),
                                                                transparent : false});    
const partialSolutionsBlockMaterial = new THREE.MeshBasicMaterial({color : new THREE.Color(defaults.defaultColorPartialSolutions),
                                                                transparent : false}); 
const partialSolutionsWarningsBlockMaterial = new THREE.MeshBasicMaterial({color : new THREE.Color(defaults.defaultColorPartialSolutionsWarnings),
                                                                transparent : false});                          
const noSolutionsBlockMaterial = new THREE.MeshBasicMaterial({color : new THREE.Color(defaults.defaultColorNoSolutions),
                                                                transparent : false }); 
const noSolutionsWarningsBlockMaterial = new THREE.MeshBasicMaterial({color : new THREE.Color(defaults.defaultColorNoSolutionsWarnings),
                                                                transparent : false});
const incompleteBlockMaterial = new THREE.MeshBasicMaterial({color : new THREE.Color(defaults.defaultColorIncomplete),
                                                                transparent : false });
                                                     
const gridMaterial = new THREE.LineBasicMaterial({color : new THREE.Color(defaults.defaultGridColor),
                                                side : THREE.DoubleSide,
                                                depthTest : true,
                                                transparent : true,
                                                opacity : defaults.defaultGridOpacity});

const blockMaterialDictionary = {
    "fullSolutions" : fullSolutionsBlockMaterial,
    "fullSolutionsWarnings" : fullSolutionsWarningsBlockMaterial,
    "partialSolutions" : partialSolutionsBlockMaterial,
    "partialSolutionsWarnings" : partialSolutionsWarningsBlockMaterial,
    "noSolutions" : noSolutionsBlockMaterial,
    "noSolutionsWarnings" : noSolutionsWarningsBlockMaterial,
    "incomplete" : incompleteBlockMaterial
};

const raycaster = new THREE.Raycaster();

export class FSTViewerScene {
    static get PYRA_LAYER() { return 1 };
    static get MYTHRA_LAYER() { return 2 };
    
    #scene;

    #data;

    #grids;
    #gridGeos;
    #gridCenters;
    #gridTransforms;

    #axes;

    #blocks;

    #incompleteBlocks;
    #noSolutionsBlocks;
    #noSolutionsWarningsBlocks;
    #partialSolutionsBlocks;
    #partialSolutionsWarningsBlocks;
    #fullSolutionsBlocks;
    #fullSolutionsWarningsBlocks;

    #minViewXMag;
    #maxViewXMag;
    #minViewYMag;
    #maxViewYMag;
    #minViewXZMag;
    #maxViewXZMag;

    #sliceEnabled;
    #sliceSign;
    #sliceAxis;
    #sliceValue;

    constructor(data) {
        this.#scene = new THREE.Scene();

        this.#data = data;
        
        this.#axes = new THREE.AxesHelper(5);
        this.#axes.setColors(new THREE.Color(0xff0000),
                                new THREE.Color(0x00ff00),
                                new THREE.Color(0xff00ff),);
        this.#scene.add(this.#axes);

        this.#minViewXMag = defaults.defaultMinX;
        this.#maxViewXMag = defaults.defaultMaxX;;
        this.#minViewYMag = defaults.defaultMinY;;
        this.#maxViewYMag = defaults.defaultMaxY;
        this.#minViewXZMag = defaults.defaultMinXZSum;
        this.#maxViewXZMag = defaults.defaultMaxXZSum;

        this.#grids = new THREE.Group();
        this.#grids.visible = defaults.defaultGridEnabled;
        this.#scene.add(this.#grids);

        this.#blocks = new THREE.Group();

        this.#fullSolutionsBlocks = new THREE.Group();
        this.#fullSolutionsWarningsBlocks = new THREE.Group();
        this.#partialSolutionsBlocks = new THREE.Group();
        this.#partialSolutionsWarningsBlocks = new THREE.Group();
        this.#noSolutionsBlocks = new THREE.Group();
        this.#noSolutionsWarningsBlocks = new THREE.Group();
        this.#incompleteBlocks = new THREE.Group();

        this.#blocks.add(this.#fullSolutionsBlocks);
        this.#blocks.add(this.#fullSolutionsWarningsBlocks);
        this.#blocks.add(this.#partialSolutionsBlocks);
        this.#blocks.add(this.#partialSolutionsWarningsBlocks);
        this.#blocks.add(this.#noSolutionsBlocks);
        this.#blocks.add(this.#noSolutionsWarningsBlocks);
        this.#blocks.add(this.#incompleteBlocks);

        this.#scene.add(this.#blocks);

        this.#gridGeos = [];

        this.#initGridTransforms();
        this.#generateGrids();

        this.#sliceEnabled = defaults.defaultSliceToolEnabled;
        this.#sliceSign = defaults.defaultSliceSign;
        this.#sliceAxis = defaults.defaultSliceAxis;
        this.#sliceValue = defaults.defaultSliceValue;
    }

    setData(data) {
        this.#data = data;
        this.#generateGrids();
        this.generateBlocks();
    }

    #generateGridLines(minX, maxX, minY, maxY, minXZ, maxXZ, step, pos) {
        const halfStep = step/2;
        const gridLines = new THREE.Group();

        // X Lines
        for(let y = minY; y <= maxY + halfStep; y+=step){
            for(let xz = minXZ; xz <= maxXZ + halfStep; xz+=step) {            
                const lineGeo = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(minX, y, xz),
                    new THREE.Vector3(maxX, y, xz)
                ]);
                this.#gridGeos.push(lineGeo);
                gridLines.add(new THREE.Line(lineGeo, gridMaterial));
            }
        }

        // Y Lines
        for(let x = minX; x <= maxX + halfStep; x+=step){
            for(let xz = minXZ; xz <= maxXZ + halfStep; xz+=step) {
                const lineGeo = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(x, minY, xz),
                    new THREE.Vector3(x, maxY, xz)
                ]);
                this.#gridGeos.push(lineGeo);
                gridLines.add(new THREE.Line(lineGeo, gridMaterial));
            }
        }

        // XZ Lines
        for(let x = minX; x <= maxX + halfStep; x+=step){
            for(let y = minY; y <= maxY + halfStep; y+=step) {
                const lineGeo = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(x, y, minXZ),
                    new THREE.Vector3(x, y, maxXZ)
                ]);
                this.#gridGeos.push(lineGeo);
                gridLines.add(new THREE.Line(lineGeo, gridMaterial));
            }
        }

        gridLines.position.copy(pos);

        return gridLines;
    }

    #getClosestGridID(x, xz) {
        if(x > 0 && xz > 0)
            return 0;
        if(xz > 0)
            return 1;
        if(x > 0)
            return 2;
        return 3;
    }

    #initGridTransforms() {
        const xC = (this.#minViewXMag + this.#maxViewXMag) / 2;
        const yC = (this.#minViewYMag + this.#maxViewYMag) / 2;
        const xzC = (this.#minViewXZMag + this.#maxViewXZMag) / 2;

        const xSize = (this.#maxViewXMag - this.#minViewXMag);
        const ySize = (this.#maxViewYMag - this.#minViewYMag);
        const xzSize = (this.#maxViewXZMag - this.#minViewXZMag);

        // The sm64 grid centers (in SM64 space)
        const sm64GridCenters = [
            new THREE.Vector3(xC, yC, xzC),
            new THREE.Vector3(-xC, yC, xzC),
            new THREE.Vector3(xC, yC, -xzC),
            new THREE.Vector3(-xC, yC, -xzC)
        ]

        const gridHDist = 2.5;
        const gridVDist = 1.5;

        // The web app grid centers (in world space)
        this.#gridCenters = [
            new THREE.Vector3(gridHDist, gridVDist, gridHDist),
            new THREE.Vector3(-gridHDist, gridVDist, gridHDist),
            new THREE.Vector3(gridHDist, gridVDist, -gridHDist),
            new THREE.Vector3(-gridHDist, gridVDist, -gridHDist)
        ]

        // Create the transforms from SM64 to web app
        this.#gridTransforms = [];
        for(let i = 0; i < sm64GridCenters.length; ++i) {
            const mat1 = new THREE.Matrix4();
            mat1.makeTranslation(new THREE.Vector3().sub(sm64GridCenters[i]));

            const mat2 = new THREE.Matrix4().makeScale(2 / xSize, 
                                                        2 / ySize,
                                                        2 / xzSize);

            const mat3 = new THREE.Matrix4();
            mat3.makeTranslation(this.#gridCenters[i]);

            this.#gridTransforms.push(mat3.multiply(mat2.multiply(mat1)));
        }
    }

    #generateGrids() {
        this.#grids.clear();

        for(let i = 0; i < this.#gridGeos.length; ++i) {
            this.#gridGeos[i].dispose();
        }
        this.#gridGeos = [];

        // Generate the grid objects for the app
        for(let i = 0; i < this.#gridCenters.length; ++i) {
            if(this.#sliceEnabled) {
                switch(this.#sliceAxis) {
                    case "Y":
                        const gridYMin = 2 * (this.#sliceValue - this.#minViewYMag) / 
                                            (this.#maxViewYMag - this.#minViewYMag) - 1;
                        const gridYMax = 2 * (this.#sliceValue + defaults.defaultBlockStep - this.#minViewYMag) / 
                                            (this.#maxViewYMag - this.#minViewYMag) - 1;

                        this.#grids.add(this.#generateGridLines(-1, 1, 
                                                                    gridYMin, gridYMax,
                                                                    -1, 1, 
                                                                    0.2, this.#gridCenters[i]));

                        break;
                    case "X":
                        const gridPlusXMin = 2 * (this.#sliceValue - this.#minViewXMag) / 
                                            (this.#maxViewXMag - this.#minViewXMag) - 1;
                        const gridPlusXMax = 2 * (this.#sliceValue + defaults.defaultBlockStep - this.#minViewXMag) / 
                                            (this.#maxViewXMag - this.#minViewXMag) - 1;

                        const gridXSign = Math.sign(this.#gridCenters[i].x);

                        if(this.#sliceSign == "plus" && gridXSign < 0 ||
                            this.#sliceSign == "minus" && gridXSign > 0) {
                                break;
                        }
                        else if(gridXSign > 0){
                            this.#grids.add(this.#generateGridLines(gridPlusXMin, gridPlusXMax,
                                                                        -1, 1,
                                                                        -1, 1, 
                                                                        0.2, this.#gridCenters[i]));
                        }
                        else {
                            this.#grids.add(this.#generateGridLines(-gridPlusXMax, -gridPlusXMin,
                                                                        -1, 1,
                                                                        -1, 1,
                                                                        0.2, this.#gridCenters[i]));
                        }

                        break;
                    case "XZSum":
                        const gridPlusXZMin = 2 * (this.#sliceValue - this.#minViewXZMag) / 
                                            (this.#maxViewXZMag - this.#minViewXZMag) - 1;
                        const gridPlusXZMax = 2 * (this.#sliceValue + defaults.defaultBlockStep - this.#minViewXZMag) / 
                                            (this.#maxViewXZMag - this.#minViewXZMag) - 1;

                        const gridXZSign = Math.sign(this.#gridCenters[i].z);

                        if(this.#sliceSign == "plus" && gridXZSign < 0 ||
                            this.#sliceSign == "minus" && gridXZSign > 0) {
                                break;
                        }
                        else if(gridXZSign > 0){
                            this.#grids.add(this.#generateGridLines(-1, 1,
                                                                        -1, 1,
                                                                        gridPlusXZMin, gridPlusXZMax, 
                                                                        0.2, this.#gridCenters[i]));
                        }
                        else {
                            this.#grids.add(this.#generateGridLines(-1, 1,
                                                                        -1, 1,
                                                                        -gridPlusXZMax, -gridPlusXZMin, 
                                                                        0.2, this.#gridCenters[i]));
                        }

                        break;
                    default:
                        console.log("Case not handled: ", this.#sliceAxis);
                        break;
                }
            }
            else {
                this.#grids.add(this.#generateGridLines(-1, 1, -1, 1, -1, 1, 0.2, this.#gridCenters[i])); 
            }
        }
    }

    #checkInSlice(xC, yC, xzC) {
        switch(this.#sliceAxis){
            case "Y":
                if(yC < this.#sliceValue || 
                    yC > this.#sliceValue + defaults.defaultBlockStep)
                    return false;
                break;
            
            case "X":
                const plusCaseX = xC >= this.#sliceValue && 
                                 xC <= this.#sliceValue + defaults.defaultBlockStep;
                const minusCaseX = xC <= -this.#sliceValue && 
                                  xC >= -this.#sliceValue - defaults.defaultBlockStep;

                switch(this.#sliceSign) {
                    case "plus":
                        if(!plusCaseX)
                            return false;
                        break;
                    case "minus":
                        if(!minusCaseX)
                            return false;
                        break;
                    case "plusOrMinus":
                        if(!(plusCaseX || minusCaseX))
                            return false;
                        break;
                }
                break;

            case "XZSum":
                const plusCaseXZ = xzC >= this.#sliceValue && 
                                 xzC <= this.#sliceValue + defaults.defaultBlockStep;
                const minusCaseXZ = xzC <= -this.#sliceValue && 
                                  xzC >= -this.#sliceValue - defaults.defaultBlockStep;

                switch(this.#sliceSign) {
                    case "plus":
                        if(!plusCaseXZ)
                            return false;
                        break;
                    case "minus":
                        if(!minusCaseXZ)
                            return false;
                        break;
                    case "plusOrMinus":
                        if(!(plusCaseXZ || minusCaseXZ))
                            return false;
                        break;
                }
                break;
            
            default:
                console.log("Case not handled: ", this.#sliceAxis);
        }

        return true;
    }

    generateBlocks(){
        this.#incompleteBlocks.clear();
        this.#noSolutionsBlocks.clear();
        this.#noSolutionsWarningsBlocks.clear();
        this.#partialSolutionsBlocks.clear();
        this.#partialSolutionsWarningsBlocks.clear();
        this.#fullSolutionsBlocks.clear();
        this.#fullSolutionsWarningsBlocks.clear();

        var count = 0;

        var rowLinkStart = "https://docs.google.com/spreadsheets/d/1EGJgRTOo6Hph2YJcyH14hHgj72eQYHEj-r-8sAJQ3GM/edit?gid=1853593123&range="

        this.#data.forEach(row => {
            const xMin = parseFloat(row["X Normal Min"]);
            const xMax = parseFloat(row["X Normal Max"]);
            const xC = (xMin + xMax) / 2;

            const yMin = parseFloat(row["Y Normal Min"]);
            const yMax = parseFloat(row["Y Normal Max"]);
            const yC = (yMin + yMax) / 2;

            const xzMin = parseFloat(row["XZ Sum Min"]);
            const xzMax = parseFloat(row["XZ Sum Max"]);
            const xzC = (xzMin + xzMax) / 2;

            // Ignore a particular block if slice tool is enabled and the block is 
            // outside the slice region
            if(this.#sliceEnabled && !this.#checkInSlice(xC, yC, xzC)) {
                return;
            }

            const transform = this.#gridTransforms[this.#getClosestGridID(xC, xzC)];

            const result = new THREE.Vector3(xC, yC, xzC);
            result.applyMatrix4(transform);

            const error_entry = row["Errors/Warnings Searching Region?"].toLowerCase();
            const treatAsWarning = error_entry != "no" &&
                                    !(error_entry.includes("rechecked") &&
                                      error_entry.includes("successfully"));


            let blockMesh = new THREE.Mesh(blockCubeGeo, incompleteBlockMaterial);
            if(row["Solutions?"].toLowerCase() != "yes"){
                if(row["Completed?"].toLowerCase() == "yes"){
                    if(treatAsWarning){
                        blockMesh.material = noSolutionsWarningsBlockMaterial;
                        this.#noSolutionsWarningsBlocks.add(blockMesh);
                    }
                    else{
                        blockMesh.material = noSolutionsBlockMaterial;
                        this.#noSolutionsBlocks.add(blockMesh);
                    }
                }
                else {
                    this.#incompleteBlocks.add(blockMesh);
                }
            }
            else if(row["Latest Stage Reached"] != "11"){
                if(treatAsWarning){
                    blockMesh.material = partialSolutionsWarningsBlockMaterial;
                    this.#partialSolutionsWarningsBlocks.add(blockMesh);
                }
                else {
                    blockMesh.material = partialSolutionsBlockMaterial;
                    this.#partialSolutionsBlocks.add(blockMesh);
                }
            }
            else {
                if(treatAsWarning) {
                    blockMesh.material = fullSolutionsWarningsBlockMaterial;
                    this.#fullSolutionsWarningsBlocks.add(blockMesh);
                }
                else {
                    blockMesh.material = fullSolutionsBlockMaterial;
                    this.#fullSolutionsBlocks.add(blockMesh);
                }
            }


            blockMesh.position.copy(result);
            if(row["Platform X"] == "-1945")
                blockMesh.layers.set(FSTViewerScene.PYRA_LAYER);
            else
                blockMesh.layers.set(FSTViewerScene.MYTHRA_LAYER);

            // Add sheet data
            blockMesh.userData["xMin"] = xMin;
            blockMesh.userData["xMax"] = xMax;
            blockMesh.userData["yMin"] = yMin;
            blockMesh.userData["yMax"] = yMax;
            blockMesh.userData["xzMin"] = xzMin;
            blockMesh.userData["xzMax"] = xzMax;

            if(row["Platform X"] == "-1945")
                blockMesh.userData["platform"] = "Pyra (X = -1945)";
            else
                blockMesh.userData["platform"] = "Mythra (X = -2866)";

            blockMesh.userData["name"] = row["Name"];
            blockMesh.userData["date"] = row["Date Started"];
            blockMesh.userData["completed"] = row["Completed?"];
            blockMesh.userData["solutions"] = row["Solutions?"];
            blockMesh.userData["stage"] = row["Latest Stage Reached"];
            blockMesh.userData["warnings"] = row["Errors/Warnings Searching Region?"];
            blockMesh.userData["version"] = row["Brute Forcer Version"];
            blockMesh.userData["solutionsCSV"] = row["Solutions CSV (only provide this if there are solutions)"];
            blockMesh.userData["rowHyperlink"] = rowLinkStart + row["index"] + ":" + row["index"];

            count++;
        });
    }

    raycastBlocks(coords, camera, layer) {
        raycaster.setFromCamera(coords, camera);
        raycaster.layers.set(layer);
        return raycaster.intersectObject(this.#blocks, true);
    }

    setSlice(enabled, sign, axis, value) {
        this.#sliceEnabled = !!enabled;
        this.#sliceSign = sign;
        this.#sliceAxis = axis;
        this.#sliceValue = parseFloat(value);

        this.#generateGrids();
        this.generateBlocks();
    }

    setBlockColor(groupName, color) {
        blockMaterialDictionary[groupName].color = new THREE.Color(color);
    }

    setBlockVisibile(groupName, visible) {
        switch(groupName){
            case "fullSolutions":
                this.#fullSolutionsBlocks.visible = visible;
                break;
            case "fullSolutionsWarnings":
                this.#fullSolutionsWarningsBlocks.visible = visible;
                break;
            case "partialSolutions":
                this.#partialSolutionsBlocks.visible = visible;
                break;
            case "partialSolutionsWarnings":
                this.#partialSolutionsWarningsBlocks.visible = visible;
                break;
            case "noSolutions":
                this.#noSolutionsBlocks.visible = visible;
                break;
            case "noSolutionsWarnings":
                this.#noSolutionsWarningsBlocks.visible = visible;
                break;
            case "incomplete":
                this.#incompleteBlocks.visible = visible;
                break;
        }
    }

    setGridEnabled(enabled) {
        this.#grids.visible = !!enabled;
    }

    setGridColor(color) {
        gridMaterial.color = new THREE.Color(color);
    }

    setGridOpacity(opacity) {
        try{
            gridMaterial.opacity = parseFloat(opacity);
        }
        catch(error) {
            console.log("Error in setting grid opacity:", error, "\nGrid Opacity Left Unchanged");
        }
    }

    printScene() {
        console.log(this.#scene);
    }

    renderScene(renderer, camera) {
        renderer.render(this.#scene, camera);
    }
}