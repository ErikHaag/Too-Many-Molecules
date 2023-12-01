const pubchemPageButton = document.getElementById("selectPubchem");
const pubchemButton = document.getElementById("getFromPubchem");

const addAtomsPageButton = document.getElementById("selectAtoms");
const addAtomsButton = document.getElementById("addAtom")

const addBondsPageButton = document.getElementById("selectBonds");
const clearButton = document.getElementById("clear");
const swellButton = document.getElementById("swell");

pubchemPageButton.addEventListener("click", () => {
    page = 0;
    updatePages();
});

pubchemButton.addEventListener("click", getData);

addAtomsPageButton.addEventListener("click", () => {
    page = 1;
    updatePages();
});

addAtomsButton.addEventListener("click", () => {
    atomPos.push([50 * (1 - 2 * Math.random()), 50 * (1 - 2 * Math.random())]);
    atomVel.push([0, 0]);
    atomElements.push(elementLabels.indexOf(document.getElementById("elementSelect").value) + 1);
    atomCharges.push(BigInt(Math.floor(document.getElementById("chargeSelect").value)));
    atoms++;
});

addBondsPageButton.addEventListener("click", () => {
    page = 2;
    updatePages();
})


clearButton.addEventListener("click", () => {
    clearInterval(clock);
    draggingAtom = false;
    closestAtom = -1;
    atoms = 0;
    atomPos = [];
    atomVel = [];
    atomElements = [];
    atomCharges = [];
    bonds = 0;
    atomBonds = [];
    compoundNamePara.innerText = "Press Display to update...";
    clock = setInterval(update, 10);
});

swellButton.addEventListener("click", () => {
    clearTimeout(swellTimer);
    springConstant = 1;
    repulsionRadius = 50;
    swellTimer = setTimeout(() => {
        springConstant = 0.5;
        repulsionRadius = 20;
        clearTimeout(swellTimer);
    }, 500);
});