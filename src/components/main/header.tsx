/* eslint-disable @next/next/no-img-element */
import React from "react";
import Marquee from "react-fast-marquee";
import { useRouter } from 'next/navigation';
import axios from "axios";
import dynamic from "next/dynamic";
import { _renderNumber } from "@/utils/methods";
const Sparkles = dynamic(() => import("@/components/ui/sparkle"), {ssr:false});
// import Sparkles from "@/components/ui/sparkle";
import { BASE_URL } from "@/constants/config";


const Header = () => {
  
  const router = useRouter ();


  const progressRef = React.useRef<HTMLDivElement>(null);


  const [presalePrice, setPresalePrice] = React.useState<number>(0);
  const [presaleSoldMars, setPresaleSoldMars] = React.useState<number>(0);
  const [presaleTotal, setPresaleTotal] = React.useState<number>(0);

  React.useEffect(() => {
    axios
      .get(`${BASE_URL}/api/presale/1`)
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

  React.useEffect(() => {
    let percent = (presaleSoldMars) * 100 / presaleTotal;
    if (isNaN(percent)) {
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

  return (
    
    <header className="bg-cover bg-no-repeat bg-[100%] bg-[url('/img/bg1.jpg')]">
      <section className="container p-left p-right text-center">
        <div className="header-row">
          <div
            className="social-media"
            data-aos="fade-right"
            data-aos-offset="200"
            data-aos-delay="200"
            data-aos-duration="500"
            data-aos-easing="ease-in-out"
            data-aos-once="true"
          >
            <ul>
              <li>
                <a href="https://twitter.com/marscoin_wtf" target="_blank">
                  <img src="/img/twitter.svg" alt="" />
                </a>
              </li>
              <li>
                <a href="https://t.me/mars_wtf" target="_blank">
                  <img src="/img/telegram.svg" alt="" />
                </a>
              </li>
            </ul>
          </div>
          <div
            className="logo"
            data-aos="fade-up"
            data-aos-offset="200"
            data-aos-delay="200"
            data-aos-duration="500"
            data-aos-easing="ease-in-out"
            data-aos-once="true"
          >
            <h1 className="text-white">$MARSWTF</h1>
          </div>
          <div
            className="button"
            data-aos="fade-down"
            data-aos-offset="200"
            data-aos-delay="200"
            data-aos-duration="500"
            data-aos-easing="ease-in-out"
            data-aos-once="true"
          >
            <Sparkles>
              <a className="text-white btn-primary cursor-pointer" onClick={() => router.push("/presale")}>
                PRESALE
              </a>
            </Sparkles>
          </div>
        </div>
        <div
          className="flex justify-center relative z-10 min-h-[730px]"
          data-aos="fade-down"
          data-aos-offset="300"
          data-aos-delay="300"
          data-aos-duration="500"
          data-aos-easing="ease-in-out"
          data-aos-once="true"
        >
          <Sparkles top={30} left={10} right={90} bottom={100} interval={100}>
            <img className="bounce-effect" src="img/ufo.png" alt="" />
          </Sparkles>
        </div>
      </section>
      <section className="max-w-[1300px] mt-[-160px] mx-auto p-left p-right">
        <div
          className="mars-content"
          data-aos="fade-up"
          data-aos-offset="200"
          data-aos-delay="200"
          data-aos-duration="500"
          data-aos-easing="ease-in-out"
          data-aos-once="true"
        >
          <div className="mars-bg space1 bg-[url('/img/mars-bg.png')]">
            <div className="mars-content-row1">
              <div className="flex items-center mars-item gap-12">
                <div className="margs-logo flex justify-center">
                  <img src="/img/logo-mars.png" alt="" />
                </div>
                <div className="mars-text-l">
                  <span className="text-white">$MARSWTF 101</span>
                  <p className="text-white">CURRENT PRICE = ${presalePrice}</p>
                </div>
              </div>
              <div className="mars-item flex justify-center text-center tab-space">
                <img src="img/martian.png" alt="" />
              </div>
              <div className="mars-item mars-text-r text-center">
                <span className="text-white">PRESALE LIVE NOW!</span>
                <p className="text-white">STAGE 1</p>
              </div>
            </div>
            <div className="mars-content-row2">
              <div className="mars-text-bottom">
                <div className="mars-text-1">
                  <p className="text-white">Total MARS sold: {_renderNumber(presaleSoldMars)} </p>
                </div>
                <div className="mars-text-2">
                  <p className="text-white">Sale Target: {_renderNumber(presaleTotal)} $MARS</p>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-inner" ref={progressRef}></div>
              </div>
            </div>
          </div>
          <div className="token">
            <Sparkles top={15} right={85} left={15} bottom={85} interval={400} color="#ffffff">
              <img src="img/token1.png" alt="" />
            </Sparkles>
          </div>
        </div>
      </section>
      
      <section className="mt-[25px]" data-aos="fade-up" data-aos-offset="200" data-aos-delay="200" data-aos-duration="500" data-aos-easing="ease-in-out" data-aos-once="true">
        <Marquee speed={100} pauseOnHover gradient gradientColor="#00000044">
          <div className="flex gap-[100px] md:gap-[200px] py-[10px] md:py-[30px] !pr-[100px] md:!pr-[200px] bg-[#DD5919] !border-x-0 !border-[5px]" style={{ border: "5px solid #2D2D2D" }}>
            <img src="/img/base-logo.svg" alt="" className="h-[40px] md:h-[60px]"/>
            <img src="/img/base-logo.svg" alt="" className="h-[40px] md:h-[60px]"/>
            <img src="/img/base-logo.svg" alt="" className="h-[40px] md:h-[60px]"/>
            <img src="/img/base-logo.svg" alt="" className="h-[40px] md:h-[60px]"/>
            <img src="/img/base-logo.svg" alt="" className="h-[40px] md:h-[60px]"/>
            <img src="/img/base-logo.svg" alt="" className="h-[40px] md:h-[60px]"/>
            <img src="/img/base-logo.svg" alt="" className="h-[40px] md:h-[60px]"/>
            <img src="/img/base-logo.svg" alt="" className="h-[40px] md:h-[60px]"/>
            <img src="/img/base-logo.svg" alt="" className="h-[40px] md:h-[60px]"/>
            <img src="/img/base-logo.svg" alt="" className="h-[40px] md:h-[60px]"/>
          </div>
        </Marquee>
      </section>
    </header>
  );
};

export default Header;
