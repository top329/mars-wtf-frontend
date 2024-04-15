import React from "react";
import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import useActiveWeb3 from "@/hooks/useActiveWeb3";
import { Contract, providers, ethers } from 'ethers';
import {
  useConnectModal
} from '@rainbow-me/rainbowkit';
import useToastr from "@/hooks/useToastr";
import Web3 from 'web3';
import { _renderNumber } from "@/utils/methods";
import axios from "axios";


import { MARS_WTF_ABI, EARLY_LIQUIDITY_ABI, ERC20_ABI } from '@/constants/abis';
import  { TOKEN_ADDRESSES, EARLY_LIQUIDITY_ADDRESSES, USDC_ADDRESS, } from '@/constants/config';

const Buy = () => {
  const progressRef = React.useRef<HTMLDivElement>(null);
  const { openConnectModal } = useConnectModal();
  const [progress, setProgress] = React.useState<number>(95);
  const { showToast } = useToastr ();


  const { address, isConnected, isConnecting, isReconnecting, connector, chainId, signer } = useActiveWeb3();// hook address, isconnected, inConnecting
  //abis
  const [contractMarsWTF, setContractMarsWTF] = React.useState<Contract|undefined>(undefined);
  const [contractEarlyLiquidity, setContractEarlyLiquidity] = React.useState<Contract|undefined>(undefined);
  const [constractUSDC, setContractUSDC] = React.useState<Contract|undefined>(undefined);
  //contract infos
  const [balances, setBalances] = React.useState<Record<string, number>>({});
  const [memeBalance, setMemeBalance] = React.useState<number>(0);
  const [presalePrice, setPresalePrice] = React.useState<number>(0);
  const [presaleSoldMars, setPresaleSoldMars] = React.useState<number>(0);
  const [presaleTotal, setPresaleTotal] = React.useState<number>(0);
  //fromAmount and toAmount
  const [fromAmount, setFromAmount] = React.useState<string>("");
  const [toAmount, setToAmount] = React.useState<string>("");

  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    axios
      .get(`https://marswtf-backend.onrender.com/api/presale/1`)
      // .get(`http://localhost:5000/api/presale/1`)
      .then(({ data: { data } }) => {
        console.log(data);
        setPresalePrice (data.price);
        setPresaleTotal (data.total);
        setPresaleSoldMars (data.sold);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [])

  /**
   * get MarsBalance
   * @param _contract 
   */
  const _getMarsBalance = async(_contract = contractMarsWTF) => {
    try {
      if (!_contract) throw "no contract";
      if (!address) throw "no address";
      const _balance = await _contract.balanceOf(address);
      const _num = Number(_balance)/1e9;
      setMemeBalance (_num);
    } catch (err) {

    }
  }
  /**
   * get USDC balance
   * @param _contract 
   */
  const _getUSDCBalance = async(_contract = constractUSDC) => {
    try {
      if (!_contract) throw "no contract";
      if (!address) throw "no address";
      const _balance = await _contract.balanceOf(address);
      console.log(_balance)
      setBalances ({ ...balances, 'usdc': Number(_balance)/1e6 });
    } catch (err) {

    }
  }
  /**
   * get early LP info, 
   * @param _contract marsWTF Contract
   * @param _lpContract earlyLiquidity Contract
   */
  const _getEarlyLiquidityInfo = async (_contract = contractMarsWTF, _lpContract = contractEarlyLiquidity) => {
    try {
      if (!_contract) throw "no contract";
      if (!chainId) throw "invalid chainId";
      // const _balance = await _contract.balanceOf(EARLY_LIQUIDITY_ADDRESSES[chainId]);
      // const num = Number(_balance)/1e9;
      // console.log("presale balance -----------", num);
      // setPresaleBalance(num); //presale amount

      if(!_lpContract) throw "no lp contract";
      const _totalMarsWTFSold = await _lpContract.getTotalMarsWTFSold ();
      const _presalePrice = await _lpContract.getPresalePrice();
      console.log('presale price ------>', Number(_presalePrice));
      setPresaleSoldMars (_totalMarsWTFSold/1e9);
      setPresalePrice(Number(_presalePrice/1e6));

      // .get(`https://marswtf-backend.onrender.com/api/holders`)
      // .get(`http://localhost:5000/api/presale`)
      await axios.put('https://marswtf-backend.onrender.com/api/presale', { price: Number(_presalePrice/1e6), sold: Number(_totalMarsWTFSold/1e9), stage: 1 });
    } catch (err) {
      console.log(err)
    }
  }

  /**
   * get Contract data when first load
   */
  React.useEffect(() => {
    if (address && chainId && signer) {
      const _contractMarsWTF = new ethers.Contract(
        TOKEN_ADDRESSES[chainId],
        MARS_WTF_ABI,
        signer,
      );
      setContractMarsWTF (_contractMarsWTF);
      _getMarsBalance (_contractMarsWTF);
      
      const _contractEarlyLiquidity = new ethers.Contract(
        EARLY_LIQUIDITY_ADDRESSES[chainId],
        EARLY_LIQUIDITY_ABI,
        signer
      );
      
      _getEarlyLiquidityInfo (_contractMarsWTF, _contractEarlyLiquidity);
      setContractEarlyLiquidity (_contractEarlyLiquidity);
    } else {
      setBalances ({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId, signer]);
  /**
   * when load the web3, get stable Coin balances
   */
  React.useEffect(() => {
    if (address && chainId && signer) {
      const _contractUSDC = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      setContractUSDC (_contractUSDC);
      _getUSDCBalance (_contractUSDC);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId, signer]);
  /**
   * when the fromAmount is changed by user typing...
   * @param e HTMLChangeEvent
   * @returns 
   */
  const handleFromAmountChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    //@ts-ignore
    if (Number(value) < 0 || isNaN(Number(value)) || value.length > 15) {
      setFromAmount("0");
      return;
    }
    const _amount = Number(value) / presalePrice;
    setFromAmount(value);
    if (_amount === Infinity || isNaN(_amount)) {
      setToAmount ("0.0");
    } else {
      setToAmount (String(_amount));
    }
  }
  /**
   * when the toAmount is changed by user typing...
   * @param e HTMLChangeEvent
   * @returns 
   */
  const handleToAmountChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    //@ts-ignore
    if (Number(value) < 0 || isNaN(Number(value)) || value.length > 15) {
      setToAmount("0");
      return;
    }
    setToAmount(value);
    const _amount = Number(value) * presalePrice;
    if (_amount === Infinity || isNaN(_amount)) {
      setFromAmount ("0.0");
    } else {
      setFromAmount (String(_amount));
    }
  }

  const handleBuyMeme = async () => {
    try {
      setIsLoading (true);
      if (!constractUSDC) throw "no USDC contract";
      if (!contractEarlyLiquidity) throw "no lp contract";

      if (fromAmount === "" || toAmount === "") {
        throw "Input Token Amount to Buy";
      }

      if (Number(fromAmount) < 1e-6) {
        throw "Can't buy too small amount";
      }
      if (Number(toAmount) > presaleBalance) {
        throw "Insufficient token Amount to buy";
      }
      if (!chainId) {
        throw "Invalid chainId";
      }
      
      const _amountUSDC = Math.round(Number(fromAmount) * 1e6);
      const _amountMeme = Math.round(Number(toAmount) * 1e9);
      const _approveTx = await constractUSDC.approve(EARLY_LIQUIDITY_ADDRESSES[chainId], _amountUSDC);
      await _approveTx.wait();
      showToast ("Token is approved Successfully", "info");
      const _buyTx = await contractEarlyLiquidity.buy(_amountMeme);
      await _buyTx.wait();
      showToast ("Transaction Success", "info");
      console.log(_buyTx);

      await _getEarlyLiquidityInfo ();
      await _getMarsBalance ();
      await _getUSDCBalance ();
    } catch (err: any) {
      if (String(err.code) === "ACTION_REJECTED") {
        showToast ("User rejected transaction.", "warning");
      } else {
        showToast (String(err), "warning");
      }
    } finally {
      setIsLoading (false);
    }
  }

  const addUSDC = () => {

    
    if(!window.ethereum) {
      window.alert('Please install MetaMask');
      window.open('https://metamask.io/download.html', '_self');
      return;
    }
    const web3 = new Web3(window.ethereum);
    
    web3.eth.net.getId().then((networkId: any) => {
      if (web3.currentProvider) {
        //@ts-ignore
        web3.currentProvider.sendAsync({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
              symbol: 'USDC',
              decimals: 6,
              image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
            },
          },
        });
      }
    });
  }

  const addToken = () => {

    
    if(!window.ethereum) {
      window.alert('Please install MetaMask');
      window.open('https://metamask.io/download.html', '_self');
      return;
    }
    const web3 = new Web3(window.ethereum);
    
    web3.eth.net.getId().then((networkId: any) => {
      if (web3.currentProvider) {
        //@ts-ignore
        web3.currentProvider.sendAsync({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: "0x10B70F96Eccba753231D853157386579301622eF",
              symbol: 'MarsWTF',
              decimals: 9,
              image: 'https://mars-wtf.vercel.app/_next/image?url=%2Flogo.png&w=1080&q=75',
            },
          },
        });
      }
    });
  }

  // const itemsMeme: MenuProps['items'] = [
  //   {
  //     key: '1',
  //     label: (
  //       <a target="_blank" rel="noopener noreferrer" href="https://sepolia.etherscan.io/address/0x10B70F96Eccba753231D853157386579301622eF">
  //         View on Explorer
  //       </a>
  //     ),
  //   },
  //   {
  //     key: '2',
  //     label: (
  //       <a onClick={addToken}>
  //         Imprt WTF
  //       </a>
  //     ),
  //   }
  // ];

  // const itemsUSDC: MenuProps['items'] = [
  //   {
  //     key: '1',
  //     label: (
  //       <a target="_blank" rel="noopener noreferrer" href="https://sepolia.etherscan.io/address/0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8">
  //         View on Explorer
  //       </a>
  //     ),
  //   },
  //   {
  //     key: '2',
  //     label: (
  //       <a onClick={addUSDC}>
  //         Imprt USDC
  //       </a>
  //     ),
  //   }
  // ];


  React.useEffect(() => {
    let percent = (presaleSoldMars) * 100 / presaleTotal;
    if (isNaN(percent) || percent === Infinity) {
      percent = 0;
    }


    if (!progressRef.current) return;
    var initialWidth = percent;
    var currentWidth = 0;
    var animationSpeed = 1;
    var intervalDuration = 10;
    var interval = setInterval(frame, intervalDuration);

    function frame() {
      
      if (currentWidth >= initialWidth) {
        clearInterval(interval);
      } else {
        currentWidth += animationSpeed;
        if (currentWidth > initialWidth) {
          currentWidth = initialWidth;
        }
        if (!progressRef.current) return;
        console.log(initialWidth, currentWidth)
        progressRef.current.style.width = currentWidth + "%";
        if (initialWidth > 0) {
          progressRef.current.style.background =
            "linear-gradient(8.6deg, #B5360C 6.57%, #DD5919 93.43%)";
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presaleSoldMars, presaleTotal]);

  const handleClick = () => {
    if (!isConnected && openConnectModal) {
      openConnectModal ();
    } else {
      
    }
  }

  return (
    <section
      data-aos="fade-left"
      data-aos-offset="200"
      data-aos-delay="200"
      data-aos-duration="500"
      data-aos-easing="ease-in-out"
      data-aos-once="true"
      className="flex justify-center"
    >
      <div
        className="flex flex-col justify-start max-w-[500px] bg-gradient-to-t via-[#037DA9] via-[30%] from-[#06063A] to-[#00D7FD] text-white w-full rounded-3xl"
        style={{ border: "7px solid #2D2D2D" }}
      >
        <div className="bg-[url('/img/swap-back.png')] rounded-2xl bg-cover bg-[100%_100%]">
          <div
            className="w-full px-4 py-6 sm:px-6 sm:py-8 flex flex-col gap-1 sm:gap-3"
            style={{ borderBottom: "7px solid #2D2D2D" }}
          >
            <h3 className="text-xl sm:text-3xl break-all overflow-auto">{_renderNumber(presaleSoldMars)}/{_renderNumber(presaleTotal)} $MARS SOLD</h3>
            <div className="progress-bar w-full">
              <div className="progress-bar-inner" ref={progressRef}></div>
            </div>
            <h3 className="text-lg sm:text-2xl">CURRENT PRICE = {presalePrice} USD</h3>
          </div>
          <div className="px-4 py-6 sm:px-6 sm:py-8 flex flex-col gap-10">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl sm:text-3xl">YOU PAY</h3>
              <div className="flex gap-1 sm:gap-3 items-center">
                <Image
                  src={"/img/usdc.svg"}
                  width={0}
                  alt=""
                  height={0}
                  sizes="100vw"
                  className="sm:w-[70px] w-[55px] object-contain"
                />
                <div className="flex flex-col justify-center item-center">
                  <div className="flex items-center  sm:gap-1">
                    <input
                      placeholder="0.0"
                      className="bg-transparent w-[100px] text-xl sm:text-2xl outline-none border-none"
                      value={fromAmount}
                      onChange={handleFromAmountChanged}
                    />
                    <h3 className="text-2xl sm:text-3xl">USDC</h3>
                  </div>
                  {
                    isConnected &&
                    <h3 className="text-xl sm:text-2xl">
                      <span className="text-[15px] xl:text-lg">
                        CURRENT BALANCE:
                      </span>{" "}
                      {balances.usdc ? balances.usdc: 0}
                    </h3>
                  }
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl sm:text-3xl">YOU RECEIVE</h3>
              <div className="flex gap-1 sm:gap-3 items-center">
                <Image
                  src={"/img/wtf.png"}
                  width={0}
                  alt=""
                  height={0}
                  sizes="100vw"
                  className="sm:w-[70px] w-[55px] object-contain"
                />
                <div className="flex flex-col justify-center item-center">
                  <div className="flex items-center  sm:gap-1">
                    <input
                      value={toAmount}
                      onChange={handleToAmountChanged}
                      placeholder="0.0"
                      className="bg-transparent w-[100px] text-xl sm:text-2xl outline-none border-none"
                    />
                    <h3 className="text-2xl sm:text-3xl">MWTF</h3>
                  </div>
                  {
                    isConnected &&
                    <h3 className="text-xl sm:text-2xl">
                      <span className="text-[15px] xl:text-lg">
                        CURRENT BALANCE:
                      </span>{" "}
                      { _renderNumber(memeBalance) }
                    </h3>
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-6 sm:px-6 sm:py-8 pt-5">
            <button onClick={handleClick} className="wallet-button w-full flex justify-center items-center rounded-xl p-5 sm:text-2xl gap-2">
              {
                !isConnected ? 
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" className="md:w-[40px] md:h-[40px] w-[30px] h-[30px]" viewBox="0 0 24 24"><g fill="currentColor" fillRule="evenodd" clipRule="evenodd"><path d="M21.1 8.004C21.045 8 20.984 8 20.92 8h-2.525c-2.068 0-3.837 1.628-3.837 3.75s1.77 3.75 3.837 3.75h2.525c.064 0 .125 0 .182-.004a1.755 1.755 0 0 0 1.645-1.628c.004-.06.004-.125.004-.185V9.817c0-.06 0-.125-.004-.185a1.755 1.755 0 0 0-1.645-1.628m-2.928 4.746c.532 0 .963-.448.963-1s-.431-1-.963-1c-.533 0-.964.448-.964 1s.431 1 .964 1"></path><path d="M20.918 17a.22.22 0 0 1 .221.278c-.2.712-.519 1.32-1.03 1.83c-.749.75-1.698 1.081-2.87 1.239c-1.14.153-2.595.153-4.433.153h-2.112c-1.838 0-3.294 0-4.433-.153c-1.172-.158-2.121-.49-2.87-1.238c-.748-.749-1.08-1.698-1.238-2.87C2 15.099 2 13.644 2 11.806v-.112C2 9.856 2 8.4 2.153 7.26c.158-1.172.49-2.121 1.238-2.87c.749-.748 1.698-1.08 2.87-1.238C7.401 3 8.856 3 10.694 3h2.112c1.838 0 3.294 0 4.433.153c1.172.158 2.121.49 2.87 1.238c.511.512.83 1.119 1.03 1.831a.22.22 0 0 1-.221.278h-2.524c-2.837 0-5.337 2.24-5.337 5.25s2.5 5.25 5.337 5.25zM7 15.5a.75.75 0 0 1-.75-.75v-6a.75.75 0 0 1 1.5 0v6a.75.75 0 0 1-.75.75"></path></g></svg>
                  <p className="pt-1">CONNECT WALLET</p>
                </> :
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="md:w-[40px] md:h-[40px] w-[30px] h-[30px]" viewBox="0 0 128 128"><path fill="#a15d38" d="M92.25 43.43s3.5-9.84 6.82-13.94s7.73-7.48 12.86-8.73c-3.54-4.08-13.67-6.2-20.92 1.56c-7.25 7.76-9.39 19.31-9.39 19.31z"/><path fill="#f7a54b" d="M104.07 15.02s11.9 1.27 16.29 8.73c2.9 4.93 4.62 15.72.85 28.42c-3.65 12.31-1.91 2.69-1.91 2.69l-9.4-5.22s5.17-19.69 1.92-26.41c-3.56-7.38-10.54-6.8-10.54-6.8z"/><path fill="#a15d38" d="M19.96 35.4c-1-13.92 3.34-14.59 5.58-16.65c-5.21-3.06-11.09-1.19-13.63.81C6.33 23.95 11 46.4 11 46.4l10.1-4.13c-.01 0-.99-4.74-1.14-6.87"/><path fill="#894f36" d="m15.84 51.28l-9.17-1.11l10 55.76c0 9.98 20.95 18.06 46.79 18.06s46.79-8.09 46.79-18.06l9.05-55.38z"/><path fill="#e39744" d="m34.73 67.23l2.67 52.81c.01.79-.75 1.35-1.5 1.12l-2.68-.8a1.51 1.51 0 0 1-1.07-1.4l-4.02-52.67zm24.22 2.59l1.92 53.63c.01.6.5 1.09 1.1 1.09l3.76.05c.6 0 1.08-.49 1.09-1.09l-.19-53.69h-7.68z"/><path fill="#ce843a" d="m90.13 120.07l.65-51.51l7.3-1.33l-2.88 51.97c-.02.42-.3.78-.71.9l-3.08.94c-.64.19-1.28-.3-1.28-.97M13.4 63.47l7.64 50.2c.07.48.34.9.74 1.16l2.16 1.41a.738.738 0 0 0 1.14-.68L20.5 65.34z"/><path fill="#e39744" d="m51.79 69.82l.31 53.21c-.02.41-.39.72-.8.67l-4.14-.42a.7.7 0 0 1-.6-.69l-2.27-52.77z"/><path fill="#ce843a" d="m75.41 68.56l1.3 54.32c.01.51.45.89.95.82l4.07-.55c.41-.05.71-.4.73-.81l.47-55.12zm31.29-2.67l-5.43 50.25c-.06.53.75.53 1.21.26l1.75-1.05c.22-.13.37-.35.41-.61L112.32 64z"/><path fill="#ffba5f" d="M28.9 74.3c.03.59-.57 1-1.11 1.01c-2.25.06-5.41.01-10.93-1.83c-3.13-1.04-5.08-2.21-6.25-3.34c-1.07-1.03-1.36-2.35-1.39-2.92c-.03-.71-.34-4.07-.31-5.42l19.7 7.35c.08 1.77.29 5.15.29 5.15m30.36 4.08c0 .59-.71 1.21-1.27 1.41c-1.73.64-6.23 1.59-11.99.99c-5.26-.55-7.97-1.92-9.73-3.02c-.56-.35-.95-.97-.98-1.56l-.2-4.46l24.14 2.59c.02 1.79.02 2.27.03 4.05m31.32-2.42c-.03.59-.41 1.21-.98 1.56c-1.76 1.11-3.88 2.43-9.12 3.17c-5.24.73-11.23.04-12.96-.58c-.55-.2-1.25-.91-1.25-1.51c.01-1.79.07-2.62.08-4.41l24.41-2.69c.02 0-.1 2.68-.18 4.46m26.89-11.73c-.04.99-.11 1.98-.22 2.96c-.05.47-.13.98-.46 1.31c-.45.44-3.49 3.09-7.59 4.56c-5.32 1.91-8.83 2.48-10.52 2.33c-.54-.05-1.03-.48-1-1.07c.08-1.43.11-2.37.18-3.57z"/><path fill="#ffd58a" d="M60.01 99.47c.03.59-.39 1.15-.96 1.37c-1.78.71-6.48 1.83-11.97 1.34c-5.5-.49-7.81-2.12-9.69-3.15c-.6-.33-1.12-1.03-1.17-1.62l-.26-4.83c-.08-.92.64-1.23 1.63-.86c2.18.81 4.1 1.85 8.95 2.27c4.85.42 9.17.09 11.28-.36c.96-.2 1.99.53 2.04 1.45z"/><path fill="#ffba5f" d="M90.4 96.88c-.03.59-.41 1.57-1.5 2.27c-1.81 1.17-4.22 2.26-9.69 2.99c-5.47.74-10.15-.26-11.95-.88c-.58-.2-.96-.72-.95-1.31c.01-1.79.01-2.68.02-4.46c0-.92.92-1.64 1.88-1.48c2.13.35 6.39.57 11.22-.07c4.83-.64 7.04-1.72 9.18-2.63c.97-.41 1.85.06 1.8.98zM114 86.43c-.27 2.26-.5 3.38-1.29 4.08c0 0-1.72 2-5.53 3.41c-2.91 1.08-8.84 2.48-9.89 2.15c-.46-.15-.78-.46-.75-1.05c.09-1.78.13-2.67.22-4.46c.05-.92.86-1.87 1.67-1.96c1.93-.22 7.32-1.8 8.75-2.47c3.06-1.44 5.84-3.32 5.84-3.32c.52-.35.88-.16.98.14c.28.84.12 2.49 0 3.48"/><path fill="#ffd58a" d="M60.73 120.32c0 .59-.45 1.37-1.57 1.46c0 0-4.61.74-10.68.09c-5.54-.59-9.97-2.79-9.97-2.79c-.84-.48-1.24-1.12-1.27-1.71l-.19-4.72c-.04-.92.69-1.37 1.62-.96c2.06.9 5.17 1.99 9.8 2.48c5.38.57 8.42.4 9.83.38c1.41-.02 2.2.31 2.24 1.39z"/><path fill="#ffba5f" d="M90.16 117.28c-.03.59-.45 1.17-1.01 1.53c-1.76 1.11-4.8 2.64-10.03 3.38c-5.23.74-9.86 0-11.59-.63c-.55-.2-.91-.72-.91-1.31c.01-1.79.01-2.68.02-4.46c0-.92.88-1.64 1.8-1.48c2.03.35 6.28.31 10.89-.33s7.02-1.64 9.07-2.55c.93-.41 1.85.05 1.81.97zm19.87-14.38c.52-.27 1.01.05.99.74c-.04 1.62-.3 3.78-1.99 5.68c-.79.89-5.95 6.02-12.82 6.51c-.81.06-.75-1.31-.75-1.31l.21-3.74c.05-.92.68-1.75 1.75-1.96c.99-.2 3.85-.92 7.34-2.59c1.67-.81 3.01-2.13 5.27-3.33"/><path fill="#ffd58a" d="M45.2 87.94c.05.59-.36 1.23-1.17 1.43c-1.68.41-6.85.35-12.07-.79s-8.85-4.03-8.85-4.03c-.58-.4-.92-.97-1-1.55l-.45-4.94c-.1-1.09.96-.87 1.9-.38c2.09 1.06 2.93 1.76 7.53 2.74c4.6.99 10.19 1.69 12.17 1.5c.9-.09 1.71.35 1.82 1.51zm30.77.85c0 .75-.87 1.25-1.46 1.53c-1.84.87-5.72 2.09-11.25 2.09c-5.52 0-8.48-1.14-10.08-1.95c-.58-.29-1.28-1.04-1.28-1.72l-.04-4.86c-.02-.92 1.04-1.13 2.02-.85c2.16.63 4.51 1.18 9.38 1.18c4.87 0 7.91-.98 10.13-1.3c2.21-.32 2.48.59 2.47 1.51z"/><path fill="#ffba5f" d="M104.93 82.32s-.12 1.13-1.1 1.9c-1.73 1.36-4.15 2.68-8.69 3.82c-5.18 1.31-9.52 1.4-11.2 1c-.54-.13-1.02-.59-1-1.18c.05-1.78.15-4.53.15-4.53c.03-.92 1.02-1.68 1.92-1.64c1.99.08 6.08-.33 10.53-1.84c4.02-1.37 6.37-2.52 8.39-3.7c.92-.53 1.64-.04 1.58.88zm11.04-9.92c0 1.65-.36 5.1-.96 6.27c-.42.81-1.04 1.07-1.84 1.44c-.7.33-3.22 1.53-3.09-.17l.74-4.73c.11-1.39.77-1.83 1.93-2.29c.59-.23 1.21-.4 1.78-.7c1.56-.81 1.44.06 1.44.18"/><path fill="#ffd58a" d="M46 108.68c.04 1.09-1.45 1.53-2.34 1.62c-2.14.21-7.01-.21-11.65-1.76c-4.01-1.34-6.8-3.19-7.25-3.73c-.45-.54-.78-1.19-.83-1.78l-.46-4.23c-.09-.99.69-1.54 1.6-1.09c2.05 1 4.34 2.37 8.59 3.65c4.44 1.34 8.34 1.73 10.21 1.67c1.5-.05 1.93.53 1.97 1.45c.09 1.8.08 2.42.16 4.2m30.33 1.03c0 .74-.53 1.19-1.16 1.47c-1.97.87-5.8 2.27-11.7 2.27c-5.3 0-8.52-1.22-10.21-1.92c-.64-.26-1.24-.76-1.25-1.35v-4.99c-.02-.92 1.05-1.32 2.09-1.04c2.31.63 4.31 1.19 9.37 1.1c5.2-.09 8.57-.6 10.88-1.2c1.3-.34 2.01.31 1.99 1.23z"/><path fill="#ffba5f" d="M102.72 102.47c-.04.59-.22 1.47-.72 1.9c0 0-2.97 2.96-8.18 4.44c-4.66 1.32-8.79 1.43-10.3 1.04c-.48-.13-.79-.59-.78-1.18c.05-1.78.07-2.68.12-4.46c.02-.92.81-1.75 1.62-1.72c1.79.08 5.62-.63 9.7-1.88c4.08-1.25 5.71-2.76 7.54-3.95c.83-.54 1.61-.23 1.53.83zm9.26-9.01c.54-.12.78.21.78.61c0 1.99-.34 3.85-.97 5.48c-.36.92-3.37 2.86-4.31 2.87c-.69 0-.81-.34-.77-.93l.75-4.82c.07-.92.55-1.59 1.4-1.84c.86-.24 2.72-1.28 3.12-1.37m-99.21-5.29s.13 1.39.98 2.19c.98.92 2.06 1.72 3.23 2.39c3.82 2.23 7.17 3.18 11.53 3.66c.09.01 1.8-.35 1.77-.94c-.09-1.78-.13-2.67-.22-4.46c-.05-.92-.86-1.87-1.67-1.96c-3.19-.36-6.05-1.42-8.96-2.73a31.46 31.46 0 0 1-3.54-1.87c-.6-.37-1.19-.76-1.76-1.18c-.45-.33-1.32-1.29-1.61-1.18c-.29.12-.38.13-.38.9c0 1.39.63 5.18.63 5.18m3.52 14.92c-.52-.27-.65.52-.52 1.09c.35 1.59.52 3.69 1.72 5.44c1.79 2.63 10.23 6.99 12.87 6.74c.58-.05 1.19-.71 1.04-1.44l-.21-4.2c-.05-.92-.98-1.59-2.08-1.88c-1.45-.37-5.86-2.05-12.82-5.75m-5.88-29.33c0 1.7.28 4.42.94 5.47c.55.88 2.48 2.11 3.78 2.22c.52.04 1.16-.32 1.14-.91c0 0-.45-3.06-.64-4.26c-.19-1.2-.33-1.77-1.35-2.06c-1.44-.4-2.43-1.36-2.93-1.56c-.69-.26-.94.19-.94 1.1m4.08 19.49c-.19-.14-.47.04-.5.28c-.18 2.03.23 4.08.7 6.07c.25 1.05 1.03 1.68 1.91 2.12c.77.39 1.44.55 1.87.52c.42-.03.91-.28.77-.99l-.64-4.35s-.04-1.72-1.33-2.08c-1.06-.3-1.83-.85-2.78-1.57"/><path fill="#f7a54b" d="M5.9 60.13L3.46 49.39h120l-2.44 10.74c0 7.53-25.77 13.63-57.56 13.63S5.9 67.66 5.9 60.13"/><ellipse cx="63.46" cy="49.39" fill="#ffcc80" rx="60" ry="11.92"/><ellipse cx="63.46" cy="47.68" fill="#784d30" rx="49.46" ry="7.68"/><path fill="#d68b52" d="M63.46 39.99C36.15 39.99 14 43.43 14 47.68c0 1.48 2.71 2.86 7.39 4.04c8.07-2.4 23.89-4.04 42.07-4.04c18.19 0 34 1.63 42.07 4.04c4.68-1.17 7.39-2.56 7.39-4.04c0-4.25-22.14-7.69-49.46-7.69"/><path fill="#894f36" d="M63.46 72.7c-22.56 0-47.68-4.21-57.28-11.22c0 0 .48 2.62 3.34 4.27c6.25 3.61 17.61 6.75 33.63 8.21c.33 1.12 1.63 3.32 6.74 3.32c4.67 0 6.58-1.39 7.37-2.52c2.02.05 4.08.08 6.21.08c25.58 0 44.97-4.12 53.91-8.86c0 0 1.06-.62 1.73-1.51s1.25-2.24 1.25-2.24c-3.16 2.76-23.51 10.47-56.9 10.47"/><path fill="#ffcc80" d="M58.03 72.78s.67 2.55-10.72 2.44c-3.84-.04-5.89-1.18-6.98-4.22c-6.15-17.13-11.02-34.77-13.77-41.06c-5.12-11.72-15.39-11.51-15.39-11.51c1.28-1.13 5.06-2.33 6.36-2.46c4.74-.48 11.36-1.51 17.07 2.78c8.05 6.05 20.3 52.11 20.57 52.75c.28.64 2.38.75 2.86 1.28"/><path fill="#f7a54b" d="m11.54 43.41l-3.03 1.25c-.95-5.13-3.24-20.26 1.74-25.42c3.97-4.11 9.98-.75 12.66 3.03c1.64 2.32 3.65 7.68 3.65 7.68s-3.46-7.3-9.41-9.25c-2.15-.7-4.08.22-4.6.77c-3.09 3.2-2.35 14.36-1.01 21.94"/><path fill="#ffd58a" d="M80.41 97.76c.07 1.02.43 3.97-1.21 4.39c-.77.2-7.31.97-11.95-.81c-.57-.22-.96-.72-.95-1.31c.01-1.79.01-2.68.02-4.46c0-.92.75-1.78 1.72-1.62c1.59.26 3.84.3 5.45.33c1.56.03 2.63-.07 5.18-.26c1.25-.1 1.65 2.38 1.74 3.74m-.39 20.48c.16 2.36-.3 3.68-1.71 4.08c-.92.26-8.3.5-10.78-.75c-.52-.26-.91-.72-.91-1.31c.01-1.79.01-2.68.02-4.46c0-.92.87-1.56 1.8-1.48c2.06.18 3.76.16 5.51.12c1.71-.04 3.78-.25 3.78-.25c1.37-.17 2.12 1.56 2.29 4.05M17.8 87.72c-.12 1.77.06 3.33.26 4.4c.18.98.85 1.79 1.77 2.16c.79.32 1.8.7 2.7.96c2.12.59 3.68.96 6.01 1.15c.83.07 1.89-.23 1.89-1.11l-.29-4.27c-.05-.92-.6-1.77-1.6-1.92c-3.01-.45-5.88-1.56-8.73-2.47c-1.29-.41-1.95.14-2.01 1.1m3.96 19.59c.01 1.45.23 2.79.61 4.32c.53 2.16 1.72 2.75 3.63 3.55c1.52.64 3.66 1.51 5.12 1.35c.57-.07.9-.59.75-1.31l-.21-4.2c-.05-.92-.35-1.56-1.75-1.96c-3.19-.92-6.12-2.23-7.37-2.78c-.43-.2-.78.44-.78 1.03"/><path fill="none" stroke="#ffcc80" strokeMiterlimit="10" strokeWidth="3.03" d="M82.01 39.28c0-.21 6.31-22.05 19.26-22.85c18.03-1.13 10.66 27.44 10.66 27.44"/></svg>
                  <p className="pt-1">BUY $MARSWTF</p>
                </>
              }
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Buy;
