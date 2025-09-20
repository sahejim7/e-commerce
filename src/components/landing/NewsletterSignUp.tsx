'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { subscribeToNewsletter } from '@/lib/actions/newsletterActions';
import { toast } from 'sonner';
import svgPaths from '@/lib/svg-paths';

function Frame1171279224() {
  return (
    <div className="absolute bg-[#ebe1db] h-[522px] leading-[0] left-1/2 transform -translate-x-1/2 not-italic overflow-clip top-[168.41px] w-[1122px] max-w-[90vw]">
      {/* Desktop Text Layout - Only show on desktop */}
      <div className="hidden md:block">
        <div className="absolute bottom-[245.04px] flex flex-col font-turret-road font-bold h-[119.939px] justify-center right-[312.3px] text-[#1a1818] text-[133.692px] translate-x-[100%] translate-y-[50%] w-[156.72px]">
          <p className="leading-[normal]">ER</p>
        </div>
        <div className="absolute bottom-[234.69px] flex flex-col font-['Helvetica_Neue:Medium',_sans-serif] h-[115.141px] justify-center right-[955.17px] text-[#151413] text-[115.461px] translate-x-[100%] translate-y-[50%] w-[223.885px]">
          <p className="leading-[normal]">NEL</p>
        </div>
        <div className="absolute bottom-[403.36px] flex flex-col font-turret-road font-bold h-[116.74px] justify-center right-[1062.31px] text-[#151413] text-[134.331px] translate-x-[100%] translate-y-[50%] w-[402.994px]">
          <p className="leading-[normal]">SUBS</p>
        </div>
        <div className="absolute bottom-[403.36px] flex flex-col font-turret-road font-bold h-[116.74px] justify-center right-[315.5px] text-[#0f0e0d] text-[129.854px] translate-x-[100%] translate-y-[50%] w-[263.865px]">
          <p className="leading-[normal]">OUR</p>
        </div>
        <div className="absolute bottom-[176.62px] flex flex-col font-['Inter:Light',_sans-serif] font-light h-[60.769px] justify-center right-[561px] text-[#c42d25] text-[56.931px] translate-x-[100%] translate-y-[50%] w-[132.732px]">
          <p className="leading-[normal]">1994</p>
        </div>
      </div>
    </div>
  );
}

function EmailEnterBox({ email, setEmail, isPending, handleSubmit }: {
  email: string;
  setEmail: (email: string) => void;
  isPending: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-[400px] mx-auto" data-name="email_enter_box">
      {/* Background blur overlay */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-[30px] -z-10"></div>
      
      <div className="relative bg-white/95 backdrop-blur-sm rounded-[30px] shadow-xl border border-white/20 overflow-hidden">
        <Input
          type="email"
          placeholder="ENTER YOUR MAIL"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-[60px] bg-transparent border-none text-[15px] font-normal text-gray-800 leading-[1.21] placeholder:text-gray-500 focus:ring-0 focus:outline-none rounded-[30px] px-6 pr-16"
          required
          disabled={isPending}
        />
        <Button
          type="submit"
          disabled={isPending}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-[44px] h-[44px] bg-black hover:bg-gray-800 rounded-full p-0 disabled:opacity-50 transition-colors duration-200 shadow-lg"
        >
          {isPending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 21 16">
              <path d={svgPaths.p181d0c00} fill="currentColor" />
            </svg>
          )}
        </Button>
      </div>
    </form>
  );
}

function EnterEmailBox({ email, setEmail, isPending, handleSubmit }: {
  email: string;
  setEmail: (email: string) => void;
  isPending: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="absolute bottom-[35px] left-1/2 transform -translate-x-[160px] -translate-x-1/2 w-[383.804px]" data-name="Enter_email_box">
      <EmailEnterBox email={email} setEmail={setEmail} isPending={isPending} handleSubmit={handleSubmit} />
    </div>
  );
}

function Groups({ email, setEmail, isPending, handleSubmit }: {
  email: string;
  setEmail: (email: string) => void;
  isPending: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] bottom-[65.57px] h-[698.842px] left-1/2 transform -translate-x-1/2 w-[1148.21px] max-w-[90vw]" data-name="Groups">
      <Frame1171279224 />
      <div className="absolute bg-center bg-cover bg-no-repeat h-[711px] left-1/2 transform -translate-x-1/2 top-[17.41px] w-[1216px] max-w-[100vw]" data-name="Newsletter_visual" style={{ backgroundImage: `url('/assets/1659d14f53932d7cac743059316ba16c1c2d6314.png')` }} />
      <EnterEmailBox email={email} setEmail={setEmail} isPending={isPending} handleSubmit={handleSubmit} />
    </div>
  );
}

// Mobile version with pre-rendered WebP and overlay email input
function MobileNewsletterSection({ email, setEmail, isPending, handleSubmit }: {
  email: string;
  setEmail: (email: string) => void;
  isPending: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="md:hidden relative w-full h-[300px] sm:h-[350px] overflow-hidden">
      {/* Pre-rendered WebP background for mobile - properly sized */}
      <Image 
        src="/assets/Newsletter_subscribe_box.webp"
        alt="Newsletter signup mobile"
        fill
        className="object-cover object-center"
      />
      
      {/* Overlay Email Input Box positioned to overlap the pre-rendered input in WebP */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[180px] sm:w-[200px]">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative bg-white/95 backdrop-blur-sm rounded-[12px] sm:rounded-[15px] shadow-xl border border-white/20 overflow-hidden">
            <Input
              type="email"
              placeholder="ENTER YOUR MAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[36px] sm:h-[40px] bg-transparent border-none text-[11px] sm:text-[12px] font-normal text-gray-800 leading-[1.21] placeholder:text-gray-500 focus:ring-0 focus:outline-none rounded-[12px] sm:rounded-[15px] px-3 pr-9"
              required
              disabled={isPending}
            />
            <Button
              type="submit"
              disabled={isPending}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] bg-black hover:bg-gray-800 rounded-full p-0 disabled:opacity-50 transition-colors duration-200 shadow-lg"
            >
              {isPending ? (
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 21 16" stroke="currentColor" strokeWidth="2">
                  <path d="M1.5 8L19.5 8M19.5 8L12.5 1M19.5 8L12.5 15" />
                </svg>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Root({ email, setEmail, isPending, handleSubmit }: {
  email: string;
  setEmail: (email: string) => void;
  isPending: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="bg-[rgba(0,0,0,0)] h-[782px] relative shrink-0 w-full max-w-[1439.26px] mx-auto" data-name="Root">
      <div className="absolute bg-[#fefefe] bottom-0 h-[782px] left-0 right-0 w-full" data-name="Background" />
      <Groups email={email} setEmail={setEmail} isPending={isPending} handleSubmit={handleSubmit} />
    </div>
  );
}

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('email', email);
      
      const result = await subscribeToNewsletter(formData);
      
      if (result.success) {
        toast.success(result.message);
        setEmail('');
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="bg-[rgba(0,0,0,0)] content-stretch flex flex-col gap-[10px] items-center justify-start relative size-full" data-name="Newsletter_subscribe_box">
      {/* Desktop Version - Original complex implementation */}
      <div className="hidden md:block w-full">
        <Root email={email} setEmail={setEmail} isPending={isPending} handleSubmit={handleSubmit} />
      </div>
      
      {/* Mobile Version - Pre-rendered WebP with overlay email input */}
      <MobileNewsletterSection email={email} setEmail={setEmail} isPending={isPending} handleSubmit={handleSubmit} />
    </div>
  );
}