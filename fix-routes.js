const fs = require('fs');
const path = require('path');

// List of all route files that need to be fixed
const routeFiles = [
  'src/app/_layout.tsx',
  'src/app/index.tsx',
  'src/app/customer/auth.tsx',
  'src/app/customer/home.tsx',
  'src/app/customer/liveride.tsx',
  'src/app/customer/ridebooking.tsx',
  'src/app/customer/selectlocations.tsx',
  'src/app/rider/auth.tsx',
  'src/app/rider/home.tsx',
  'src/app/rider/liveride.tsx',
];

// Function to fix a route file
function fixRouteFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if the file already has a direct default export
    if (content.includes('export default function')) {
      console.log(`File already has direct default export: ${filePath}`);
      return;
    }

    // Extract the component name
    const componentNameMatch = content.match(/const\s+([A-Za-z0-9_]+)\s*=/);
    if (!componentNameMatch) {
      console.log(`Could not find component name in: ${filePath}`);
      return;
    }

    const componentName = componentNameMatch[1];
    
    // Replace arrow function with regular function
    content = content.replace(
      new RegExp(`const\\s+${componentName}\\s*=\\s*\\(\\)\\s*=>\\s*{`),
      `export default function ${componentName}() {`
    );
    
    // Remove the export default at the end
    content = content.replace(
      new RegExp(`export\\s+default\\s+${componentName};?\\s*$`),
      ''
    );

    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
  }
}

// Fix all route files
routeFiles.forEach(fixRouteFile);
console.log('All route files fixed!');
