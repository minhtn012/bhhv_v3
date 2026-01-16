'use client';

import { isPaymentPending } from '@/utils/contract-status';

interface PaymentPendingBadgeProps {
  contract: {
    status: string;
    buyerPaymentDate?: string | null;
  };
  className?: string;
}

/**
 * Badge component showing payment pending status
 * Only renders when contract is in 'ra_hop_dong' status AND today <= buyerPaymentDate
 */
export default function PaymentPendingBadge({ contract, className = '' }: PaymentPendingBadgeProps) {
  if (!isPaymentPending(contract)) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-300 ${className}`}
      title={`Chờ thanh toán đến ${contract.buyerPaymentDate}`}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Chờ TT</span>
    </span>
  );
}
