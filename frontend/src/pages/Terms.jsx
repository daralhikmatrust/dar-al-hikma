import React from 'react';
import { Helmet } from 'react-helmet-async';

const Terms = () => (
  <div className="container mx-auto px-4 py-12">
    <Helmet>
      <title>Terms & Conditions | Dar Al Hikma Trust</title>
      <meta name="description" content="Terms and conditions for using the Dar Al Hikma Trust website and making charitable donations." />
      <link rel="canonical" href="https://daralhikma.org.in/terms" />
    </Helmet>
    <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
    <p className="mb-4">By using this website, you agree to support our mission of education and welfare. All donations made are voluntary and used for charitable purposes.</p>
    <p className="mb-4">Dar Al Hikma Trust reserves the right to update these terms at any time to ensure compliance with local laws and regulations.</p>
  </div>
);

export default Terms;