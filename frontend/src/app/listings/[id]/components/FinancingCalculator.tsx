"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../../utils/localization';
import { Listing } from '@/types/listings';

interface FinancingCalculatorProps {
  listing: Listing;
}

const FinancingCalculator: React.FC<FinancingCalculatorProps> = ({ listing }) => {
  const { t, i18n } = useTranslation('common');
  const [downPayment, setDownPayment] = useState(listing.price * 0.2); // 20% default
  const [loanTerm, setLoanTerm] = useState(60); // 5 years default
  const [interestRate, setInterestRate] = useState(5); // 5% default
  const [isExpanded, setIsExpanded] = useState(false);

  const calculateMonthlyPayment = () => {
    const principal = listing.price - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm;
    
    if (monthlyRate === 0) {
      return principal / numberOfPayments;
    }
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    return monthlyPayment;
  };

  const monthlyPayment = calculateMonthlyPayment();
  const totalCost = monthlyPayment * loanTerm + downPayment;
  const totalInterest = totalCost - listing.price;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <div 
        className="p-4 sm:p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <svg className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {t('listings.financing')}
          </h3>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {!isExpanded && (
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(monthlyPayment, i18n.language, { currency: listing.currency || 'USD', style: 'currency' })}
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">
                /{t('month')}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('listings.estimatedMonthlyPayment')}
            </p>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-6 sm:px-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {formatNumber(monthlyPayment, i18n.language, { currency: listing.currency || 'USD', style: 'currency' })}
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">
                /{t('month')}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('listings.estimatedMonthlyPayment')}
            </p>
          </div>

          {/* Down Payment */}
          <div className="space-y-2">
            <label className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>{t('listings.downPayment')}</span>
              <span>{formatNumber(downPayment, i18n.language, { currency: listing.currency || 'USD', style: 'currency' })}</span>
            </label>
            <input
              type="range"
              min={listing.price * 0.1}
              max={listing.price * 0.5}
              step={1000}
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>10%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Loan Term */}
          <div className="space-y-2">
            <label className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>{t('listings.loanTerm')}</span>
              <span>{loanTerm} {t('months')}</span>
            </label>
            <input
              type="range"
              min="12"
              max="84"
              step="12"
              value={loanTerm}
              onChange={(e) => setLoanTerm(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>1 {t('year')}</span>
              <span>7 {t('years')}</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <label className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>{t('listings.interestRate')}</span>
              <span>{interestRate}%</span>
            </label>
            <input
              type="range"
              min="2"
              max="15"
              step="0.5"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>2%</span>
              <span>15%</span>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t dark:border-gray-600 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('listings.vehiclePrice')}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(listing.price, i18n.language, { currency: listing.currency || 'USD', style: 'currency' })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('listings.totalInterest')}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(totalInterest, i18n.language, { currency: listing.currency || 'USD', style: 'currency' })}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-900 dark:text-white">{t('listings.totalCost')}</span>
              <span className="text-gray-900 dark:text-white">
                {formatNumber(totalCost, i18n.language, { currency: listing.currency || 'USD', style: 'currency' })}
              </span>
            </div>
          </div>

          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            {t('listings.getPreApproved')}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('listings.financingDisclaimer')}
          </p>
        </div>
      )}
    </div>
  );
};

export default FinancingCalculator;
