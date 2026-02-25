const fs = require('fs');
const https = require('https');

const TOKEN = '7e4gZonHhdNuSDC1MSUSqDitOEjY_VWIYXTVx-au';
const PROJECT_NAME = 'notion-ops-dashboard';

// First, try to get account ID
const getAccounts = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      path: '/client/v4/accounts',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
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
    req.end();
  });
};

// Create or get Pages project
const getOrCreateProject = (accountId) => {
  return new Promise((resolve, reject) => {
    // Try to get existing project first
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${accountId}/pages/projects/${PROJECT_NAME}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            resolve(result.result);
          } else {
            // Project doesn't exist, create it
            createProject(accountId).then(resolve).catch(reject);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

const createProject = (accountId) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: PROJECT_NAME,
      production_branch: 'main'
    });

    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${accountId}/pages/projects`,
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
          if (result.success) {
            resolve(result.result);
          } else {
            reject(new Error(JSON.stringify(result.errors)));
          }
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
    console.log('Getting accounts...');
    const accounts = await getAccounts();
    
    if (!accounts.success) {
      console.error('Failed to get accounts:', accounts.errors);
      process.exit(1);
    }
    
    if (!accounts.result || accounts.result.length === 0) {
      console.error('No accounts found');
      process.exit(1);
    }
    
    const accountId = accounts.result[0].id;
    console.log('Account ID:', accountId);
    
    console.log('Getting/creating project...');
    const project = await getOrCreateProject(accountId);
    console.log('Project:', project.name);
    console.log('Deployment URL pattern:', `https://${project.subdomain}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();