import { defaults } from "./defaults.js";
import { FSTViewerScene } from "./scene.js";

function setCameraPlatformLayer(camera, platform) {
    if(platform == "pyra") {
        camera.layers.enable(FSTViewerScene.PYRA_LAYER);
        camera.layers.disable(FSTViewerScene.MYTHRA_LAYER);
    }
    else {
        camera.layers.enable(FSTViewerScene.MYTHRA_LAYER);
        camera.layers.disable(FSTViewerScene.PYRA_LAYER);
    }
}

function initPlatformDropdown(camera) {
    const platformDropdown = document.getElementById("platformDropdown");

    platformDropdown.addEventListener("change", () => {
        setCameraPlatformLayer(camera, platformDropdown.value);
    });

    platformDropdown.value = defaults.defaultPlatform;
    setCameraPlatformLayer(camera, defaults.defaultPlatform);
}

function initSliceToolEnable(fstScene) {
    const sliceToggle = document.getElementById("sliceToggle");
    const sliceSignDropdown = document.getElementById("sliceSignDropdown");
    const sliceAxisDropdown = document.getElementById("sliceAxisDropdown");
    const sliceRangeSlider = document.getElementById("sliceRangeSlider");

    sliceToggle.addEventListener("change", ()=>{
        sliceSignDropdown.disabled = !sliceToggle.checked || 
                                      sliceAxisDropdown.value == "Y";
        sliceAxisDropdown.disabled = !sliceToggle.checked;
        sliceRangeSlider.disabled = !sliceToggle.checked;

        fstScene.setSlice(sliceToggle.checked, sliceSignDropdown.value, 
            sliceAxisDropdown.value, sliceRangeSlider.value);
    });

    sliceToggle.checked = defaults.defaultSliceToolEnabled;

    sliceSignDropdown.disabled = !sliceToggle.checked ||
                                  defaults.defaultSliceAxis == "Y";
    sliceAxisDropdown.disabled = !sliceToggle.checked;
    sliceRangeSlider.disabled = !sliceToggle.checked;
}

function initSliceSignDropdown(fstScene) {
    const sliceToggle = document.getElementById("sliceToggle");
    const sliceAxisDropdown = document.getElementById("sliceAxisDropdown");
    const sliceSignDropdown = document.getElementById("sliceSignDropdown");
    const sliceRangeSlider = document.getElementById("sliceRangeSlider");
    
    sliceSignDropdown.addEventListener("change", ()=>{
        fstScene.setSlice(sliceToggle.checked, sliceSignDropdown.value, 
            sliceAxisDropdown.value, sliceRangeSlider.value);
    });

    sliceSignDropdown.value = defaults.defaultSliceSign;
}

function initSliceAxisDropdown(fstScene) {
    const sliceToggle = document.getElementById("sliceToggle");
    const sliceAxisDropdown = document.getElementById("sliceAxisDropdown");
    const sliceSignDropdown = document.getElementById("sliceSignDropdown");
    const sliceRangeSlider = document.getElementById("sliceRangeSlider");

    sliceAxisDropdown.addEventListener("change", ()=>{
        sliceSignDropdown.disabled = sliceAxisDropdown.value == "Y";

        updateSliderRange();
        fstScene.setSlice(sliceToggle.checked, sliceSignDropdown.value, 
            sliceAxisDropdown.value, sliceRangeSlider.value);
    });

    sliceAxisDropdown.value = defaults.defaultSliceAxis;
}

function initSliceRangeSlider(fstScene) {
    const sliceToggle = document.getElementById("sliceToggle");
    const sliceAxisDropdown = document.getElementById("sliceAxisDropdown");
    const sliceSignDropdown = document.getElementById("sliceSignDropdown");
    const sliceRangeSlider = document.getElementById("sliceRangeSlider");
    
    sliceRangeSlider.addEventListener("input", ()=>{
        fstScene.setSlice(sliceToggle.checked, sliceSignDropdown.value, 
                            sliceAxisDropdown.value, sliceRangeSlider.value);
        updateSliceValueLabel();
    });

    sliceRangeSlider.step = defaults.defaultBlockStep;
    
    updateSliderRange();

    sliceRangeSlider.value = defaults.defaultSliceValue;
    updateSliceValueLabel();
}

function updateSliderRange() {
    const sliceAxisDropdown = document.getElementById("sliceAxisDropdown");
    const sliceRangeSlider = document.getElementById("sliceRangeSlider");

    const sliderValue = parseFloat(sliceRangeSlider.value);
    const sliderMin = parseFloat(sliceRangeSlider.min);
    const sliderStep = parseFloat(sliceRangeSlider.step);

    const sliderSteps = Math.round((sliderValue - sliderMin)
                                        / sliderStep);

    if(sliceAxisDropdown.value == "X") {
        sliceRangeSlider.min = defaults.defaultMinX;
        sliceRangeSlider.max = defaults.defaultMaxX - 
                                defaults.defaultBlockStep;
    }
    else if(sliceAxisDropdown.value == "Y") {
        sliceRangeSlider.min = defaults.defaultMinY;
        sliceRangeSlider.max = defaults.defaultMaxY - 
                                defaults.defaultBlockStep;
    }
    else {
        sliceRangeSlider.min = defaults.defaultMinXZSum;
        sliceRangeSlider.max = defaults.defaultMaxXZSum - 
                                defaults.defaultBlockStep;
    }

    // TODO: Change to "fraction-based" to handle non-cube normal regions 
    // (not needed for current sheet setup)
    sliceRangeSlider.value = sliderSteps * defaults.defaultBlockStep +
                                parseFloat(sliceRangeSlider.min);

    updateSliceValueLabel();
}

function updateSliceValueLabel() {
    const sliceValueLabel = document.getElementById("sliceValueLabel");

    const sliceValue = parseFloat(document.getElementById("sliceRangeSlider").value);

    sliceValueLabel.textContent = "(" + sliceValue.toFixed(2) + 
                                    " to " + 
                                    (sliceValue + 0.01).toFixed(2) + ")";
}

function initSliceTool(fstScene) {
    initSliceToolEnable(fstScene);
    initSliceSignDropdown(fstScene);
    initSliceAxisDropdown(fstScene);

    // Must be called AFTER initializing slice axis dropdown
    initSliceRangeSlider(fstScene);
}


function initGridEnable(fstScene) {
    const gridToggle = document.getElementById("gridToggle");
    const gridColorPicker = document.getElementById("gridColorPicker");
    const gridOpacitySlider = document.getElementById("gridOpacitySlider");

    gridToggle.addEventListener("change", () => {
        fstScene.setGridEnabled(gridToggle.checked);
        gridColorPicker.disabled = !gridToggle.checked;
        gridOpacitySlider.disabled = !gridToggle.checked;
    });

    gridToggle.checked = defaults.defaultGridEnabled;
    gridColorPicker.disabled = !defaults.defaultGridEnabled;
    gridOpacitySlider.disabled = !defaults.defaultGridEnabled;
}

function initGridColorPicker(fstScene) {
    const gridColorPicker = document.getElementById("gridColorPicker");

    gridColorPicker.addEventListener("input", () => {
        fstScene.setGridColor(gridColorPicker.value);
    });

    gridColorPicker.value = defaults.defaultGridColor;
}

function initGridOpacitySlider(fstScene) {
    const gridOpacitySlider = document.getElementById("gridOpacitySlider");

    gridOpacitySlider.addEventListener("input", () => {
        fstScene.setGridOpacity(parseFloat(gridOpacitySlider.value));

        updateGridOpacityValueLabel();
    });

    gridOpacitySlider.value = defaults.defaultGridOpacity;

    updateGridOpacityValueLabel();
}

function updateGridOpacityValueLabel() {
    const gridOpacityValueLabel = document.getElementById("gridOpacityValueLabel");

    const opacityValue = parseFloat(document.getElementById("gridOpacitySlider").value);

    gridOpacityValueLabel.textContent = "(" + opacityValue.toFixed(2) + ")";
}

function initGridSettings(fstScene) {
    initGridEnable(fstScene);
    initGridColorPicker(fstScene);
    initGridOpacitySlider(fstScene);
}

export function initSettings(fstScene, camera) {
    initPlatformDropdown(camera);
    initSliceTool(fstScene);
    initGridSettings(fstScene);
}
