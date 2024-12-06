let opcodeTable = {}; // Load opcode definitions dynamically

document.addEventListener("DOMContentLoaded", async () => {
    // โหลด JSON
    try {
        const response = await fetch("opcodeTable_merged.json");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        opcodeTable = await response.json();
    } catch (error) {
        console.error("Error loading opcode table:", error);
    }

    // เปิดใช้งาน Tooltip
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

function convertAndCalculate() {
    const number1 = document.getElementById("number1").value.trim();
    const number2 = document.getElementById("number2").value.trim();
    const base = parseInt(document.getElementById("base").value);
    const operation = document.getElementById("numberOperation").value;

    if (!number1 || isNaN(parseInt(number1, base))) {
        alert("Invalid input for Number 1! Please provide a valid number and select the correct base.");
        return;
    }

    const decimal1 = parseInt(number1, base);
    let decimal2 = 0;

    if (operation !== "none" && number2) {
        if (!number2 || isNaN(parseInt(number2, base))) {
            alert("Invalid input for Number 2! Please provide a valid number for the operation.");
            return;
        }
        decimal2 = parseInt(number2, base);
    }

    let resultDecimal;

    switch (operation) {
        case "add":
            resultDecimal = decimal1 + decimal2;
            break;
        case "subtract":
            resultDecimal = decimal1 - decimal2;
            break;
        case "multiply":
            resultDecimal = decimal1 * decimal2;
            break;
        case "divide":
            if (decimal2 === 0) {
                alert("Division by zero is not allowed.");
                return;
            }
            resultDecimal = Math.floor(decimal1 / decimal2); // Integer division
            break;
        case "none":
        default:
            resultDecimal = decimal1; // Just convert number1
            break;
    }

    // Update conversion results
    document.getElementById("resultBinary").innerText = resultDecimal.toString(2);
    document.getElementById("resultOctal").innerText = resultDecimal.toString(8);
    document.getElementById("resultDecimal").innerText = resultDecimal.toString(10);
    document.getElementById("resultHexadecimal").innerText = resultDecimal.toString(16).toUpperCase();

    // Packed and Unpacked BCD Conversion
    if (base === 10 && number1.length <= 2) {
        const digits = number1.padStart(2, "0").split("").map(d => parseInt(d, 10));
        const packedBCD = ((digits[0] << 4) | digits[1]).toString(2).padStart(8, "0"); // Binary representation
        const unpackedBCD = `MSB: ${digits[0]} LSB: ${digits[1]}`;
        document.getElementById("packResult").innerText = packedBCD;
        document.getElementById("unpackResult").innerText = unpackedBCD;
    } else {
        document.getElementById("packResult").innerText = "N/A";
        document.getElementById("unpackResult").innerText = "N/A";
    }
}

// Simulate Assembly Function with Aligned Formatting
function simulateAssembly() {
    const instructions = document.getElementById("assemblyInput").value.trim().split("\n");
    let address = 0x8000; // Starting memory address
    let result = "";

    instructions.forEach(line => {
        const match = line.match(/(\w+)\s+(@?\w+)?[,]?\s*(#\w+)?/);
        if (!match) {
            result += `Error: Invalid format '${line}'\n`;
            return;
        }

        const [_, mnemonic, operand1, operand2] = match;
        let immediateData = operand2 && operand2.startsWith("#") ? operand2.slice(1).toUpperCase() : null;
        let splitBytes = [];

        // Handle Immediate Data
        if (immediateData && parseInt(immediateData, 16) > 0xFF) {
            while (immediateData.length > 2) {
                splitBytes.push(immediateData.slice(0, 2));
                immediateData = immediateData.slice(2);
            }
            splitBytes.push(immediateData);
        } else if (immediateData) {
            splitBytes.push(immediateData);
        }

        let matched = false;

        // Match with opcode table
        for (const [opcode, data] of Object.entries(opcodeTable)) {
            if (
                data.mnemonic === mnemonic && // Match mnemonic
                (!operand1 || data.operands.includes(operand1)) // Match operand1 if exists
            ) {
                if (splitBytes.length > 0) {
                    // Handle Immediate Data with multiple bytes
                    splitBytes.forEach((byte, index) => {
                        const assembled = `${opcode}${byte}`;
                        result += `${(address + index * 2).toString(16).toUpperCase().padStart(4, "0")}  `.padEnd(8, " ") +
                                  `${assembled.padEnd(6, " ")}  `.padEnd(10, " ") +
                                  `${mnemonic} ${operand1 || ""},#${byte}\n`;
                    });
                    address += splitBytes.length * 2;
                } else {
                    // Handle instructions without Immediate Data
                    result += `${address.toString(16).toUpperCase().padStart(4, "0")}  `.padEnd(8, " ") +
                              `${opcode.padEnd(6, " ")}  `.padEnd(10, " ") +
                              `${mnemonic} ${operand1 || ""}\n`;
                    address += data.number_of_bytes;
                }
                matched = true;
                break;
            }
        }

        if (!matched) {
            result += `Error: No matching opcode found for '${line}'\n`;
        }
    });

    // Display the simulation result
    document.getElementById("simulationResult").innerText = result.trim();
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

function addSubtractAddress() {
    // ดึงค่าจาก input fields
    const address1 = document.getElementById("address1").value.trim();
    const address2 = document.getElementById("address2").value.trim();
    const operation = document.getElementById("addressOperation").value;

    // ตรวจสอบการใส่ค่าที่อยู่
    if (!address1 || !address2) {
        document.getElementById("addressResult").innerText = "Error: Please provide both addresses.";
        return;
    }

    // แปลงค่าที่อยู่จาก Hex เป็น Decimal
    const addr1 = parseInt(address1, 16);
    const addr2 = parseInt(address2, 16);

    // ตรวจสอบการแปลงค่า
    if (isNaN(addr1) || isNaN(addr2)) {
        document.getElementById("addressResult").innerText = "Error: Invalid address format. Please use valid Hexadecimal values.";
        return;
    }

    let result;

    // คำนวณตาม operation ที่เลือก
    if (operation === "add") {
        result = addr1 + addr2;
    } else if (operation === "subtract") {
        result = addr1 - addr2;
    } else {
        document.getElementById("addressResult").innerText = "Error: Invalid operation.";
        return;
    }

    // แสดงผลลัพธ์ใน Hexadecimal
    document.getElementById("addressResult").innerText = `Result: 0x${result.toString(16).toUpperCase()}`;
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

function simulateInstruction() {
    // Retrieve input elements
    const instructionElement = document.getElementById("instructionInputField");
    const registerInputElement = document.getElementById("registerInputField");

    // Check if elements exist and retrieve values
    if (!instructionElement || !registerInputElement) {
        console.error("Input elements not found in DOM.");
        document.getElementById("instructionResult").innerText = "Error: Input fields are missing.";
        return;
    }

    const instruction = instructionElement.value.trim();
    const registerValues = registerInputElement.value.trim();

    // Debugging: Ensure input values are retrieved
    console.log("Instruction:", instruction);
    console.log("Register Values:", registerValues);

    // Handle missing instruction
    if (!instruction) {
        const errorMsg = "Error: No instruction provided.";
        console.error(errorMsg);
        document.getElementById("instructionResult").innerText = errorMsg;
        return;
    }

    let result = "";

    // Parse instruction using regex
    const instructionMatch = instruction.match(/(\w+)\s+([A-Za-z0-9]+),?\s*([#A-Za-z0-9]*)?/);
    if (!instructionMatch) {
        result = `Error: Invalid instruction format '${instruction}'`;
        console.error(result);
        document.getElementById("instructionResult").innerText = result;
        return;
    }

    const [_, mnemonic, operand1, operand2] = instructionMatch;
    console.log("Parsed Instruction:", { mnemonic, operand1, operand2 });

    // Parse registers
    let registers = {};
    if (registerValues) {
        const registerMatches = registerValues.match(/([A-Za-z0-9]+)=([#A-Za-z0-9]+)/g);
        if (registerMatches) {
            registerMatches.forEach(pair => {
                const [key, value] = pair.split("=");
                registers[key.trim()] = value.trim();
            });
        }
    }
    console.log("Parsed Registers:", registers);

    try {
        // Handle instructions based on mnemonic
        switch (mnemonic.toUpperCase()) {
            case "ANL":
                if (operand1 === "A" && operand2.startsWith("#")) {
                    const aValue = parseInt(registers["A"], 16) || 0;
                    const immediate = parseInt(operand2.slice(1), 16);
                    const resultValue = aValue & immediate;
                    result = `ANL ${operand1}, ${operand2} → Result: A = 0x${resultValue.toString(16).toUpperCase()}`;
                } else {
                    throw new Error(`Unsupported operands for ANL: '${instruction}'`);
                }
                break;

            case "SWAP":
                if (operand1 === "A") {
                    const aValue = parseInt(registers["A"], 16) || 0;
                    const swappedValue = ((aValue & 0xF0) >> 4) | ((aValue & 0x0F) << 4);
                    result = `SWAP ${operand1} → Result: A = 0x${swappedValue.toString(16).toUpperCase()}`;
                } else {
                    throw new Error(`Unsupported operands for SWAP: '${instruction}'`);
                }
                break;

            default:
                throw new Error(`Unsupported instruction '${mnemonic}'`);
        }
    } catch (error) {
        result = error.message;
        console.error("Error during instruction processing:", error);
    }

    console.log("Simulation Result:", result);
    document.getElementById("instructionResult").innerText = result.trim();
}

// Display Example Programs or Specific Instruction Examples
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

    // If type matches predefined examples, show those
    if (examples[type]) {
        document.getElementById("exampleProgramOutput").innerText = examples[type];
        return;
    }

    // If type matches instructionExamples, show detailed instruction example
    const exampleItem = instructionExamples.find(item => item.command === type);
    if (exampleItem) {
        document.getElementById("exampleProgramOutput").innerText = `
Command: ${exampleItem.command}
Description: ${exampleItem.description}
Example: ${exampleItem.example}
        `;
        return;
    }

    document.getElementById("exampleProgramOutput").innerText = "No example available.";
}

function listOpcodes() {
    const opcodeListDiv = document.getElementById("opcodeList");

    // Toggle visibility
    if (opcodeListDiv.style.display === "block") {
        opcodeListDiv.style.display = "none"; // Close the list if already open
        return;
    }

    // Start building the list
    opcodeListDiv.innerHTML = "<strong>Available Instructions:</strong><br>";

    // Sort opcodes by numerical order
    const sortedOpcodes = Object.keys(opcodeTable)
        .sort((a, b) => parseInt(a, 16) - parseInt(b, 16)) // Sort by hexadecimal values
        .map(opcode => [opcode, opcodeTable[opcode]]); // Map sorted keys back to entries

    // Display sorted opcode list
    sortedOpcodes.forEach(([opcode, data]) => {
        opcodeListDiv.innerHTML += `
            <div style="margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                <strong>Opcode:</strong> ${opcode}<br>
                <strong>Mnemonic:</strong> ${data.mnemonic}<br>
                <strong>Operands:</strong> ${data.operands}<br>
                <strong>Number of Bytes:</strong> ${data.number_of_bytes}<br>
                <strong>Cycles:</strong> ${data.cycles}<br>
                <strong>Type:</strong> ${data.type}<br>
                <strong>Description:</strong> ${data.description}<br>
            </div>`;
    });

    opcodeListDiv.style.display = "block"; // Open the list
}

function toggleInstructionList() {
    const instructionListDiv = document.getElementById("instructionList");

    // Toggle visibility
    if (instructionListDiv.style.display === "block") {
        instructionListDiv.style.display = "none"; // Close the list if already open
        return;
    }

    // Clear and populate list
    instructionListDiv.innerHTML = "<strong>Supported Instructions:</strong><br>";
    instructionExamples.forEach((item, index) => {
        instructionListDiv.innerHTML += `
            <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                <strong>${index + 1}. ${item.command}</strong><br>
                <em>${item.description}</em><br>
                <button class="btn btn-link p-0 mt-1" onclick="alert('${item.example.replace(/'/g, "\\'")}')">Show Example</button>
            </div>`;
    });

    instructionListDiv.style.display = "block"; // Show the list
}
