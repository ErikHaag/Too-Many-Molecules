const cidInput = document.getElementById("cid");
const compoundNamePara = document.getElementById("compoundLabel");
const hydrogenGrouping = document.getElementById("groupH");
const bondType = document.getElementById("bondType");
const canvas = document.querySelector("canvas");
const cvs = canvas.getContext("2d");
const elementLabels = ["H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"];

const scaleDist = 5;
const canvasSize = 800;

let page = 0;
let swellTimer;
let running = true;
let draggingAtom = false;
let closestAtom = -1;
let overAtom = -1;
let atoms = 0;
let atomPos = [];
let atomVel = [];
let atomElements = [];
let atomCharges = [];
let bonds = 0;
let atomBonds = [];

canvas.width = canvasSize;
canvas.height = canvasSize;

let springConstant = 0.5;
let repulsionRadius = 20;

document.addEventListener("keydown", (e) => {
    if (page == 1 && closestAtom != -1) {
        if (e.code === "Backspace" || e.code === "Delete") {
            removeAtom(closestAtom);
            closestAtom = -1;
        }
    }
});

canvas.addEventListener("mousedown", () => {
    if (closestAtom != -1) {
        draggingAtom = true;
    }
});

canvas.addEventListener("mouseenter", () => {
    running = false;
});

canvas.addEventListener("mouseleave", () => {
    draggingAtom = false;
    closestAtom = -1;
    overAtom = -1
    running = true;
});

canvas.addEventListener("mouseup", () => {
    if (closestAtom != -1 && overAtom != -1) {
        let index = -1
        for (let i = 0; i < bonds; i++) {
            if ((atomBonds[i][0] == closestAtom && atomBonds[i][1] == overAtom) || (atomBonds[i][0] == overAtom && atomBonds[i][1] == closestAtom)) {
                index = i;
                break;
            }
        }
        if (index != -1) {
            if (bondType.value == "0") {
                atomBonds.splice(index, 1);
                bonds--;
            } else {
                atomBonds[index][2] = Number.parseInt(bondType.value);
            }
        } else {
            if (bondType.value != "0") {
                atomBonds.push([closestAtom, overAtom, Number.parseInt(bondType.value)]);
                bonds++;
            }
        }
    } 
    draggingAtom = false;
});

canvas.addEventListener("mousemove", (e) => {
    let mX = (e.offsetX - canvasSize / 2) / scaleDist;
    let mY = (e.offsetY - canvasSize / 2) / scaleDist;
    if (!draggingAtom) {
        let minDist = 4;
        let minDistAtom = -1;
        for (let i = 0; i < atoms; i++) {
            let d = (mX - atomPos[i][0]) ** 2 + (mY - atomPos[i][1]) ** 2;
            if (minDist > d) {
                minDist = d;
                minDistAtom = i;
            }
        }
        closestAtom = minDistAtom;
        overAtom = -1;
    } else if (closestAtom != -1) {
        atomPos[closestAtom] = [mX, mY];
        atomVel[closestAtom] = [0, 0];
        if (page == 2) {
            let minDist = 4;
            let minDistAtom = -1;
            for (let i = 0; i < atoms; i++) {
                if (i == closestAtom) continue;
                let d = (mX - atomPos[i][0]) ** 2 + (mY - atomPos[i][1]) ** 2;
                if (minDist > d) {
                    minDist = d;
                    minDistAtom = i;
                }
            }
            overAtom = minDistAtom;
        } else {
            overAtom = -1;
        }
    }
});

function removeAtom(index) {
    atoms--;
    atomPos.splice(index, 1);
    atomVel.splice(index, 1);
    atomCharges.splice(index, 1);
    atomElements.splice(index, 1);
    for (let i = bonds - 1; i >= 0; i--) {
        if (atomBonds[i][0] == index || atomBonds[i][1] == index) {
            atomBonds.splice(i, 1);
            bonds--;
        } else {
            if (atomBonds[i][0] > index) atomBonds[i][0]--;
            if (atomBonds[i][1] > index) atomBonds[i][1]--;
        }
    }
}

function updatePages() {
    const pubchemPage = document.getElementById("pubchemPage");
    if (page == 0) {
        pubchemPage.style.width = "500px";
    } else {
        pubchemPage.style.width = "0px";
    }
    const addAtomsPage = document.getElementById("addAtomsPage");
    if (page == 1) {
        addAtomsPage.style.width = "250px";
    } else {
        addAtomsPage.style.width = "0px";
    }
    const addBondsPage = document.getElementById("addBondsPage");
    if (page == 2) {
        addBondsPage.style.width = "400px";
    } else {
        addBondsPage.style.width = "0px";
    }
}

async function getData() {
    //ask pubchem for JSON (politely)
    let response = await fetch("https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/" + cidInput.value + "/JSON");
    let json = await response.json();
    let data = json.PC_Compounds[0];
    let props = data.props;
    let indexableProps = props.map((e) => e.urn.name + " " + e.urn.label);
    //abusing behavior of assignment (=) and logical or (||) to enforce priority
    if (((i = indexableProps.indexOf("Preferred IUPAC Name")) != -1) || ((i = indexableProps.indexOf("Allowed IUPAC Name")) != -1)) {
        compoundNamePara.innerText = "Name: " + props[i].value.sval;
    } else {
        compoundNamePara.innerText = "No agreed name found!";
    }
    compoundNamePara.innerText += "\n";
    if (((i = indexableProps.indexOf("Canonical SMILES")) != -1) || ((i = indexableProps.indexOf("Isomeric SMILES")) != -1)) {
        compoundNamePara.innerText += "SMILES: " + props[i].value.sval;
    } else {
        compoundNamePara.innerText += "No SMILES String found";
    }
    atoms = data.atoms.aid.length;
    atomElements = data.atoms.element;
    atomPos = [];
    atomVel = [];
    atomCharges = [];
    //get atoms
    for (let i = 0; i < atoms; i++) {
        atomPos.push([50 * (1 - 2 * Math.random()), 50 * (1 - 2 * Math.random())]);
        atomVel.push([0, 0]);
        atomCharges.push(0n);
    }
    //test for charged atoms
    if (Object.hasOwn(data.atoms, "charge")) {
        //get charges
        let ions = data.atoms.charge.length;
        for (let i = 0; i < ions; i++) {
            atomCharges[data.atoms.charge[i].aid - 1] = BigInt(data.atoms.charge[i].value);
        }
    }
    bonds = 0;
    //test for bonds
    if (Object.hasOwn(data, "bonds")) {
        //get all the bonds
        bonds = data.bonds.order.length;
        atomBonds = [];
        for (let i = 0; i < bonds; i++) {
            atomBonds.push([data.bonds.aid1[i] - 1, data.bonds.aid2[i] - 1, data.bonds.order[i]]);
        }
    }
}

function step() {
    //repel non bonded atoms
    const bondArray = atomBonds.map(e => [e[0], e[1]]);
    const repulsionRadiusSquared = repulsionRadius ** 2;
    for (let i = 0; i < atoms - 1; i++) {
        for (let j = i + 1; j < atoms; j++) {
            if (bondArray.indexOf([i, j]) != -1 || bondArray.indexOf([j, i]) != -1) {
                continue;
            }
            let sqDist = (atomPos[i][0] - atomPos[j][0]) ** 2 + (atomPos[i][1] - atomPos[j][1]) ** 2;
            if (sqDist >= repulsionRadiusSquared || sqDist == 0) {
                continue;
            }
            let iDS = 0.005 + 1 / sqDist;
            atomVel[i][0] += (atomPos[i][0] - atomPos[j][0]) * iDS;
            atomVel[i][1] += (atomPos[i][1] - atomPos[j][1]) * iDS;
            atomVel[j][0] += (atomPos[j][0] - atomPos[i][0]) * iDS;
            atomVel[j][1] += (atomPos[j][1] - atomPos[i][1]) * iDS;
        }
    }
    //use springs to attract bonded atoms
    const restLength = 10;
    for (let i = 0; i < bonds; i++) {
        let a = atomBonds[i][0];
        let b = atomBonds[i][1];
        let dirX = atomPos[a][0] - atomPos[b][0];
        let dirY = atomPos[a][1] - atomPos[b][1];
        let currentLength = Math.sqrt(dirX ** 2 + dirY ** 2);
        let X = restLength - currentLength;
        if (currentLength == 0) {
            let angle = Math.random();
            dirX = Math.cos(2 * Math.PI * angle);
            dirY = Math.sin(2 * Math.PI * angle);
        } else {
            dirX /= currentLength;
            dirY /= currentLength;
        }
        let strength = springConstant * X / 2;
        atomVel[a][0] += dirX * strength;
        atomVel[a][1] += dirY * strength;
        atomVel[b][0] -= dirX * strength;
        atomVel[b][1] -= dirY * strength;
    }
    //update position and velocities
    for (let i = 0; i < atoms; i++) {
        atomVel[i][0] *= 0.9;
        atomVel[i][1] *= 0.9;
        if (Math.abs(atomPos[i][0]) > (canvasSize / 2 - 25) / scaleDist) atomPos[i][0] = Math.sign(atomPos[i][0]) * (canvasSize / 2 - 25) / scaleDist;
        if (Math.abs(atomPos[i][1]) > (canvasSize / 2 - 25) / scaleDist) atomPos[i][1] = Math.sign(atomPos[i][1]) * (canvasSize / 2 - 25) / scaleDist;
        atomPos[i][0] += atomVel[i][0];
        atomPos[i][1] += atomVel[i][1];
    }
    // move each atom to center and reduce precision
    let offsetX = atomPos.map(e => e[0]).reduce((sum, addend) => sum + addend, 0) / atoms;
    let offsetY = atomPos.map(e => e[1]).reduce((sum, addend) => sum + addend, 0) / atoms;
    for (let i = 0; i < atoms; i++) {
        atomPos[i][0] = Math.round(10 * (atomPos[i][0] - offsetX)) / 10;
        atomPos[i][1] = Math.round(10 * (atomPos[i][1] - offsetY)) / 10;
    }
}

function draw() {
    cvs.strokeStyle = "black";
    cvs.clearRect(0, 0, canvasSize, canvasSize);
    cvs.translate(canvasSize / 2, canvasSize / 2);
    // draw bonds
    cvs.beginPath();
    for (let i = 0; i < bonds; i++) {
        let a = atomBonds[i][0];
        let b = atomBonds[i][1];
        let dirX = atomPos[a][0] - atomPos[b][0];
        let dirY = atomPos[a][1] - atomPos[b][1];
        let currentLength = Math.sqrt(dirX ** 2 + dirY ** 2);
        let perpX = -dirY / currentLength;
        let perpY = dirX / currentLength;
        switch (atomBonds[i][2]) {
            case 1:
                //single
                cvs.moveTo(scaleDist * atomPos[a][0], scaleDist * atomPos[a][1]);
                cvs.lineTo(scaleDist * atomPos[b][0], scaleDist * atomPos[b][1]);
                break;
            case 2:
                //double
                cvs.moveTo(scaleDist * atomPos[a][0] + 5 * perpX, scaleDist * atomPos[a][1] + 5 * perpY);
                cvs.lineTo(scaleDist * atomPos[b][0] + 5 * perpX, scaleDist * atomPos[b][1] + 5 * perpY);
                cvs.moveTo(scaleDist * atomPos[a][0] - 5 * perpX, scaleDist * atomPos[a][1] - 5 * perpY);
                cvs.lineTo(scaleDist * atomPos[b][0] - 5 * perpX, scaleDist * atomPos[b][1] - 5 * perpY);
                break;
            case 3:
                //triple
                cvs.moveTo(scaleDist * atomPos[a][0] + 5 * perpX, scaleDist * atomPos[a][1] + 5 * perpY);
                cvs.lineTo(scaleDist * atomPos[b][0] + 5 * perpX, scaleDist * atomPos[b][1] + 5 * perpY);
                cvs.moveTo(scaleDist * atomPos[a][0], scaleDist * atomPos[a][1]);
                cvs.lineTo(scaleDist * atomPos[b][0], scaleDist * atomPos[b][1]);
                cvs.moveTo(scaleDist * atomPos[a][0] - 5 * perpX, scaleDist * atomPos[a][1] - 5 * perpY);
                cvs.lineTo(scaleDist * atomPos[b][0] - 5 * perpX, scaleDist * atomPos[b][1] - 5 * perpY);
                break;
            case 4:
                //quadruple
                cvs.moveTo(scaleDist * atomPos[a][0] + 5 * perpX, scaleDist * atomPos[a][1] + 5 * perpY);
                cvs.lineTo(scaleDist * atomPos[b][0] + 5 * perpX, scaleDist * atomPos[b][1] + 5 * perpY);
                cvs.moveTo(scaleDist * atomPos[a][0] + 1.5 * perpX, scaleDist * atomPos[a][1] + 1.5 * perpY);
                cvs.lineTo(scaleDist * atomPos[b][0] + 1.5 * perpX, scaleDist * atomPos[b][1] + 1.5 * perpY);
                cvs.moveTo(scaleDist * atomPos[a][0] - 1.5 * perpX, scaleDist * atomPos[a][1] - 1.5 * perpY);
                cvs.lineTo(scaleDist * atomPos[b][0] - 1.5 * perpX, scaleDist * atomPos[b][1] - 1.5 * perpY);
                cvs.moveTo(scaleDist * atomPos[a][0] - 5 * perpX, scaleDist * atomPos[a][1] - 5 * perpY);
                cvs.lineTo(scaleDist * atomPos[b][0] - 5 * perpX, scaleDist * atomPos[b][1] - 5 * perpY);
                break;
            case 5:
                //dative
                cvs.moveTo(scaleDist * atomPos[a][0], scaleDist * atomPos[a][1]);
                cvs.lineTo(scaleDist * atomPos[b][0], scaleDist * atomPos[b][1]);
                cvs.moveTo(scaleDist * atomPos[a][0], scaleDist * atomPos[a][1]);
                cvs.lineTo(scaleDist * (2 * atomPos[a][0] + 3 * atomPos[b][0]) / 5 + 5 * perpX, scaleDist * (2 * atomPos[a][1] + 3 * atomPos[b][1]) / 5 + 5 * perpY);
                cvs.lineTo(scaleDist * (3 * atomPos[a][0] + 2 * atomPos[b][0]) / 5 - 5 * perpX, scaleDist * (3 * atomPos[a][1] + 2 * atomPos[b][1]) / 5 - 5 * perpY);
                cvs.lineTo(scaleDist * atomPos[b][0], scaleDist * atomPos[b][1]);
                break;
            case 6:
                //complex
                cvs.moveTo(scaleDist * atomPos[a][0], scaleDist * atomPos[a][1]);
                cvs.bezierCurveTo(scaleDist * atomPos[b][0] + 10 * perpX, scaleDist * atomPos[b][1] + 10 * perpY, scaleDist * atomPos[a][0] - 10 * perpX, scaleDist * atomPos[a][1] - 10 * perpY, scaleDist * atomPos[b][0], scaleDist * atomPos[b][1]);
                break;
            case 7:
                //ionic
                cvs.moveTo(scaleDist * atomPos[a][0], scaleDist * atomPos[a][1]);
                cvs.lineTo(scaleDist * (2 * atomPos[a][0] + 3 * atomPos[b][0]) / 5 + 5 * perpX, scaleDist * (2 * atomPos[a][1] + 3 * atomPos[b][1]) / 5 + 5 * perpY);
                cvs.lineTo(scaleDist * (3 * atomPos[a][0] + 2 * atomPos[b][0]) / 5 - 5 * perpX, scaleDist * (3 * atomPos[a][1] + 2 * atomPos[b][1]) / 5 - 5 * perpY);
                cvs.lineTo(scaleDist * atomPos[b][0], scaleDist * atomPos[b][1]);
                break;
            default:
                break;
        }
    }
    cvs.stroke()
    // draw atoms
    cvs.font = "10px serif";
    cvs.textAlign = "center";
    cvs.textBaseline = "middle";
    for (let i = 0; i < atoms; i++) {
        cvs.beginPath();
        if (atomElements[i] == 1) {
            cvs.arc(scaleDist * atomPos[i][0], scaleDist * atomPos[i][1], 10, 0, 2 * Math.PI);
        } else {
            cvs.arc(scaleDist * atomPos[i][0], scaleDist * atomPos[i][1], 15, 0, 2 * Math.PI);
        }
        //color atom cursor is over red
        cvs.fillStyle = overAtom == -1 ? (closestAtom == i ? "red" : "white") : ((i == closestAtom || i == overAtom) ? "blue" : "white");
        cvs.stroke();
        cvs.fill();
        cvs.fillStyle = "black";
        //add label based on element and charge
        let label = elementLabels[atomElements[i] - 1];
        if (atomCharges[i] >= 1n) {
            label += "⁺";
            if (atomCharges[i] >= 2n) {
                label += BigIntToSuperscript(atomCharges[i]);
            }
        } else if (atomCharges[i] <= -1n) {
            label += "⁻";
            if (atomCharges[i] <= -2n) {
                label += BigIntToSuperscript(-atomCharges[i]);
            }
        }
        cvs.fillText(label, scaleDist * atomPos[i][0], scaleDist * atomPos[i][1]);
    }
    cvs.resetTransform();
}

function BigIntToSuperscript(int) {
    let s = "";
    do {
        let d = int % 10n
        int = (int - d) / 10n;
        switch (d) {
            case 0n:
                s = "⁰" + s;
                break;
            case 1n:
                s = "¹" + s;
                break;
            case 2n:
                s = "²" + s;
                break;
            case 3n:
                s = "³" + s;
                break;
            case 4n:
                s = "⁴" + s;
                break;
            case 5n:
                s = "⁵" + s;
                break;
            case 6n:
                s = "⁶" + s;
                break;
            case 7n:
                s = "⁷" + s;
                break;
            case 8n:
                s = "⁸" + s;
                break;
            case 9n:
                s = "⁹" + s;
                break;
            default:
                break;

        }
    } while (int > 0n)
    return s;
}

function BigIntToSubscript(int) {
    let s = "";
    do {
        let d = int % 10n
        int = (int - d) / 10n;
        switch (d) {
            case 0n:
                s = "₀" + s;
                break;
            case 1n:
                s = "₁" + s;
                break;
            case 2n:
                s = "₂" + s;
                break;
            case 3n:
                s = "₃" + s;
                break;
            case 4n:
                s = "₄" + s;
                break;
            case 5n:
                s = "₅" + s;
                break;
            case 6n:
                s = "₆" + s;
                break;
            case 7n:
                s = "₇" + s;
                break;
            case 8n:
                s = "₈" + s;
                break;
            case 9n:
                s = "₉" + s;
                break;
            default:
                break;

        }
    } while (int > 0n)
    return s;
}

let clock = setInterval(update, 10);

function update() {
    if (running) {
        step();
    }
    draw();
}