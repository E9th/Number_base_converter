let opcodeTable = {};

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("opcodeTable_merged.json");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        opcodeTable = await response.json();
    } catch (error) {
        console.error("Error loading opcode table:", error);
    }
});

// Convert Number Base Function
function convertNumber() {
    const number = document.getElementById("number").value.trim();
    const base = parseInt(document.getElementById("base").value);

    if (!number || isNaN(parseInt(number, base))) {
        alert("Invalid input!");
        return;
    }

    const decimal = parseInt(number, base);
    document.getElementById("resultBinary").innerText = decimal.toString(2);
    document.getElementById("resultOctal").innerText = decimal.toString(8);
    document.getElementById("resultDecimal").innerText = decimal.toString(10);
    document.getElementById("resultHexadecimal").innerText = decimal.toString(16).toUpperCase();

    if (base === 10 && number.length <= 2) {
        const digits = number.padStart(2, "0").split("").map(d => parseInt(d, 10));
        const packedBCD = ((digits[0] << 4) | digits[1]).toString(2).padStart(8, "0");
        document.getElementById("packResult").innerText = packedBCD;
        document.getElementById("unpackResult").innerText = `MSB: ${digits[0]} LSB: ${digits[1]}`;
    } else {
        document.getElementById("packResult").innerText = "N/A";
        document.getElementById("unpackResult").innerText = "N/A";
    }
}

// Simulate Assembly Function
function simulateAssembly() {
    const instructions = document.getElementById("assemblyInput").value.trim().split("\n");
    let address = 0x8000;
    let result = "";

    instructions.forEach(line => {
        const match = line.match(/(\w+)\s+(@?\w+),?\s*(#\w+)?/);
        if (!match) {
            result += `Error: Invalid format '${line}'\n`;
            return;
        }

        const [_, mnemonic, operand1, operand2] = match;
        let immediateData = operand2 && operand2.startsWith("#") ? operand2.slice(1).toUpperCase() : null;
        let splitBytes = [];

        if (immediateData && parseInt(immediateData, 16) > 0xFF) {
            while (immediateData.length > 2) {
                splitBytes.push(immediateData.slice(0, 2));
                immediateData = immediateData.slice(2);
            }
            splitBytes.push(immediateData);
        } else if (immediateData) {
            splitBytes.push(immediateData);
        }

        for (const [opcode, data] of Object.entries(opcodeTable)) {
            if (data.mnemonic === mnemonic && data.operands.includes(operand1)) {
                splitBytes.forEach((byte, index) => {
                    const assembled = byte ? `${opcode}${byte}` : opcode;
                    result += `${(address + index * 2).toString(16).toUpperCase()}  ${assembled.padEnd(6, " ")}  ${line}\n`;
                });
                address += splitBytes.length * 2;
                break;
            }
        }
    });

    document.getElementById("simulationResult").innerText = result.trim();
}

// Address Calculator Function
function addSubtractAddress() {
    const address1 = document.getElementById("address1").value.trim();
    const address2 = document.getElementById("address2").value.trim();
    const operation = document.getElementById("addressOperation").value;

    if (!address1 || !address2) {
        document.getElementById("addressResult").innerText = "Error: Please provide both addresses.";
        return;
    }

    const addr1 = parseInt(address1, 16);
    const addr2 = parseInt(address2, 16);

    if (isNaN(addr1) || isNaN(addr2)) {
        document.getElementById("addressResult").innerText = "Error: Invalid address format.";
        return;
    }

    let result;
    if (operation === "add") {
        result = addr1 + addr2;
    } else if (operation === "subtract") {
        result = addr1 - addr2;
    } else {
        document.getElementById("addressResult").innerText = "Error: Invalid operation.";
        return;
    }

    document.getElementById("addressResult").innerText = `Result: ${result.toString(16).toUpperCase()}`;
}

// Execution Time Calculator
function calculateExecutionTime() {
    const frequency = parseFloat(document.getElementById("oscillatorFrequency").value) * 1e6;
    const instructions = document.getElementById("instructionInput").value.trim().split("\n");
    let totalCycles = 0;

    instructions.forEach(line => {
        const mnemonic = line.split(" ")[0].toUpperCase();
        const data = Object.values(opcodeTable).find(op => op.mnemonic === mnemonic);
        if (data) totalCycles += data.cycles;
    });

    const executionTime = totalCycles / frequency;
    document.getElementById("executionResult").innerText = `Total Cycles: ${totalCycles}\nExecution Time: ${(executionTime * 1e6).toFixed(3)} µs`;
}

// Read/Write Memory Function
function readWriteMemory(operation) {
    const value = document.getElementById("memoryValue").value.trim();
    const address = document.getElementById("memoryAddress").value.trim();

    if (!value || !address) {
        alert("Please provide both address and value.");
        return;
    }

    const addr = parseInt(address, 16);
    if (isNaN(addr)) {
        alert("Invalid address format.");
        return;
    }

    if (operation === "read") {
        document.getElementById("memoryResult").innerText = `Value at ${address}: Simulated value here`; // Simulate read
    } else if (operation === "write") {
        document.getElementById("memoryResult").innerText = `Written ${value} to ${address}`;
    } else {
        alert("Invalid operation.");
    }
}

// Display Example Programs
function showExampleProgram(type) {
    const examples = {
        packedToAscii: `
; Convert Packed BCD to ASCII
MOV A, #45H
SWAP A
ANL A, #0FH
MOV R0, A
        `,
        asciiToPacked: `
; Convert ASCII to Packed BCD
MOV A, #4AH
ORL A, #0FH
MOV R0, A
        `
    };

    document.getElementById("exampleProgramOutput").innerText = examples[type] || "No example available.";
}
