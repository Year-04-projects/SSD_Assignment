const fs = require("fs");
const { remove } = require("../models/studentModel");

module.exports = async function (req, res, next) {
  try {
    if (!req.files || Object.keys(req.files).length === 0)
      return res.status(400).json({ msg: "No files were uploaded" });

    const file = req.files.file;

    console.log(file);
    if (file.size > 1024 * 1024) {
      removeTmp(file.tempFilePath);
      return res.status(400).json({ msg: "Size too large" });
    } // 1mb

    if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
      removeTmp(file.tempFilePath);
      return res.status(400).json({ msg: "File format not supported" });
    } // 1mb

    next();
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const removeTmp = (path) => {
  fs.unlink(path.replace(/^(\.\.(\/|\\|$))+/, ''), (err) => {
    if (err) throw err;
  });
};
