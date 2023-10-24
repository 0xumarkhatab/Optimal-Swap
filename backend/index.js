const Web3 = require("web3");
const yesno = require("yesno");
const axios = require("axios").default;

const chainId = 137;
const web3RpcUrl = "https://polygon-mainnet.infura.io"; // The URL for the Polygon node you want to connect to
const walletAddress = "0x927F750555A2e72E4670a45733CBA3d794516Fe8"; // Set your wallet address (replace '0x...xxx' with your actual wallet address)
const _privateKey =
  "61993a7a116548044e16ee9cae2781d01cfa86262f5807b82bfdc5dcbb3b0cf8"; // Set the private key of your wallet (replace '0x...xxx' with your actual private key). NEVER SHARE THIS WITH ANYONE!
const privateKey =
  "61993a7a116548044e16ee9cae2781d01cfa86262f5807b82bfdc5dcbb3b0cf8";
console.log({ privateKey });
const _1inchTokenAddress = "0x9c2C5fd7b07E95EE044DDeba0E97a665F142394f";
const _daiTokenAddress = "0x84000b263080BC37D1DD73A29D92794A6CF1564e";
const swapAmount = 0.01;
const broadcastApiUrl =
  "https://api.1inch.dev/tx-gateway/v1.1/" + chainId + "/broadcast";
const apiBaseUrl = "https://api.1inch.io/v5.2/" + chainId;
const API_TOKEN="Bearer MlhEps5HQRxJXRsZahy1AEUtC7PAjksY"
const web3 = new Web3.Web3(web3RpcUrl);

const swapParams = {
  fromTokenAddress: _1inchTokenAddress, // The address of the token you want to swap from (1INCH)
  toTokenAddress: _daiTokenAddress, // The address of the token you want to swap to (DAI)
  amount: web3.utils.toWei(swapAmount, "wei"), // The amount of the fromToken you want to swap (in wei)
  fromAddress: walletAddress, // Your wallet address from which the swap will be initiated
  slippage: 1, // The maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
  disableEstimate: false, // Whether to disable estimation of swap details (set to true to disable)
  allowPartialFill: false, // Whether to allow partial filling of the swap order (set to true to allow)
};
console.log(swapParams);

// Construct full API request URL
function apiRequestUrl(_url, queryParams) {
  return _url + "?" + new URLSearchParams(queryParams).toString();
}

async function checkAllowance(tokenAddress, walletAddress) {
  try {
    const response = await axios.get(
      `https://api.1inch.dev/swap/v5.2/137/approve/allowance?tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`,
      {
        headers: {
          Authorization: API_TOKEN,
        },
      }
    );
    // console.log(response);
    let allowance = 0;
    if (response && response.data && response.data.allowance) {
      console.log("allowance res ", response.data);
      allowance = response.data.allowance;
    }
    return allowance;
  } catch (e) {
    console.log("ERror in allwoance : ", e);
  }
}

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
  // let res=  await axios.post(
  //     broadcastApiUrl,
  //     {
  //       headers: {
  //         Authorization: "Bearer MlhEps5HQRxJXRsZahy1AEUtC7PAjksY",
  //       },
  //       params: {
  //        rawTransaction
  //       },
  //     }
  //   );

  let res = fetch(broadcastApiUrl, {
    method: "post",
    body: { rawTransaction },
    headers: {
      "Content-Type": "application/json",
      Authorization: API_TOKEN,
    },
  });
  res = (await res).json;
  console.log("tx has ", res);
}

// Sign and post a transaction, return its hash
async function signAndSendTransaction(transaction) {
  const { rawTransaction } = await web3.eth.accounts.signTransaction(
    transaction,
    privateKey
  );
  console.log("print raw tx", rawTransaction);

  // return await broadCastRawTransaction(rawTransaction);
}

// Prepare approval transaction, considering gas limit
exports.buildTxForApproveTrx = async function buildTxForApproveTradeWithRouter(tokenAddress, amount) {
  try {
    const url =
      "https://api.1inch.dev/swap/v5.2/137/approve/transaction?tokenAddress=0x9c2C5fd7b07E95EE044DDeba0E97a665F142394f&amount=1";

    const options = {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: API_TOKEN,
      },
    };

    fetch(url, options)
      .then((response)=>{
        console.log("trx data is ",(response));
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    // let transaction = await axios.get(
    //   `https://api.1inch.dev/swap/v5.2/137/approve/transaction?tokenAddress=${tokenAddress}&amount=${amount}`,
    //   {
    //     headers: {
    //       "Authorization": "Bearer MlhEps5HQRxJXRsZahy1AEUtC7PAjksY",
    //       "Accept": "application/json"
    //     },
    //         }
    // );
    // transaction = transaction.data;
    // console.log("built transaction ", transaction);
    // //   console.log(response);

    // const gasLimit = await web3.eth.estimateGas({
    //   ...transaction,
    //   from: walletAddress,
    // });

    // return {
    //   ...transaction,
    //   gas: gasLimit,
    // };
  } catch (e) {
    console.log("error in build approval tx ", e);
  }
}
// Prepare the transaction data for the swap by making an API request
async function buildTxForSwap(swapParams) {
  const url = apiRequestUrl("/swap", swapParams);

  // Fetch the swap transaction details from the API
  return fetch(url)
    .then((res) => res.json())
    .then((res) => res.tx);
}

async function main() {
  let res = await checkAllowance(_1inchTokenAddress, walletAddress);
  console.log("allowance : ", res);
  // return
  if (res == 0) {
    let tx = await buildTxForApproveTradeWithRouter(
      _1inchTokenAddress,
      // web3.utils.toWei("2", "ether")
      "10"
    );
    const ok = await yesno({
      question:
        "Do you want to send a transaction to approve trade with 1inch router?",
    });

    if (!ok) {
      return false;
    }

    const approveTxHash = await signAndSendTransaction(tx);
    console.log("Approve tx hash: ", approveTxHash);
  }
}
main();
