import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { io } from "socket.io-client";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/contract";

const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const [previewAccount, setPreviewAccount] = useState(null);
  const [previewUser, setPreviewUser] = useState(null);
  const isViewOnly = !!previewAccount;
  const activeAccount = isViewOnly ? previewAccount : account;
  const activeUser = isViewOnly ? previewUser : user;

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://oxidex-api.onrender.com";

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      const init = async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          setChainId(network.chainId.toString());

          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const currentAddress = accounts[0].address.toLowerCase();
            setAccount(currentAddress);
            if (token) {
              await fetchUserProfile(currentAddress);
            }
          }
        } catch (err) {
          console.error("Wallet initialization error:", err);
        }
      };
      init();
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [token]);

  useEffect(() => {
    if (account && token) {
      const newSocket = io(backendUrl);
      newSocket.emit("subscribe:personal", account);
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [account, token]);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      logout();
    } else {
      const newAddress = accounts[0].toLowerCase();
      if (newAddress !== account) {
        logout();
        setAccount(newAddress);
      }
    }
  };

  const handleChainChanged = (chainHex) => {
    setChainId(parseInt(chainHex, 16).toString());
  };

  const fetchUserProfile = async (address) => {
    if (!address) return;
    try {
      const response = await fetch(`${backendUrl}/api/users/${address}`);
      const result = await response.json();
      if (result.success) {
        setUser(result.data);
      } else {
        setUser({ walletAddress: address, registered: false });
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setUser({ walletAddress: address, registered: false });
    }
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia Testnet",
                rpcUrls: ["https://sepolia.drpc.org"],
                nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      }
    }
  };

  const connectAndLogin = async () => {
    if (!window.ethereum) {
      alert("Ethereum wallet not found. Please install MetaMask.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId.toString() !== "11155111") {
        await switchNetwork();
      }

      
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      });

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const walletAddress = accounts[0].toLowerCase();
      setAccount(walletAddress);

      const nonceRes = await fetch(`${backendUrl}/api/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      });
      const nonceData = await nonceRes.json();
      if (!nonceData.success) throw new Error(nonceData.error);

      const nonce = nonceData.data.nonce;
      
      const domain = window.location.host;
      const origin = window.location.origin;
      
      const currentChainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      const activeChainId = parseInt(currentChainIdHex, 16);

      const statement = "Sign in to OxideX Launchpad.";
      const message = `${domain} wants you to sign in with your Ethereum account:\n` +
        `${ethers.getAddress(walletAddress)}\n\n` +
        `${statement}\n\n` +
        `URI: ${origin}\n` +
        `Version: 1\n` +
        `Chain ID: ${activeChainId}\n` +
        `Nonce: ${nonce}\n` +
        `Issued At: ${new Date().toISOString()}`;

      const currentProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await currentProvider.getSigner();
      const signature = await signer.signMessage(message);

      const verifyRes = await fetch(`${backendUrl}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature, address: walletAddress }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error(verifyData.error);

      const jwtToken = verifyData.data.token;
      localStorage.setItem("token", jwtToken);
      setToken(jwtToken);
      
      await fetchUserProfile(walletAddress);

    } catch (err) {
      console.error("Sign-in process failed:", err);
      setError(err.message || "Failed to authenticate wallet connection.");
    } finally {
      setIsConnecting(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAccount(null);
    setUser(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  const getContractInstance = async () => {
    if (!window.ethereum) throw new Error("Wallet not connected");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  };

  const executeRegistration = async (referrerAddress) => {
    try {
      const contract = await getContractInstance();
      const regCost = ethers.parseEther("0.075");
      const tx = await contract.registrationExt(referrerAddress, { value: regCost });
      return await tx.wait();
    } catch (err) {
      console.error("On-chain registration failed:", err);
      throw err;
    }
  };


  const enterPreviewMode = async (idOrAddress) => {
    if (!idOrAddress) return false;
    try {
      const response = await fetch(`${backendUrl}/api/users/${idOrAddress}`);
      const result = await response.json();
      if (result.success) {
        setPreviewAccount(result.data.walletAddress.toLowerCase());
        setPreviewUser(result.data);
        return true;
      } else {
        alert(result.error || "User ID or wallet address not registered on platform.");
        return false;
      }
    } catch (err) {
      console.error("Error entering preview mode:", err);
      alert("Failed to load user profile in preview mode.");
      return false;
    }
  };

  const exitPreviewMode = () => {
    setPreviewAccount(null);
    setPreviewUser(null);
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        token,
        user,
        socket,
        isConnecting,
        error,
        connectAndLogin,
        logout,
        executeRegistration,
        fetchUserProfile: () => fetchUserProfile(activeAccount),
        previewAccount,
        previewUser,
        isViewOnly,
        activeAccount,
        activeUser,
        enterPreviewMode,
        exitPreviewMode,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
