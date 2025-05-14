"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image"; // Added Image import
import { useTranslation } from "react-i18next";

// Mock data for listings (in a real app, this would come from an API)
const MOCK_LISTINGS = [
	{
		id: "1",
		title: "Toyota Camry 2020",
		price: 25000,
		location: "Dubai",
		created: "2023-05-15",
		expires: "2023-08-15",
		status: "active",
		views: 120,
		image: "/images/vehicles/car-default.svg",
	},
	{
		id: "2",
		title: "Honda Civic 2019",
		price: 18500,
		location: "Abu Dhabi",
		created: "2023-04-20",
		expires: "2023-07-20",
		status: "active",
		views: 75,
		image: "/images/vehicles/car-default.svg",
	},
	{
		id: "3",
		title: "BMW X5 2018",
		price: 35000,
		location: "Sharjah",
		created: "2023-03-10",
		expires: "2023-06-10",
		status: "expired",
		views: 210,
		image: "/images/vehicles/car-default.svg",
	},
];

export default function ListingsPage() {
	const { t } = useTranslation("common");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortBy, setSortBy] = useState("newest");
	const [listings, setListings] = useState(MOCK_LISTINGS);

	// Function to filter and sort listings
	const filteredListings = listings
		.filter((listing) => {
			// Filter by search term
			const searchMatch = listing.title
				.toLowerCase()
				.includes(search.toLowerCase());

			// Filter by status
			const statusMatch =
				statusFilter === "all" || listing.status === statusFilter;

			return searchMatch && statusMatch;
		})
		.sort((a, b) => {
			// Sort listings
			switch (sortBy) {
				case "price-asc":
					return a.price - b.price;
				case "price-desc":
					return b.price - a.price;
				case "oldest":
					return (
						new Date(a.created).getTime() - new Date(b.created).getTime()
					);
				case "views":
					return b.views - a.views;
				case "newest":
				default:
					return (
						new Date(b.created).getTime() - new Date(a.created).getTime()
					);
			}
		});

	// Function to handle listing delete
	const handleDelete = (id: string) => {
		if (window.confirm(t("listings.confirmDelete"))) {
			setListings((prev) => prev.filter((listing) => listing.id !== id));
		}
	};

	// Function to handle listing renewal
	const handleRenew = (id: string) => {
		setListings((prev) =>
			prev.map((listing) => {
				if (listing.id === id) {
					// Calculate new expiry date (+ 3 months from now)
					const newExpiry = new Date();
					newExpiry.setMonth(newExpiry.getMonth() + 3);

					return {
						...listing,
						status: "active",
						expires: newExpiry.toISOString().split("T")[0],
					};
				}
				return listing;
			})
		);
	};

	return (
		<div>
			<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
				<h1 className="text-2xl font-semibold">
					{t("dashboard.myListings")}
				</h1>
				<Link
					href="/dashboard/listings/new"
					className="inline-flex items-center py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90"
				>
					<span className="mr-2">+</span>
					{t("dashboard.createListing")}
				</Link>
			</div>

			{/* Filters & Search */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							{t("common.search")}
						</label>
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t("listings.searchPlaceholder")}
							className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							{t("listings.status")}
						</label>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
						>
							<option value="all">{t("common.all")}</option>
							<option value="active">{t("listings.active")}</option>
							<option value="expired">{t("listings.expired")}</option>
							<option value="pending">{t("listings.pending")}</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							{t("common.sortBy")}
						</label>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
						>
							<option value="newest">{t("common.newest")}</option>
							<option value="oldest">{t("common.oldest")}</option>
							<option value="price-asc">
								{t("common.priceLowToHigh")}
							</option>
							<option value="price-desc">
								{t("common.priceHighToLow")}
							</option>
							<option value="views">{t("common.mostViewed")}</option>
						</select>
					</div>
				</div>
			</div>

			{/* Listings Table */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50 dark:bg-gray-700 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
							<tr>
								<th className="py-3 px-4">{t("listings.image")}</th>
								<th className="py-3 px-4">{t("listings.details")}</th>
								<th className="py-3 px-4">{t("common.price")}</th>
								<th className="py-3 px-4">{t("listings.status")}</th>
								<th className="py-3 px-4">{t("listings.expiryDate")}</th>
								<th className="py-3 px-4">{t("listings.views")}</th>
								<th className="py-3 px-4">{t("listings.actions")}</th>
							</tr>
						</thead>
						<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
							{filteredListings.length > 0 ? (
								filteredListings.map((listing) => (
									<tr
										key={listing.id}
										className="hover:bg-gray-50 dark:hover:bg-gray-700"
									>
										<td className="py-4 px-4">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-10 w-10">
													<Image
														src={listing.image || "/images/vehicles/car-default.svg"}
														alt={listing.title}
														width={40}
														height={40}
														className="h-10 w-10 rounded-full object-cover"
														onError={(e) => {
															// Fallback to local image if remote image fails
															const target = e.target as HTMLImageElement;
															target.onerror = null; // Prevent infinite loop
															target.src = "/images/logo.svg";
														}}
													/>
												</div>
												<div className="ml-4 rtl:mr-4 rtl:ml-0">
													<div className="font-medium text-gray-900 dark:text-white">
														{listing.title}
													</div>
													<div className="text-sm text-gray-500 dark:text-gray-400">
														{listing.location}
													</div>
													<div className="text-xs text-gray-500 dark:text-gray-400">
														{t("common.created")}:{" "}
														{listing.created}
													</div>
												</div>
											</div>
										</td>
										<td className="py-4 px-4 font-medium">
											${listing.price.toLocaleString()}
										</td>
										<td className="py-4 px-4">
											<span
												className={`px-2 py-1 rounded-full text-xs ${
													listing.status === "active"
														? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
														: listing.status === "expired"
														? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
														: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
												}`}
											>
												{t(`listings.${listing.status}`)}
											</span>
										</td>
										<td className="py-4 px-4 text-sm">
											{listing.expires}
										</td>
										<td className="py-4 px-4">{listing.views}</td>
										<td className="py-4 px-4">
											<div className="flex flex-col space-y-1">
												<Link
													href={`/dashboard/listings/edit/${listing.id}`}
													className="text-sm text-primary hover:underline"
												>
													{t("common.edit")}
												</Link>
												<button
													onClick={() => handleDelete(listing.id)}
													className="text-sm text-red-500 hover:underline text-left"
												>
													{t("common.delete")}
												</button>
												{listing.status === "expired" && (
													<button
														onClick={() => handleRenew(listing.id)}
														className="text-sm text-green-600 hover:underline text-left"
													>
														{t("listings.renew")}
													</button>
												)}
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={7}
										className="py-4 px-4 text-center text-gray-500 dark:text-gray-400"
									>
										{search || statusFilter !== "all"
											? t("listings.noMatchingListings")
											: t("listings.noListings")}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination - could be implemented here */}
			<div className="flex justify-center mt-6">
				{/* Pagination would go here */}
			</div>

			{/* Help box */}
			<div className="mt-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
				<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
					{t("dashboard.listingsTips")}
				</h3>
				<ul className="text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
					<li>{t("dashboard.tip1")}</li>
					<li>{t("dashboard.tip2")}</li>
					<li>{t("dashboard.tip3")}</li>
				</ul>
				<div className="mt-4">
					<Link
						href="/help/listings"
						className="text-primary hover:underline"
					>
						{t("common.learnMore")} →
					</Link>
				</div>
			</div>
		</div>
	);
}
