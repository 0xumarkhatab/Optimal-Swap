module.exports = app => {
    const OneInch = require("../controllers/OneInch.controller.js");
  
    var router = require("express").Router();
  console.log("inside oneInch ",router);
    router.get("/hi",  OneInch.hello);
    // router.post("/oneInch",);
  };
  