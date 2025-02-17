const User = require("../models/User");

const getUser = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.log(error);
  }
};

const postUser = async (req, res) => {
  try {
    const { name, password, isAdmin = false } = req.body;

    const user = await User.create({ name, password, isAdmin });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el usuario" });
  }
};

module.exports = {
  getUser,
  postUser,
};
