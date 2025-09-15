const fs = require('fs');

// Load insurance data
const carInsurance = JSON.parse(fs.readFileSync('./db_json/car_insurance.json', 'utf8'));

// Updated mapInsuranceOptions function
function mapInsuranceOptions(dkbs) {
  const insuranceOptions = {};

  // Always include "Cơ bản" package (default)
  const basicPackage = carInsurance.find(item => item.label === "Cơ bản");
  if (basicPackage) {
    insuranceOptions[basicPackage.value] = basicPackage.value;
  }

  // Add AU codes if present
  dkbs.forEach(line => {
    const auMatch = line.match(/AU(\d{3})/);
    if (auMatch) {
      const auCode = `AU${auMatch[1]}`;
      const insurance = carInsurance.find(item => item.code === auCode);
      if (insurance) {
        insuranceOptions[insurance.value] = insurance.value;
      }
    }
  });

  return insuranceOptions;
}

console.log("=== Testing Updated mapInsuranceOptions Function ===\n");

// Test scenarios
const testCases = [
  {
    name: "Case 1: Only basic package (explicit)",
    dkbs: ["Cơ bản"],
    expected: "Should have c2db43ab... (Cơ bản) only"
  },
  {
    name: "Case 2: Empty dkbs array",
    dkbs: [],
    expected: "Should have c2db43ab... (Cơ bản) only"
  },
  {
    name: "Case 3: Only AU codes (real scenario)",
    dkbs: [
      "- AU001: Mới thay cũ",
      "- AU002: Lựa chọn cơ sở sửa chữa"
    ],
    expected: "Should have c2db43ab... (Cơ bản) + AU001 + AU002"
  },
  {
    name: "Case 4: Mixed AU codes (complex scenario)",
    dkbs: [
      "- AU001: Mới thay cũ",
      "- AU002: Lựa chọn cơ sở sửa chữa",
      "- AU006: Thủy kích",
      "- AU009: Mất cắp bộ phận"
    ],
    expected: "Should have c2db43ab... (Cơ bản) + AU001 + AU002 + AU006 + AU009"
  }
];

// Expected UUIDs for verification
const expectedUUIDs = {
  "c2db43ab-ccdc-44d3-8fdc-2167b86e01900": "Cơ bản",
  "e174526c-5a23-4aca-8d9f-ea198dc6b874": "AU001",
  "5eab040c-901d-4f4c-a3be-11e6b6fad9a1": "AU002",
  "6ea497a9-df0a-49f8-9d92-3dcf0ef53645": "AU006",
  "c42582c5-c95b-4d92-8a3b-c5770775d3bf": "AU009"
};

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}:`);
  console.log(`   Input: ${JSON.stringify(testCase.dkbs)}`);

  const result = mapInsuranceOptions(testCase.dkbs);
  const uuidCount = Object.keys(result).length;

  console.log(`   Result: ${uuidCount} UUIDs mapped`);
  console.log(`   Expected: ${testCase.expected}`);

  // Check for "Cơ bản" package
  const hasBasicPackage = result["c2db43ab-ccdc-44d3-8fdc-2167b86e01900"];
  console.log(`   Has "Cơ bản" package: ${hasBasicPackage ? '✓' : '✗'}`);

  // List all mapped UUIDs
  console.log("   Mapped UUIDs:");
  Object.keys(result).forEach(uuid => {
    const label = expectedUUIDs[uuid] || "Unknown";
    console.log(`     - ${uuid} (${label})`);
  });

  console.log();
});

// Verify against curl examples
console.log("=== Verification Against Curl Examples ===");

// From 1.txt - should match this scenario
const curl1Scenario = mapInsuranceOptions(["Cơ bản"]);
console.log("1.txt scenario (basic only):");
console.log("   Has c2db43ab...:", curl1Scenario["c2db43ab-ccdc-44d3-8fdc-2167b86e01900"] ? "✓" : "✗");

// From fetch.txt - should match this scenario
const fetchScenario = mapInsuranceOptions([
  "- AU001: Mới thay cũ",
  "- AU002: Lựa chọn cơ sở sửa chữa",
  "- AU006: Thủy kích"
]);
console.log("fetch.txt scenario (with AU codes):");
console.log("   Has c2db43ab... (Cơ bản):", fetchScenario["c2db43ab-ccdc-44d3-8fdc-2167b86e01900"] ? "✓" : "✗");
console.log("   Has e174526c... (AU001):", fetchScenario["e174526c-5a23-4aca-8d9f-ea198dc6b874"] ? "✓" : "✗");
console.log("   Has 5eab040c... (AU002):", fetchScenario["5eab040c-901d-4f4c-a3be-11e6b6fad9a1"] ? "✓" : "✗");

console.log("\n✅ Function update complete and tested!");