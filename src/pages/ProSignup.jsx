import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, Wrench } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function ProSignup() {
  useEffect(() => {
    // Mark that user is going through pro signup flow
    localStorage.setItem('proSignupFlow', 'true');
    
    // Redirect to signup/login immediately
    const dashboardUrl = window.location.origin + createPageUrl('Dashboard') + '?setup=business';
    base44.auth.redirectToLogin(dashboardUrl);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-[#1e3a5f] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Redirecting to signup...</h2>
        <p className="text-gray-600 mt-2">You'll complete your business profile after creating your account</p>
      </div>
    </div>
  );
}