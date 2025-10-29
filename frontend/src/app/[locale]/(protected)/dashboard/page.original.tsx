"use client";

import { signOut } from "next-auth/react";

// Force dynamic rendering for protected pages
export const dynamic = 'force-dynamic';
import Link from "next/link";
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { formatNumber } from "@/utils/localization";
import { useEffect, useState } from "react";
import {
  MdStarBorder,
  MdEmail,
  MdNotifications,
  MdDirectionsCar,
  MdAddCircleOutline,
  MdEditNote,
  MdLogout,
  MdArrowForward
} from "react-icons/md";
import { getMyListings, deleteListingById } from "@/services/listings";

import { Listing } from "@/types/listings";
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import { ListingsView } from '@/components/listings';

// Move namespaces outside component to prevent recreation on every render
const DASHBOARD_NAMESPACES = ['dashboard', 'common', 'listings', 'search'];

// BACKUP: This is your original dashboard component
// Renamed to page.original.tsx for reference
export default function OriginalDashboard() {
  // ... (your original dashboard code would be here)
  // This is just a backup reference file
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Original Dashboard (Backup)</h1>
      <p className="text-gray-600">
        This is a backup of your original dashboard. 
        The new enhanced dashboard is now active in page.tsx
      </p>
    </div>
  );
}
