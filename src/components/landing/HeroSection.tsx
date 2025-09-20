import React from 'react';
import Link from 'next/link';

// SVG paths from the reference implementation
const svgPaths = {
  p7f12500: "M320.061 13.0607C320.646 12.4749 320.646 11.5251 320.061 10.9393L310.515 1.3934C309.929 0.807612 308.979 0.807612 308.393 1.3934C307.808 1.97918 307.808 2.92893 308.393 3.51472L316.879 12L308.393 20.4853C307.808 21.0711 307.808 22.0208 308.393 22.6066C308.979 23.1924 309.929 23.1924 310.515 22.6066L320.061 13.0607ZM0 12V13.5H319V12V10.5H0V12Z"
};

function Groups() {
  return (
    <div className="relative sm:absolute bg-[rgba(0,0,0,0)] w-full sm:bottom-[19.18px] sm:h-[949.345px] sm:right-[161.42px] sm:w-[1121.95px]" data-name="Groups">
      <div className="hidden sm:block absolute bottom-[-33.52px] h-[973.318px] right-[19.64px] w-[1137.94px]" data-name="Image" />
      
      {/* Mobile: SECRET text positioned to layer behind the standing model */}
      <div className="absolute flex flex-col font-turret-road font-bold justify-center leading-[0] not-italic text-3xl sm:hidden text-black text-nowrap z-0 top-32 left-1/2 transform -translate-x-1/2">
        <p className="leading-[normal] whitespace-pre">SECRET</p>
      </div>
      
      {/* Desktop: SECRET text with original positioning */}
      <div className="hidden sm:flex absolute flex-col font-turret-road font-bold justify-center leading-[0] not-italic text-[287px] left-[34.37px] text-black text-nowrap top-[128.54px] translate-y-[-50%]">
        <p className="leading-[normal] whitespace-pre">SECRET</p>
      </div>
      
      <div className="hidden sm:block absolute bg-[#ebe1db] h-[672px] left-[0.37px] top-[277.54px] w-[1122px]" />
    </div>
  );
}

function Groups1() {
  return (
    <div className="absolute sm:absolute bg-[rgba(0,0,0,0)] w-48 sm:bottom-[70.32px] sm:h-[188.59px] sm:right-[787.92px] sm:w-[434.717px] bottom-4 left-4 sm:left-auto" data-name="Groups">
      <Link href="/products" className="block w-full h-full">
        {/* Mobile CTA Box */}
        <div className="absolute bg-[#fefefe] h-16 sm:hidden w-full" data-name="Background">
          <div aria-hidden="true" className="absolute border-[#f4f2ed] border-[1.598px] border-solid inset-0 pointer-events-none" />
        </div>
        
        {/* Desktop CTA Box */}
        <div className="hidden sm:block absolute bg-[#fefefe] bottom-[1.6px] h-[183.796px] right-0 w-[433.119px]" data-name="Background">
          <div aria-hidden="true" className="absolute border-[#f4f2ed] border-[1.598px] border-solid inset-0 pointer-events-none" />
        </div>
        
        {/* Mobile: "Find Your Style" text */}
        <div className="absolute bottom-2 sm:bottom-[54.34px] flex flex-col font-['Helvetica_Neue:Regular',_sans-serif] h-4 sm:h-[35.161px] justify-center leading-[0] not-italic right-2 sm:right-[377.18px] text-[#b7b7b7] text-xs sm:text-[27.489px] translate-x-[100%] translate-y-[50%] w-24 sm:w-[217.358px]">
          <p className="leading-[normal]">Find Your Style</p>
        </div>
        
        {/* Mobile: "SHOP" text */}
        <div className="absolute bottom-8 sm:bottom-[140.13px] flex flex-col font-['Helvetica_Neue:Bold',_sans-serif] justify-center leading-[0] not-italic right-2 sm:right-[377.18px] text-[#151413] text-sm sm:text-[27.489px] translate-x-[100%] translate-y-[50%] w-12 sm:w-[92.697px]">
          <p className="leading-[normal]">SHOP</p>
        </div>
        
        {/* Arrow - both mobile and desktop */}
        <div className="absolute h-0 left-2 sm:left-[61.64px] top-4 sm:top-[94.41px] w-16 sm:w-[319px]">
          <div className="absolute bottom-[-2px] sm:bottom-[-11.05px] left-0 right-[-0.47%] top-[-2px] sm:top-[-11.05px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 321 24">
              <path d={svgPaths.p7f12500} fill="var(--stroke-0, black)" id="Arrow 1" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}

function Groups2() {
  return (
    <div className="relative sm:absolute bg-[rgba(0,0,0,0)] w-full sm:px-0 sm:bottom-[36.76px] sm:h-[1088.39px] sm:w-[1440px]" data-name="Groups">
      {/* Mobile Layout - Prerendered Image */}
      <div className="relative sm:hidden w-full flex justify-center overflow-hidden">
        <Link href="/products" className="block w-full">
          <img 
            src="/assets/hero.webp" 
            alt="Hero Section - Click to shop"
            className="w-full h-auto object-cover object-center"
            style={{ 
              transform: 'scale(1.05)', 
              transformOrigin: 'center top',
              objectPosition: 'center top',
              marginBottom: '-2px'
            }}
          />
        </Link>
      </div>
      
      {/* Desktop Layout - Preserve original */}
      <div className="hidden sm:block">
        {/* Desktop: Subtitle */}
        <div className="absolute bottom-[980px] flex flex-col font-['Helvetica_Neue:Bold',_sans-serif] h-[36px] justify-center leading-[0] not-italic text-right text-[#575757] text-[27.969px] right-[676px] translate-x-[100%] translate-y-[50%] w-[473px]">
          <p className="leading-[normal]">THE BEST FASHION IS ONLY HERE</p>
        </div>
        
        {/* Desktop: Groups component */}
        <Groups />
        
        {/* Desktop: Image */}
        <div className="absolute bg-center bg-cover bg-no-repeat h-[888px] left-[68px] top-[180.89px] w-[1329px]" data-name="Hero_image_upscayl" style={{ backgroundImage: `url('/assets/52010-516-Hero_image_upscayl.png')` }} />
        
        {/* Desktop: CTA */}
        <Groups1 />
      </div>
    </div>
  );
}

function Root() {
  return (
    <div className="bg-[rgba(0,0,0,0)] sm:py-0 sm:h-[1134.74px] relative shrink-0 w-full sm:w-[1440px]" data-name="Root">
      <Groups2 />
      <div className="hidden sm:block absolute h-0 left-0 top-[3.48px] w-[1440px]">
        <div className="absolute bottom-0 left-0 right-0 top-[-5px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1440 5">
            <line id="Line 6" stroke="var(--stroke-0, #EEEEEE)" strokeWidth="5" x2="1440" y1="2.5" y2="2.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <div className="bg-[rgba(0,0,0,0)] content-stretch flex flex-col gap-0 items-center justify-start relative size-full" data-name="Hero section">
      <Root />
    </div>
  );
}