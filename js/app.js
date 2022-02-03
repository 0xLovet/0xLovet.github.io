const NFT_ADDRESS = "0xbfA7E1d5d6e1902c1dAAEa657DFe4527A9DAA84B"; //GARTT on mumbai
const TOKEN_ADDRESS = "0xe07D7B44D340216723eD5eA33c724908B817EE9D"; //USDT on mumbai
const MAX_MINT_AMOUNT = 1;
const MAX_SUPPLY = 1024;
const CHAIN_ID = 80001;

//Basic Actions Section
const connectButton = document.getElementById('connectButton');
const addressDisplay = document.getElementById("addressDisplay");
const approveButton = document.getElementById("approveButton");
const mintButton = document.getElementById("mintButton");

const imgLink = document.getElementById("mint-img-link");
const img = document.getElementById("logo");
const totalSupply = document.getElementById("totalSupply");
const textInfo = document.getElementById("textInfo");
const textPrice = document.getElementById("textPrice");
const textSupply = document.getElementById("textSupply");

var downloadingImage = new Image;
var mintAmount = 1;
var approved = false;
var cost;
var maxTokenWallet;
var tokenBalance;
var maxMintable;

const sleep = (milliseconds) => {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const isMetaMaskInstalled = () => {
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};

const smallAddressFormat = () => {
	var addr="";	
	for(i=0;i<5;i++){
		addr = addr + ethereum.selectedAddress[i]; 					
	}
	addr = addr + "..."
	for(i=4;i>0;i--){
		addr = addr + ethereum.selectedAddress[42-i]; 					
	}				
	return addr;
}

const getBG = () => {
	var n = Math.floor(Math.random() * MAX_SUPPLY)
	return "linear-gradient(rgba(0, 0, 0, 1),rgba(0, 0, 0, 0)) ,url('https://ipfs.io/ipfs/QmWCCqBcpyu7B2VpDR5wN4qPUEHMF5hyfUEr9YnANLw4Vz/" + n + ".svg'";
} 

/* Vivus */
new Vivus('logo',
        {
          type: "delayed",
          duration: 100,
          start: "inViewport"
});
/* Loading */
$(window).on("load",function(){
	$(".loader-wrapper").fadeOut("slow");
});

const initialize = () => {
	
	//init
    const web3 = new Web3(window.ethereum);
	const nft_contract = new web3.eth.Contract(nft_abi, NFT_ADDRESS);	
	const token_contract = new web3.eth.Contract(token_abi, TOKEN_ADDRESS);	//?

	approveButton.disabled = true;
	mintButton.disabled = true;

	//Bg image
	document.body.style.backgroundImage = getBG();
  
	const MetaMaskClientCheck = () => {
	if (!isMetaMaskInstalled()) {
		connectButton.innerHTML = "Please install MetaMask!";
	} else {
		
	}
	};

	/* CONNECT BUTTON */
	connectButton.onclick = async () => {
		connectButton.disabled=true;
		try {
			//Login
			await ethereum.request({ method: 'eth_requestAccounts' });
			const chainId = await ethereum.request({ method: 'eth_chainId' });

			//Get chain id 
			if(chainId == CHAIN_ID ){ 
				connectButton.innerHTML = "Mumbai";
				//Display address
				addressDisplay.innerHTML = "Address: " + smallAddressFormat();

				//Check cost and maxMintable then enable the right button
				await refresh();		
			}
			else{ 
				connectButton.innerHTML = "use Mumbai";
			}
			
		} catch (error) {
			console.error(error);
			connectButton.innerHTML = "Error...";
		}
	
	};

	/* APPROVE WETH */
	approveButton.onclick = async () => {
		approveButton.disabled=true;

		const response = await refresh();
		if( ethereum.selectedAddress.length > 0 && response){
			
			//Get cost
			nft_contract.methods.cost().call().then(async function (result) {
				cost = BigInt(result) *  BigInt(mintAmount);
				
				//Approve
				const encodedFunction = web3.eth.abi.encodeFunctionCall(token_approve_abi, [NFT_ADDRESS, cost]);
				const transactionParameters = {
					to: TOKEN_ADDRESS,
					from: ethereum.selectedAddress,
					data: encodedFunction
				};          

				// As with any RPC call, it may throw an error
				try {
					const txHash = await ethereum.request({
					method: 'eth_sendTransaction',
					params: [transactionParameters],
					});
					img.data = "images/logo_animated.svg";
					textInfo.innerHTML = "Waiting tx...";
					
					//WAITING FOR SUCCESS TX
					let txReceipt = null;
					while (txReceipt == null) { // Waiting expectedBlockTime until the transaction is mined
						txReceipt = await web3.eth.getTransactionReceipt(txHash);
						await sleep(2000)
					}
					if (txReceipt.status){		
						mintButton.disabled = false;
						approved = true;
						img.data = "images/logo.svg";
						textInfo.innerHTML = "Tx confirmed!<br>Click MINT to get your " + mintAmount + " $FITLIT."
					}
					else{
						textInfo.innerHTML = "Something goes wrong, check the transaction and retry."
						approveButton.disabled = false;
					}
				} catch (error){
					console.log(`Error: ${error.message}`);
					textInfo.innerHTML = "Something goes wrong, check the transaction or retry."
					approveButton.disabled = false;
				}
			});	
		} else{
			console.log("Error no address no mintAmount");
			approveButton.disabled = false;
		}    		
	};

	/* LOAD METADATA + IMAGE FROM IPFS */
	const get_img = async (tokenId) => {
		//Get metadata from contract
		nft_contract.methods.tokenURI(tokenId).call().then( async function (result) {
			const json_URL = "https://ipfs.io/ipfs/" + result.substring(7);
			img.data = "images/logo_animated.svg";

			//Get image from IPFS
			try{
				$.getJSON(json_URL, function(data) {
					var img_URL = data.image;
					const image_URI = "https://ipfs.io/ipfs/" + img_URL.substring(7);		
					textInfo.innerHTML = "Here is what you get: " + data.name + "<br>" +
											"Type: " + data.attributes[0].value + ", Area: " + data.attributes[1].value  + "<br>" +
											"I'm loading the image...";
					//Load image
					downloadingImage.onload = function() {
						imgLink.href = image_URI;
						img.data = this.src;
						textInfo.innerHTML = "Here is what you get: " + data.name + "<br>" +
												"Type: " + data.attributes[0].value + ", Area: " + data.attributes[1].value  + "<br>" +
												"Done! View on OpenSea";
						//Enable another mint
						if (cost > 0){
							approveButton.disabled = false;
						}
						else{
							mintButton.disabled = false;
						}
					};			
					downloadingImage.src = image_URI;
				});
			}catch(error){
				console.log(`Error: ${error.message}`);
				textInfo.innerHTML = "Sorry, something goes wrong, check on OpenSea.";
			}	
		});		
	}

	/* SEND MINT TRANSACTION AND CATCH EVENTS */
	mintButton.onclick = async () => {
		mintButton.disabled=true;
		var tokenId;
		
		const response = await refresh();
		if( ethereum.selectedAddress.length > 0 && response){
			//mint
			const encodedFunction = web3.eth.abi.encodeFunctionCall(nft_mint_abi, [mintAmount]);
			const transactionParameters = {
				to: NFT_ADDRESS,
				from: ethereum.selectedAddress,
				data: encodedFunction
			};              
			
			// As with any RPC call, it may throw an error
			try {
				const txHash = await ethereum.request({
				method: 'eth_sendTransaction',
				params: [transactionParameters],
				});
				img.data = "images/logo_animated.svg";	
				textInfo.innerHTML = "Waiting tx...";

				//WAITING FOR SUCCESS TX
				let txReceipt = null;
				while (txReceipt == null) { // Waiting expectedBlockTime until the transaction is mined
					txReceipt = await web3.eth.getTransactionReceipt(txHash);
					await sleep(2000)
				}

				//GET TOKEN ID FROM TX
				if (txReceipt.status){
					img.data = "images/logo.svg";
					textInfo.innerHTML="Your tx has been confirmed! I'm loading your new NFT...";				
					
					//Get tokenId
					if ( cost > 0 ) {
						tokenId = parseInt(txReceipt.logs[2].topics[3],16);
					}
					else{
						tokenId = parseInt(txReceipt.logs[0].topics[3],16);
					}
				}
				else{
					textInfo.innerHTML = "Something goes wrong, check the transaction or retry.";
					mintButton.disabled=false;
				}
			} catch (error){
				console.log(`Error: ${error.message}`);
				textInfo.innerHTML = "Something goes wrong, check the transaction or retry.";
				mintButton.disabled=false;
			}
		} else{
			console.log("Error no address no mintAmount");
			mintButton.disabled=false;
		}    
		//Image request from IPFS
		get_img(tokenId);
	}

	/* REFRESH PRICE AND SUPPLY */
	const refresh = async () => {
		//Get cost
		await nft_contract.methods.cost().call().then(async function (result) {
			cost = web3.utils.fromWei(result);
			if(cost == 0){
				approved = true;
			}
		});
		//Get maxMintable
		await nft_contract.methods.maxMintable().call().then(async function (result) {
			maxMintable = parseInt(result);
		});
		//Get Supply
		const response_maxMintable = await nft_contract.methods.getTotalSupply().call().then(async function (result) {
			if(result < maxMintable){
				textPrice.innerHTML = "PRICE: " + cost + " WETH";
				textSupply.innerHTML ="MINTED: " + result + "/" + maxMintable;
				return true;
			}
			else{
				textPrice.innerHTML = "SOLD OUT!";
				textSupply.innerHTML = "SOLD OUT!";
				textInfo.innerHTML = "SOLD OUT!";
				return false;
			}
		});
		//Get maxTokenWallet
		const response_maxWallet = await nft_contract.methods.maxTokenWallet().call().then(async function (result) {
			maxTokenWallet = parseInt(result);

			//Get balanceOf user
			const response = await nft_contract.methods.balanceOf(ethereum.selectedAddress).call().then(async function (result) {
				tokenBalance = parseInt(result);
				if ( tokenBalance >= maxTokenWallet ) {
					textInfo.innerHTML = "You already have enough $FITLIT!"
					return false;
				}
				else {
					if(response_maxMintable){
						if ( cost > 0) {
							if(!approved){
							textInfo.innerHTML = "Then click APPROVE to allow to spend WETH."
							approveButton.disabled = false;
							}
						}
						else{
							textInfo.innerHTML = "Then click MINT."
							mintButton.disabled = false;
						}
					}					
					return true;
				}
			});
			return response;
		});
		return response_maxWallet && response_maxMintable;
	};

	/* METAMASK EVENTS */
	ethereum.on('chainChanged', (chainId) => {
	// Handle the new chain.
	// Correctly handling chain changes can be complicated.
	// We recommend reloading the page unless you have good reason not to.
	window.location.reload();
	});
	ethereum.on("accountsChanged", accounts => {
	if (accounts.length > 0){
		console.log(`Account connected: ${accounts[0]}`);
		//Display address
		addressDisplay.innerHTML = "Address: " + smallAddressFormat();
		refresh();
	}
	else
		console.log("Account disconnected");
	});

	MetaMaskClientCheck();
}

window.addEventListener('DOMContentLoaded', initialize)
