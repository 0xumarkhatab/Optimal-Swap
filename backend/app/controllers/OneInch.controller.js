const db = require("../models");
const OneInch = db.OneInch;

const Web3 = require("web3");
const axios = require("axios").default;
const ethers=require("ethers")
const chainId = 137;
const web3RpcUrl = "https://polygon-mainnet.infura.io/v3/0e88431708fb4d219a28755bf50fb061"; // The URL for the Polygon node you want to connect to
const web3 = new Web3.Web3(web3RpcUrl);

const walletAddress = "0x927F750555A2e72E4670a45733CBA3d794516Fe8"; // Set your wallet address (replace '0x...xxx' with your actual wallet address)
const _privateKey =
  "00061993a7a116548044e16ee9cae2781d01cfa86262f5807b82bfdc5dcbb3b0cf8"; // Set the private key of your wallet (replace '0x...xxx' with your actual private key). NEVER SHARE THIS WITH ANYONE!
const privateKey = _privateKey.slice(3);
console.log({ privateKey });
const _1inchTokenAddress = "0x9c2C5fd7b07E95EE044DDeba0E97a665F142394f";
const _daiTokenAddress = "0x84000b263080BC37D1DD73A29D92794A6CF1564e";
const swapAmount = 0.01;
const broadcastApiUrl =
  "https://tx-gateway.1inch.io/v1.1/" + chainId + "/broadcast";
const apiBaseUrl = "https://api.1inch.io/v5.2/" + chainId;

const API_TOKEN = "Bearer MlhEps5HQRxJXRsZahy1AEUtC7PAjksY";
// const swapParams = {
//   fromTokenAddress: _1inchTokenAddress, // The address of the token you want to swap from (1INCH)
//   toTokenAddress: _daiTokenAddress, // The address of the token you want to swap to (DAI)
//   amount: web3.utils.toWei(swapAmount, "wei"), // The amount of the fromToken you want to swap (in wei)
//   fromAddress: walletAddress, // Your wallet address from which the swap will be initiated
//   slippage: 1, // The maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
//   disableEstimate: false, // Whether to disable estimation of swap details (set to true to disable)
//   allowPartialFill: false, // Whether to allow partial filling of the swap order (set to true to allow)
// };
// console.log(swapParams);

// Construct full API request URL
function apiRequestUrl(_url, queryParams) {
  return _url + "?" + new URLSearchParams(queryParams).toString();
}

exports.checkAllowance = async function checkAllowance(
  tokenAddress,
  walletAddress
) {
  try {
    const response = await axios.get(
      "https://api.1inch.dev/swap/v5.2/137/approve/allowance",
      {
        headers: {
          Authorization: API_TOKEN,
        },
        params: {
          tokenAddress,
          walletAddress,
        },
      }
    );
    // console.log(response);
    let allowance = 0;
    if (response && response.data && response.data.allowance) {
      allowance = response.data.allowance;
    }
    return allowance;
  } catch (e) {
    console.log(e);
  }
};

// async function checkAllowance(tokenAddress, walletAddress) {
//   console.log("checking allowance of ", walletAddress, " for ", tokenAddress);
//   let apiURL = apiRequestUrl("/approve/allowance", {
//     tokenAddress,
//     walletAddress,
//   });
//   let res = await fetch(apiURL);
//   console.log(res);
// }

// Post raw transaction to the API and return transaction hash
async function broadCastRawTransaction(rawTransaction) {
  try {
    let txHash = await fetch(broadcastApiUrl, {
      method: "post",
      body: JSON.stringify({ rawTransaction }),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((res) => {
        console.log("submitted transaction ", res.transactionHash);
        return res.transactionHash;
      });
    return txHash;
  } catch (e) {
    console.log("error occured in transaction broadcast!!", e);
    return e;
  }
}

// Sign and post a transaction, return its hash
exports.signAndSendTransaction = async function signAndSendTransaction(
  transaction,
  _privateKey
) {
  const { rawTransaction } = await web3.eth.accounts.signTransaction(
    transaction,
    _privateKey
  );
  console.log("signed transaction !!!!", rawTransaction);
  return await broadCastRawTransaction(rawTransaction);
};

// Prepare approval transaction, considering gas limit
exports.buildTxForApproveTradeWithRouter =
  async function buildTxForApproveTradeWithRouter(tokenAddress, amount) {
    const response = await axios.get(
      "https://api.1inch.dev/swap/v5.2/137/approve/allowance",
      {
        headers: {
          Authorization: API_TOKEN,
        },
        params: {
          tokenAddress,
          walletAddress,
        },
      }
    );

    const transaction = response.data;

    const gasLimit = await web3.eth.estimateGas({
      ...transaction,
      from: walletAddress,
    });

    return {
      ...transaction,
      gas: gasLimit,
    };
  };

// Prepare the transaction data for the swap by making an API request
exports.buildTxForSwap = async function buildTxForSwap(swapParams) {
  const response = await axios.get("https://api.1inch.dev/swap/v5.2/137/swap", {
    headers: {
      Authorization: API_TOKEN,
    },
    params: {
      ...swapParams,      
    },
  });

  // Fetch the swap transaction details from the API
  return response.data;
};

exports.hello = async function Hello() {
  res.send("This is the sub router");
};

// Create and Save a new OneInch
// exports.create = (req, res) => {
//   // Validate request
//   if (!req.body.title) {
//     res.status(400).send({ message: "Content can not be empty!" });
//     return;
//   }

//   // Create a OneInch
//   const OneInch = new OneInch({
//     title: req.body.title,
//     description: req.body.description,
//     published: req.body.published ? req.body.published : false
//   });

//   // Save OneInch in the database
//   OneInch
//     .save(OneInch)
//     .then(data => {
//       res.send(data);
//     })
//     .catch(err => {
//       res.status(500).send({
//         message:
//           err.message || "Some error occurred while creating the OneInch."
//       });
//     });
// };

// Retrieve all OneInch from the database.
exports.findAll = (req, res) => {
  const title = req.query.title;
  var condition = title
    ? { title: { $regex: new RegExp(title), $options: "i" } }
    : {};

  OneInch.find(condition)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving OneInch.",
      });
    });
};

// Find a single OneInch with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  OneInch.findById(id)
    .then((data) => {
      if (!data)
        res.status(404).send({ message: "Not found OneInch with id " + id });
      else res.send(data);
    })
    .catch((err) => {
      res
        .status(500)
        .send({ message: "Error retrieving OneInch with id=" + id });
    });
};

// Update a OneInch by the id in the request
exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!",
    });
  }

  const id = req.params.id;

  OneInch.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update OneInch with id=${id}. Maybe OneInch was not found!`,
        });
      } else res.send({ message: "OneInch was updated successfully." });
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating OneInch with id=" + id,
      });
    });
};

// Delete a OneInch with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  OneInch.findByIdAndRemove(id, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot delete OneInch with id=${id}. Maybe OneInch was not found!`,
        });
      } else {
        res.send({
          message: "OneInch was deleted successfully!",
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete OneInch with id=" + id,
      });
    });
};

// Delete all OneInch from the database.
exports.deleteAll = (req, res) => {
  OneInch.deleteMany({})
    .then((data) => {
      res.send({
        message: `${data.deletedCount} OneInch were deleted successfully!`,
      });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all OneInch.",
      });
    });
};

// Find all published OneInch
exports.findAllPublished = (req, res) => {
  OneInch.find({ published: true })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving OneInch.",
      });
    });
};
