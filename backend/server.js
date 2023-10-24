/**
 *
 *    Configuring Database
 *
 */
const express = require("express");
const cors = require("cors");

const Web3 = require("web3");
const web3RpcUrl = "https://polygon-mainnet.infura.io/v3/0e88431708fb4d219a28755bf50fb061"; // The URL for the Polygon node you want to connect to
const web3 = new Web3.Web3(web3RpcUrl);

const app = express();

var corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
const db = require("./app/models");
const OneInchRoutes = require("./app/routes/OneInch.routes");
const {
  checkAllowance,
  buildTxForApproveTradeWithRouter,
  buildTxForSwap,
  signAndSendTransaction,
} = require("./app/controllers/OneInch.controller");

db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to SwapFusion." });
});
/***
 *
 *
 *
 */

app.use("/allowance", async (req, res) => {
  console.log(req);

  const { tokenAddress, walletAddress } = req.query;
  let allowance = await checkAllowance(tokenAddress, walletAddress);
  res.send({ tokenAddress, walletAddress, allowance });
});

app.use("/swap", async (req, res) => {
  let tx = "";
  try {
    console.log("swap request");
    const { swapParams } = req.query;
    tx = await buildTxForSwap(swapParams);
    // tx.tx["nonce"]=await web3.eth.getTransactionCount(swapParams.fromAddress)
    console.log("trx ", tx);
  
    res.send({ tx:tx.tx.data });

  } catch (error) {
    console.error("swap error", error);

    // Check if the error is an Axios error and contains a response with error data
    if (error.response) {
      const { status, data } = error.response;
      const errorData = {
        status,
        error: data.error,
        description: data.description,
        requestId: data.requestId,
      };
      res.send({ tx: null, error: errorData });
    } else {
      // Handle other types of errors
      res.send({ tx: null, error: "Internal Server Error" });
    }
  }


});
// set port, listen for requests
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
