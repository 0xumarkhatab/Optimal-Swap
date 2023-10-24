module.exports = app => {
    const OneInch = require("../controllers/OneInch.controller.js");
  
    var router = require("express").Router();
    router.get("/",  OneInch.hello);

    // router.post("/oneInch",);
  };
  