// Basic CRUD from master logic
const baseController = require('./masterController').jobbers;

const jobberController = {
  ...baseController
};

module.exports = jobberController;
