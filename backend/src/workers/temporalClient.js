const { Client, Connection } = require('@temporalio/client');

let client = null;

async function getTemporalClient() {
  if (client) return client;

  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  client = new Client({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
  });

  return client;
}

module.exports = { getTemporalClient };
