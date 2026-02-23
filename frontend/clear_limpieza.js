const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://frontier:frontier_dev@localhost:5432/frontier_db' });

client.connect().then(() => {
    return client.query(`DELETE FROM "operational_events" WHERE "event_type" IN ('LIMPIEZA', 'CLEANING') OR area_id IN (SELECT id FROM "operational_areas" WHERE name ILIKE '%Limpieza%')`);
}).then((res) => {
    console.log('Deleted ' + res.rowCount);
    client.end();
}).catch(console.error);
