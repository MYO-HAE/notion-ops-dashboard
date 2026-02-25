const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = '7e4gZonHhdNuSDC1MSUSqDitOEjY_VWIYXTVx-au';
const ACCOUNT_ID = 'c2bc22672e86741139fa54b620a98f35';
const PROJECT_NAME = 'notion-ops-dashboard';
const DIST_DIR = './dist';

// Get all files recursively
function getFiles(dir, basePath = '') {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = basePath ? `${basePath}/${item}` : item;
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getFiles(fullPath, relativePath));
    } else {
      files.push({
        path: relativePath,
        fullPath: fullPath,
        content: fs.readFileSync(fullPath)
      });
    }
  }
  
  return files;
}

// Create a deployment
const createDeployment = (files) => {
  return new Promise((resolve, reject) => {
    // Build manifest
    const manifest = {};
    for (const file of files) {
      // Skip directories and calculate hash
      manifest[file.path] = {
        size: file.content.length,
        hash: Date.now().toString() // Simplified hash for demo
      };
    }

    const postData = JSON.stringify({
      branch: 'main',
      manifest: manifest
    });

    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

// Upload file
const uploadFile = (deploymentId, file) => {
  return new Promise((resolve, reject) => {
    const postData = file.content;
    
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments/${deploymentId}/files/${file.path}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

async function main() {
  try {
    console.log('Collecting files...');
    const files = getFiles(DIST_DIR);
    console.log(`Found ${files.length} files`);
    
    console.log('Creating deployment...');
    const deployment = await createDeployment(files);
    
    if (!deployment.success) {
      console.error('Failed to create deployment:', deployment.errors);
      process.exit(1);
    }
    
    console.log('Deployment created:', deployment.result.id);
    console.log('Uploading files...');
    
    for (const file of files) {
      process.stdout.write(`  Uploading ${file.path}... `);
      try {
        await uploadFile(deployment.result.id, file);
        console.log('OK');
      } catch (e) {
        console.log('FAILED:', e.message);
      }
    }
    
    console.log('\nDeployment complete!');
    console.log('URL:', deployment.result.url);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();