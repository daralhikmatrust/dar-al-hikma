import React from 'react';
import { Helmet } from 'react-helmet-async';

const PrivacyPolicy = () => (
  <div className="container mx-auto px-4 py-12">
    <Helmet>
      <title>Privacy Policy | Dar Al Hikma Trust</title>
      <meta name="description" content="Read our privacy policy to understand how Dar Al Hikma Trust protects and manages your personal and donation data." />
      <link rel="canonical" href="https://daralhikma.org.in/privacy-policy" />
    </Helmet>
    <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
    <p className="mb-4">At Dar Al Hikma Trust, we are committed to protecting your privacy. We collect information like your name and email only to process donations and provide updates on our projects.</p>
    <p className="mb-4">We do not sell or share your data with third parties. All financial transactions are handled through secure, encrypted payment gateways.</p>
  </div>
);

export default PrivacyPolicy;