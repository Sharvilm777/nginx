const web3 = new Web3("HTTP://127.0.0.1:7545");
// web3.eth.getAccounts().then(console.log);
import MyContractABI from "../build/contracts/CertificateValidation.json" assert { type: "json" };
const abi = MyContractABI.abi;
const address = "0x76daA4B119FB7EcdeCF9318f60AbDc0B69ed5673";
const certificateValidationContract = new web3.eth.Contract(abi, address);
// console.log(certificateValidationContract);

async function connectMetamask() {
  const web3 = new Web3(window.ethereum);
  // ...
  const walletAddress = await web3.eth.requestAccounts();
  console.log(walletAddress);
  const walletBal = await web3.eth.getBalance(walletAddress[0]);
  const walletBalinEth = Math.round(web3.utils.fromWei(walletBal, "ether"));
  console.log(walletBalinEth);
}

connectMetamask();

async function verifyCertificate() {
  const certificateFile = document.getElementById("certificate-verify-file")
    .files[0];
  const certificateHash = await calculateHash(certificateFile);
  console.log(certificateHash);
  const certificateIsValid = await certificateValidationContract.methods
    .verifyCertificate(certificateHash)
    .call();
  const resultElement = document.getElementById("result");
  if (certificateIsValid) {
    resultElement.innerText = "Certificate is valid";
  } else {
    resultElement.innerText = "Certificate is not valid";
  }
}
async function uploadCertificate() {
  console.log("Control is here");
  const certificateFile = document.getElementById("certificate-add-file")
    .files[0];
  const certificateHash = await calculateHash(certificateFile);
  console.log(certificateHash);
  const status = await storeCertificateHashOnBlockchain(certificateHash);
  if (status) {
    alert("Certificate uploaded successfully!");
  } else {
    alert("certificate is not uploaded");
  }
}

async function calculateHash(file) {
  const fileBuffer = await file.arrayBuffer();
  const certificateHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    fileBuffer
  );
  const certificateHashArray = Array.from(
    new Uint8Array(certificateHashBuffer)
  );
  const certificateHashHex = certificateHashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return "0x" + certificateHashHex;
}
// async function storeCertificateHashOnBlockchain(certificateHash) {
//   const accounts = await web3.eth.getAccounts();
//   await certificateValidationContract.methods
//     .addCertificate(certificateHash)
//     .send({ from: accounts[0], gas: 300000 });
// }
async function storeCertificateHashOnBlockchain(certificateHash) {
  const accounts = await web3.eth.getAccounts();
  const isCertificateExists = await certificateValidationContract.methods
    .verifyCertificate(certificateHash)
    .call();

  if (isCertificateExists) {
    console.error("Certificate already exists on the blockchain.");
    return false;
  }
  try {
    await certificateValidationContract.methods
      .addCertificate(certificateHash)
      .send({
        from: accounts[0],
        gas: 300000,
        value: web3.utils.toWei("1", "ether"),
      });
    return true;
  } catch (error) {
    console.error(error);
    alert("Certificate already exists on the blockchain.");
    return false;
  }
}

document
  .getElementById("verify_btn")
  .addEventListener("click", verifyCertificate);

const uploadBtn = document.getElementById("upload_certificate");
uploadBtn.addEventListener("click", uploadCertificate);
