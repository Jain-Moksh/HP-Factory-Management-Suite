const masterQueries = {
    // Items
    getAllItems: 'SELECT * FROM items ORDER BY name ASC',
    searchItems: 'SELECT * FROM items WHERE name ILIKE $1 ORDER BY name ASC',
    getItemById: 'SELECT * FROM items WHERE id = $1',
    createItem: 'INSERT INTO items (name, rate, stock, conversion, unit) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    updateItem: 'UPDATE items SET name = $1, rate = $2, stock = $3, conversion = $4, unit = $5 WHERE id = $6 RETURNING *',

    // Clients
    getAllClients: 'SELECT * FROM clients ORDER BY name ASC',
    searchClients: 'SELECT * FROM clients WHERE name ILIKE $1 ORDER BY name ASC',
    getClientById: 'SELECT * FROM clients WHERE id = $1',
    createClient: 'INSERT INTO clients (name, street, city, shortform, balance, remark) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    updateClient: 'UPDATE clients SET name = $1, street = $2, city = $3, shortform = $4, balance = $5, remark = $6 WHERE id = $7 RETURNING *',

    // Jobbers
    getAllJobbers: 'SELECT * FROM jobbers ORDER BY name ASC',
    searchJobbers: 'SELECT * FROM jobbers WHERE name ILIKE $1 ORDER BY name ASC',
    getJobberById: 'SELECT * FROM jobbers WHERE id = $1',
    createJobber: 'INSERT INTO jobbers (name) VALUES ($1) RETURNING *',
    updateJobber: 'UPDATE jobbers SET name = $1 WHERE id = $2 RETURNING *',

    // Transporters
    getAllTransporters: 'SELECT * FROM transporters ORDER BY name ASC',
    searchTransporters: 'SELECT * FROM transporters WHERE name ILIKE $1 ORDER BY name ASC',
    getTransporterById: 'SELECT * FROM transporters WHERE id = $1',
    createTransporter: 'INSERT INTO transporters (name) VALUES ($1) RETURNING *',
    updateTransporter: 'UPDATE transporters SET name = $1 WHERE id = $2 RETURNING *',
};

module.exports = masterQueries;
