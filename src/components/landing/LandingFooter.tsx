import Link from "next/link";
import Image from "next/image";

// SVG Paths from the original component
const svgPaths = {
  p25270a00: "M14.4415 0H17.2533L11.1104 7.021L18.3371 16.575H12.6786L8.2467 10.7805L3.1756 16.575H0.3621L6.9326 9.06525L0 0H5.8021L9.80815 5.29635L14.4415 0ZM13.4547 14.892H15.0127L4.9555 1.5946H3.28355L13.4547 14.892Z",
  p262c7f00: "M15.3 0H5.1C2.244 0 0 2.244 0 5.1V15.3C0 18.156 2.244 20.4 5.1 20.4H15.3C18.156 20.4 20.4 18.156 20.4 15.3V5.1C20.4 2.244 18.156 0 15.3 0ZM18.36 15.3C18.36 17.034 17.034 18.36 15.3 18.36H5.1C3.366 18.36 2.04 17.034 2.04 15.3V5.1C2.04 3.366 3.366 2.04 5.1 2.04H15.3C17.034 2.04 18.36 3.366 18.36 5.1V15.3Z",
  p2e59f980: "M15.3 6.12031C15.8633 6.12031 16.32 5.66364 16.32 5.10031C16.32 4.53698 15.8633 4.08031 15.3 4.08031C14.7367 4.08031 14.28 4.53698 14.28 5.10031C14.28 5.66364 14.7367 6.12031 15.3 6.12031Z",
  p30103800: "M38.2061 0.801758H155.992C176.65 0.801806 193.396 17.549 193.396 38.207C193.396 58.8649 176.65 75.6113 155.992 75.6113H38.2061C17.5483 75.6111 0.801959 58.8648 0.801758 38.207C0.801758 17.5491 17.5482 0.802008 38.2061 0.801758Z",
  p35b3c400: "M10.2 5.1002C7.344 5.1002 5.1 7.3442 5.1 10.2002C5.1 13.0562 7.344 15.3002 10.2 15.3002C13.056 15.3002 15.3 13.0562 15.3 10.2002C15.3 7.3442 13.056 5.1002 10.2 5.1002ZM10.2 13.2602C8.466 13.2602 7.14 11.9342 7.14 10.2002C7.14 8.4662 8.466 7.1402 10.2 7.1402C11.934 7.1402 13.26 8.4662 13.26 10.2002C13.26 11.9342 11.934 13.2602 10.2 13.2602Z",
  p37bfbb00: "M18.0094 0H2.39062C1.07243 0 0 1.07243 0 2.39062V18.0094C0 19.3276 1.07243 20.4 2.39062 20.4H18.0094C19.3276 20.4 20.4 19.3276 20.4 18.0094V2.39062C20.4 1.07243 19.3276 0 18.0094 0ZM18.8062 18.0094C18.8062 18.4488 18.4488 18.8062 18.0094 18.8062H13.4672V12.3117H15.9291L16.3359 9.84141H13.4672V8.12812C13.4672 7.45178 13.9862 6.93281 14.6625 6.93281H16.2961V4.4625H14.6625C12.6335 4.4625 10.9978 6.10605 10.9978 8.13506V9.84141H8.60625V12.3117H10.9978V18.8062H2.39062C1.95123 18.8062 1.59375 18.4488 1.59375 18.0094V2.39062C1.59375 1.95123 1.95123 1.59375 2.39062 1.59375H18.0094C18.4488 1.59375 18.8062 1.95123 18.8062 2.39062V18.0094Z",
  p9e2a100: "M38.2061 0.801758H155.992C176.65 0.801801 193.396 17.5482 193.396 38.2061C193.396 58.8641 176.65 75.6113 155.992 75.6113H38.2061C17.5482 75.6111 0.801758 58.864 0.801758 38.2061C0.802011 17.5484 17.5484 0.802015 38.2061 0.801758Z",
};

function Men() {
  return (
    <Link 
      href="/products?gender=men"
      className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative cursor-pointer hover:opacity-80 transition-opacity" 
      data-name="Men"
      aria-label="Shop Men's Collection"
    >
      <div className="[grid-area:1_/_1] flex h-[94.18px] items-center justify-center ml-0 mt-0 relative w-[200.371px]">
        <div className="flex-none rotate-[354.52deg]">
          <div className="h-[76.413px] relative w-[194.199px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 195 77">
              <path d={svgPaths.p9e2a100} fill="url(#paint0_radial_1_127)" id="Rectangle 2" stroke="var(--stroke-0, #ECE2D9)" strokeWidth="1.60356" />
              <defs>
                <radialGradient cx="0" cy="0" gradientTransform="translate(232.493 64.6825) rotate(-158.65) scale(221.198)" gradientUnits="userSpaceOnUse" id="paint0_radial_1_127" r="1">
                  <stop offset="0.120192" stopColor="#ECE2D9" />
                  <stop offset="0.620192" stopColor="#030303" stopOpacity="0.95" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
      <div className="[grid-area:1_/_1] flex h-[55.995px] items-center justify-center ml-[103.07px] mt-[45.182px] relative translate-x-[-50%] translate-y-[-50%] w-[131.763px]">
        <div className="flex-none rotate-[348.923deg]">
          <div className="flex flex-col font-['Helvetica_Neue:Bold',_sans-serif] h-[32.071px] justify-center leading-[0] not-italic relative text-[#e8e1d7] text-[26.298px] text-center w-[128.285px]">
            <p className="leading-[normal]">MEN</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Women() {
  return (
    <Link 
      href="/products?gender=women"
      className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
      data-name="Women"
      aria-label="Shop Women's Collection"
    >
      <div className="[grid-area:1_/_1] flex h-[94.18px] items-center justify-center ml-0 mt-0 relative w-[200.371px]">
        <div className="flex-none rotate-[354.52deg]">
          <div className="h-[76.413px] relative w-[194.199px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 195 77">
              <path d={svgPaths.p30103800} fill="url(#paint0_radial_1_125)" id="Rectangle 2" stroke="var(--stroke-0, #ECE2D9)" strokeWidth="1.60356" />
              <defs>
                <radialGradient cx="0" cy="0" gradientTransform="translate(271.405 102.45) rotate(-177.464) scale(262.847 262.847)" gradientUnits="userSpaceOnUse" id="paint0_radial_1_125" r="1">
                  <stop offset="0.26" stopColor="#ECE2D9" />
                  <stop offset="0.65" stopColor="#030303" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
      <div className="[grid-area:1_/_1] flex flex-col font-['Helvetica_Neue:Bold',_sans-serif] h-[43.296px] justify-center leading-[0] ml-[100.223px] mt-[48.216px] not-italic relative text-[#ece2d9] text-[26.298px] text-center translate-x-[-50%] translate-y-[-50%] w-[128.285px]">
        <p className="leading-[normal]">WOMEN</p>
      </div>
    </Link>
  );
}

function Kids() {
  return (
    <Link 
      href="/products?gender=unisex"
      className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative cursor-pointer hover:opacity-80 transition-opacity" 
      data-name="Kids"
      aria-label="Shop Kids Collection"
    >
      <div className="[grid-area:1_/_1] flex h-[94.18px] items-center justify-center ml-0 mt-0 relative w-[200.371px]">
        <div className="flex-none rotate-[354.52deg]">
          <div className="h-[76.413px] relative w-[194.199px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 195 77">
              <path d={svgPaths.p9e2a100} fill="url(#paint0_radial_1_123)" id="Rectangle 2" stroke="var(--stroke-0, #ECE2D9)" strokeWidth="1.60356" />
              <defs>
                <radialGradient cx="0" cy="0" gradientTransform="translate(99.2817 151.587) rotate(139.574) scale(188.219 188.219)" gradientUnits="userSpaceOnUse" id="paint0_radial_1_123" r="1">
                  <stop offset="0.31646" stopColor="#ECE2D9" />
                  <stop offset="0.640966" stopColor="#030303" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
      <div className="[grid-area:1_/_1] flex h-[55.995px] items-center justify-center ml-[103.07px] mt-[45.182px] relative translate-x-[-50%] translate-y-[-50%] w-[131.763px]">
        <div className="flex-none rotate-[348.923deg]">
          <div className="flex flex-col font-['Helvetica_Neue:Bold',_sans-serif] h-[32.071px] justify-center leading-[0] not-italic relative text-[#ece1d8] text-[26.298px] text-center w-[128.285px]">
            <p className="leading-[normal]">KIDS</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Popular() {
  return (
    <Link 
      href="/collections/best-sellers"
      className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
      data-name="Popular"
      aria-label="Shop Popular Collection"
    >
      <div className="[grid-area:1_/_1] flex h-[94.18px] items-center justify-center ml-0 mt-0 relative w-[200.371px]">
        <div className="flex-none rotate-[354.52deg]">
          <div className="h-[76.413px] relative w-[194.199px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 195 77">
              <path d={svgPaths.p9e2a100} fill="url(#paint0_radial_1_121)" id="Rectangle 2" stroke="var(--stroke-0, #ECE2D9)" strokeWidth="1.60356" />
              <defs>
                <radialGradient cx="0" cy="0" gradientTransform="translate(151.81 131.662) rotate(-51.0299) scale(198.445 164.352)" gradientUnits="userSpaceOnUse" id="paint0_radial_1_121" r="1">
                  <stop offset="0.0673077" stopColor="#ECE2D9" />
                  <stop offset="0.8" stopColor="#030303" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
      <div className="[grid-area:1_/_1] flex flex-col font-['Helvetica_Neue:Bold',_sans-serif] h-[43.296px] justify-center leading-[0] ml-[36.08px] mt-[48.216px] not-italic relative text-[#ece2d9] text-[26.298px] translate-y-[-50%] w-[128.285px]">
        <p className="leading-[normal]">POPULAR</p>
      </div>
    </Link>
  );
}


function Group() {
  return (
    <div className="absolute inset-[9.37%_4.89%_9.38%_5.22%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 17">
        <g id="Group">
          <path d={svgPaths.p25270a00} fill="var(--fill-0, #111111)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute left-[6.8px] overflow-clip size-[20.4px] top-[6.8px]" data-name="Frame">
      <Group />
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-white overflow-clip relative rounded-[45.333px] shrink-0 size-[34px] hover:bg-gray-100 transition-colors shadow-lg" data-name="Frame">
      <Frame />
    </div>
  );
}

function Group1() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 21">
      <g id="Group">
        <path d={svgPaths.p37bfbb00} fill="var(--fill-0, #111111)" id="Vector" />
      </g>
    </svg>
  );
}

function Group2() {
  return (
    <div className="absolute contents inset-0" data-name="Group">
      <Group1 />
    </div>
  );
}

function Fi747374() {
  return (
    <div className="absolute left-[6.8px] overflow-clip size-[20.4px] top-[6.8px]" data-name="fi_747374">
      <Group2 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-white overflow-clip relative rounded-[45.333px] shrink-0 size-[34px] hover:bg-gray-100 transition-colors shadow-lg" data-name="Frame">
      <Fi747374 />
    </div>
  );
}

function Group3() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 21">
      <g id="Group">
        <path d={svgPaths.p262c7f00} fill="var(--fill-0, #111111)" id="Vector" />
        <path d={svgPaths.p35b3c400} fill="var(--fill-0, #111111)" id="Vector_2" />
        <path d={svgPaths.p2e59f980} fill="var(--fill-0, #111111)" id="Vector_3" />
      </g>
    </svg>
  );
}

function Fi3661391() {
  return (
    <div className="absolute left-[6.8px] overflow-clip size-[20.4px] top-[6.8px]" data-name="fi_3661391">
      <Group3 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="bg-white overflow-clip relative rounded-[45.333px] shrink-0 size-[34px] hover:bg-gray-100 transition-colors shadow-lg" data-name="Frame">
      <Fi3661391 />
    </div>
  );
}


export default function LandingFooter() {
  return (
    <div className="bg-[#151413] flex flex-col items-center justify-center gap-12 text-center py-20 px-4 lg:relative lg:min-h-screen lg:w-full" data-name="SecretBrandHero">
      {/* SECRET Headline - Mobile First */}
      <div className="flex flex-col font-['Turret_Road:Bold',_sans-serif] justify-center leading-[0] not-italic text-[#e8e1d7] text-6xl lg:absolute lg:bottom-[652.1px] lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:translate-y-[50%] lg:text-[290px] lg:text-nowrap">
        <p className="leading-[normal] whitespace-pre" style={{ fontFamily: 'var(--font-turret-road)' }}>
          <span className="lg:hidden">SECRETLACE</span>
          <span className="hidden lg:inline">SECRET</span>
        </p>
      </div>
      
      <Link 
        href="/contact"
        className="flex flex-col font-['Helvetica_Neue:Regular',_sans-serif] justify-center leading-[0] not-italic text-[#e7ded7] text-lg lg:absolute lg:bottom-[262.98px] lg:right-[80px] lg:text-[20.045px] lg:h-[28.864px] lg:translate-y-[50%] lg:w-[186.013px] cursor-pointer hover:opacity-80 transition-opacity"
        aria-label="Contact Us"
      >
        <p className="leading-[normal]">CONTACT US</p>
      </Link>
      
      <div className="flex flex-col font-['Helvetica_Neue:Regular',_sans-serif] justify-center leading-[0] not-italic text-[#e7ded7] text-sm lg:absolute lg:bottom-[229.5px] lg:right-[80px] lg:text-[16px] lg:h-[39px] lg:translate-y-[50%] lg:w-[254px]">
        <p className="leading-[normal] whitespace-pre-wrap">{`HOTLINE  +94 770572174`}</p>
      </div>
      
      <div className="bg-center bg-cover bg-no-repeat w-full max-w-sm lg:absolute lg:bottom-[1.6px] lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:size-[520px]" data-name="Visual">
        <Image
          src="/assets/clothing-rack-display.png"
          alt="Clothing rack with various items"
          width={520}
          height={520}
          className="w-full h-full object-cover"
          priority
        />
      </div>
      
      {/* Category Links - Hidden on Mobile / Desktop Original Position */}
      <div className="hidden lg:absolute lg:bg-[rgba(0,0,0,0)] lg:bottom-[616.21px] lg:box-border lg:content-stretch lg:flex lg:gap-0 lg:items-center lg:justify-center lg:leading-[0] lg:px-[250px] lg:py-0 lg:left-1/2 lg:transform lg:-translate-x-1/2">
        <div className="flex h-[144.267px] items-center justify-center relative shrink-0 w-full lg:w-[250.026px]">
          <div className="flex-none rotate-[11.077deg]">
            <Men />
          </div>
        </div>
        <Women />
        <div className="flex h-[144.267px] items-center justify-center relative shrink-0 w-full lg:w-[250.026px]">
          <div className="flex-none rotate-[11.077deg]">
            <Kids />
          </div>
        </div>
        <Popular />
      </div>
      
      {/* Social Icons */}
      <div className="flex flex-row gap-4 lg:absolute lg:content-stretch lg:flex-col lg:gap-[22.667px] lg:items-end lg:justify-start lg:left-[80px] lg:top-[598.27px]">
        <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
          <Frame1 />
        </Link>
        <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
          <Frame2 />
        </Link>
        <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
          <Frame3 />
        </Link>
      </div>
    </div>
  );
}
