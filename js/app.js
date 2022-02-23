const NFT_ADDRESS = "0x5fB74c1597D43db0b326E27f8acd2270f80eC2e0"; //LOVET (Polygon)
const TOKEN_ADDRESS = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; //WETH (Polygon)
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/"
const MAX_MINT_AMOUNT = 1;
const MAX_SUPPLY = 1024;
const CHAIN_ID = 137;

const connectButton = document.getElementById('connectButton');
const approveButton = document.getElementById("approveButton");
const mintButton = document.getElementById("mintButton");

const imgLink = document.getElementById("mint-img-link");
const img = document.getElementById("logo");
const textInfo = document.getElementById("textInfo");
const textPrice = document.getElementById("textPrice");
const textSupply = document.getElementById("textSupply");
const refreshIcon = document.getElementById("refreshIcon");

var downloadingImage = new Image;
downloadingImage.setAttribute('crossOrigin', 'anonymous');
var mintAmount = 1;
var approved = false;
var cost;
var maxTokenWallet;
var tokenBalance;
var maxMintable;
var paused;


function scrollSmoothTo(elementId) {
	var element = document.getElementById(elementId);
	element.scrollIntoView({
	  block: 'start',
	  behavior: 'smooth'
	});
}

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

const countdown = () => {
	var countDownDate = new Date("Feb 21, 2022 15:00:00").getTime();
	var x = setInterval(function() {
		var now = new Date().getTime();
		var distance = countDownDate - now;
		var days = Math.floor(distance / (1000 * 60 * 60 * 24));
		var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
		var seconds = Math.floor((distance % (1000 * 60)) / 1000);

		document.getElementById("countdownButton").innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s";

		if (distance < 0) {
			clearInterval(x);
			document.getElementById("countdownButton").innerHTML= "MINT NOW"
		}
	}, 1000);
}

const initialize = () => {
	
	approveButton.disabled = true;
	mintButton.disabled = true;

	countdown();
	
	const web3 = new Web3(window.ethereum);
	const nft_contract = new web3.eth.Contract(nft_abi, NFT_ADDRESS);
	
	const MetaMaskClientCheck = () => {
	if (!isMetaMaskInstalled()) {
		connectButton.innerHTML = "Please install MetaMask!";
	} else {connectButton.innerHTML = "CONNECT";}
	};

	/* CONNECT button */
	connectButton.onclick = async () => {
		connectButton.disabled=true;
		try {
			//Login
			await ethereum.request({ method: 'eth_requestAccounts' });
			const chainId = await ethereum.request({ method: 'eth_chainId' });

			//Get chain id 
			if(chainId == CHAIN_ID ){ 
				connectButton.innerHTML = "Polygon";
				//Display address
				connectButton.innerHTML =  smallAddressFormat();

				//Check cost and maxMintable then enable the right button
				await refresh();		
			}
			else{ 
				connectButton.innerHTML = "use Polygon";
			}
			
		} catch (error) {
			console.error(error);
			connectButton.innerHTML = "Error: MetaMask is required!";
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
						img.data = "images/lovet.svg";
						textInfo.innerHTML = "Tx confirmed!<br>Click MINT to get your " + mintAmount + " $LOVET."
					}
					else{
						textInfo.innerHTML = "Something went wrong, check the transaction or retry."
						approveButton.disabled = false;
					}
				} catch (error){
					console.log(`Error: ${error.message}`);
					textInfo.innerHTML = "Something went wrong, check the transaction or retry."
					approveButton.disabled = false;
				}
			});	
		} else{
			console.log("Error no address no mintAmount");
			approveButton.disabled = false;
		}    		
	};

	/* Load metadata & image from IPFS */
	const get_img = async (tokenId) => {
		//Get metadata from contract
		nft_contract.methods.tokenURI(tokenId).call().then( async function (result) {
			const json_URL = IPFS_GATEWAY + result.substring(7);

			//Get image from IPFS
			try{
				$.getJSON(json_URL, function(data) {
					var img_URL = data.image;
					const image_URI = IPFS_GATEWAY + img_URL.substring(7);		
					textInfo.innerHTML = "Here is what you got: " + data.name + "<br>" +
											"Type: " + data.attributes[0].value + ", Background: " + data.attributes[1].value  + ", Area: " + data.attributes[2].value  + "<br>" +
											"I'm loading the image...";
					//Load image
					downloadingImage.onload = function() {
						imgLink.href = image_URI;
						//resize
						var canvas = document.createElement('canvas');
						var ctx = canvas.getContext('2d');
						canvas.width = img.clientWidth;
						canvas.height = img.clientWidth;
						ctx.drawImage(downloadingImage, 0, 0, canvas.width, canvas.height);
						img.data = canvas.toDataURL('image/png');
						
						textInfo.innerHTML = "Here is what you got: " + data.name + "<br>" +
												"Type: " + data.attributes[0].value + ", Background: " + data.attributes[1].value  + ", Area: " + data.attributes[2].value  + "<br>" +
												"Done! You can view it on OpenSea";
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
				textInfo.innerHTML = "Sorry, something went wrong, check on OpenSea.";
				img.data = "images/lovet.svg";
			}	
		});		
	}

	/* MINT */
	mintButton.onclick = async () => {
		mintButton.disabled=true;
		var tokenId;
		
		const response = await refresh();
		if( ethereum.selectedAddress.length > 0 && response){
			//mint
			const encodedFunction = web3.eth.abi.encodeFunctionCall(nft_mint_abi, [mintAmount]);
			const transactionParameters = {
				to: NFT_ADDRESS,
				maxPriorityFeePerGas: "a7a358200", // 45 Gwei = 45000000000 wei
        			maxFeePerGas: "ba43b7400", // 50 Gwei = 50000000000 wei
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
					textInfo.innerHTML = "Something went wrong, check the transaction or retry.";
					img.data = "images/lovet.svg";
					mintButton.disabled=false;
				}
			} catch (error){
				console.log(`Error: ${error.message}`);
				textInfo.innerHTML = "Something went wrong, check the transaction or retry.";
				img.data = "images/lovet.svg";
				mintButton.disabled=false;
			}
		} else{
			console.log("Error no address no mintAmount");
			img.data = "images/lovet.svg";
			mintButton.disabled=false;
		}    
		//Wait totalSupply update and request the image from IPFS
		let totSupply = 0; 
		while (totSupply < tokenId) { 
			await sleep(1000)
			totSupply = await nft_contract.methods.getTotalSupply().call().then( async function (result) {
				return result;
			});
		}
		get_img(tokenId);
	}
	
	/* AddToken to MetaMask */
	addToken.onclick = async () => {
		addToken.disabled = true;
		try {
			// wasAdded is a boolean. Like any RPC method, an error may be thrown.
			const wasAdded = await ethereum.request({
			  method: 'wallet_watchAsset',
			  params: {
				type: 'ERC20',
				options: {
				  address: NFT_ADDRESS, // The address that the token is at.
				  symbol: 'LOVET', // A ticker symbol or shorthand, up to 5 chars.
				  decimals: 0, // The number of decimals in the token
				  image: "https://0xlovet.com/images/lovet.svg", // A string url of the token logo
				},
			  },
			});
		  
			if (wasAdded) {
			  console.log('Thanks for your interest!');
			} else {
			  console.log('Your loss!');
			}
		  } catch (error) {
			console.log(error);
		  }

	}

	/* Refresh contract status */
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
		//Get contract state
		await nft_contract.methods.paused().call().then(async function (result) {
			paused = result;
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
					textInfo.innerHTML = "You already have enough $LOVET!";
					return false;
				}
				else {
					if(response_maxMintable && !paused){
						if ( cost > 0) {
							if(!approved){
							textInfo.innerHTML = "Then click APPROVE to allow to spend WETH.";
							approveButton.disabled = false;
							}
						}
						else{
							textInfo.innerHTML = "Then click MINT.";
							mintButton.disabled = false;
						}
					}
					else{
						if (paused){
							textInfo.innerHTML = "The minting is paused";
						}
					}					
					return true;
				}
			});
			return response;
		});
		return response_maxWallet && response_maxMintable;
	};
	
	/* Swap Bg */
	swapBgButton.onclick = () => {
		refreshIcon.src = "images/refresh_animated.svg";
		var newBg = new Image;
		var n = Math.floor(Math.random() * MAX_SUPPLY);
		newBg.onload = function() {
			document.body.style.backgroundImage = "url('" + newBg.src + "')";
			refreshIcon.src = "images/refresh.svg";
		};			
		newBg.src = IPFS_GATEWAY + "QmcqwVZVEiZv3yAzVF7T2zRxPfGem4L6kKwsGo2Vq2D7QD/" + n + ".svg";
	};

	/* Metamask Events */
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
		connectButton.innerHTML = smallAddressFormat();
		//refresh();
	}
	else
		console.log("Account disconnected");
	});

	MetaMaskClientCheck();
}

window.addEventListener('DOMContentLoaded', initialize)

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
