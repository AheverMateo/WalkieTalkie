require("dotenv").config();
const { Sequelize } = require("sequelize");

const { DB_USER, DB_PASSWORD, DB_HOST, BDD, DB_DEPLOY } = process.env;

const sequelize = new Sequelize(
  //`postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${BDD}`
  DB_DEPLOY,
  {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

module.exports = sequelize;
