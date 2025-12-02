import { createSignal, createMemo, Show, For, createEffect } from "solid-js";
import { Portal } from "solid-js/web";
import { AdvancedFilter } from "./AdvancedFilter";
import { DataTable } from "./DataTable";
import { Card } from "./ui";
import type {
	FilterableTableProps,
	SortState,
	ExportDataType,
} from "./types";
import ColumnsIcon from "~icons/mdi/view-column-outline";
import ExportIcon from "~icons/mdi/file-excel-outline";
import CloseIcon from "~icons/mdi/close";
import DownloadIcon from "~icons/mdi/download";
import styles from "./FilterableTable.module.scss";

export function FilterableTable<T extends Record<string, unknown>>(
	props: FilterableTableProps<T>
) {
	// Filter state
	const [filterEvaluator, setFilterEvaluator] = createSignal<
		(row: T) => boolean
	>(() => true);

	// Sort state
	const [sortState, setSortState] = createSignal<SortState>({
		column: props.defaultSort?.column || null,
		direction: props.defaultSort?.direction || null,
	});

	// Column visibility state
	const allColumnKeys = createMemo(() =>
		props.columns.map((col) => col.key as string)
	);
	const [visibleColumns, setVisibleColumns] = createSignal<string[]>(
		props.defaultVisibleColumns || allColumnKeys()
	);

	// Column widths state - initialize with explicit widths or auto-calculate
	const getInitialWidths = (): Record<string, string> => {
		const widths: Record<string, string> = {};
		const totalCols = props.columns.length;
		const defaultWidth = `${Math.floor(100 / totalCols)}%`;
		props.columns.forEach((col) => {
			widths[col.key as string] = col.width || defaultWidth;
		});
		return widths;
	};
	const [columnWidths, setColumnWidths] = createSignal<Record<string, string>>(
		getInitialWidths()
	);

	// Column selector dropdown
	const [showColumnSelector, setShowColumnSelector] = createSignal(false);

	// Export modal
	const [showExportModal, setShowExportModal] = createSignal(false);
	const [exportType, setExportType] = createSignal<ExportDataType>("visible");

	// Update visible columns when defaultVisibleColumns changes
	createEffect(() => {
		if (props.defaultVisibleColumns) {
			setVisibleColumns(props.defaultVisibleColumns);
		}
	});

	// Build column options for filter dropdown
	const filterColumns = createMemo(() =>
		props.columns.map((col) => ({
			value: col.key as string,
			label: col.label,
		}))
	);

	// Handle filter change
	const handleFilterChange = (
		evaluator: (row: Record<string, unknown>) => boolean
	): void => {
		setFilterEvaluator(() => evaluator as (row: T) => boolean);
	};

	// Handle sort change
	const handleSortChange = (column: string): void => {
		const current = sortState();
		if (current.column === column) {
			if (current.direction === "asc") {
				setSortState({ column, direction: "desc" });
			} else if (current.direction === "desc") {
				setSortState({ column: null, direction: null });
			} else {
				setSortState({ column, direction: "asc" });
			}
		} else {
			setSortState({ column, direction: "asc" });
		}
	};

	// Handle reset
	const handleReset = (): void => {
		setSortState({ column: null, direction: null });
	};

	// Handle column resize
	const handleColumnResize = (columnKey: string, width: string): void => {
		setColumnWidths((prev) => ({ ...prev, [columnKey]: width }));
	};

	// Toggle column visibility
	const toggleColumn = (columnKey: string): void => {
		const current = visibleColumns();
		if (current.includes(columnKey)) {
			if (current.length > 1) {
				setVisibleColumns(current.filter((k) => k !== columnKey));
			}
		} else {
			setVisibleColumns([...current, columnKey]);
		}
	};

	// Select all/none columns
	const selectAllColumns = (): void => {
		setVisibleColumns(allColumnKeys());
	};
	const selectNoColumns = (): void => {
		const first = allColumnKeys()[0];
		setVisibleColumns(first ? [first] : []);
	};

	// Get raw value for sorting
	const getRawValue = (
		row: T,
		column: string
	): string | number | boolean | null => {
		const value = row[column as keyof T];
		if (value === null || value === undefined) return "";
		if (typeof value === "number" || typeof value === "boolean") return value;
		return String(value);
	};

	// Sort data
	const sortData = (data: T[]): T[] => {
		const { column, direction } = sortState();
		if (!column || !direction) return data;

		return [...data].sort((a, b) => {
			const aVal = getRawValue(a, column);
			const bVal = getRawValue(b, column);

			let comparison = 0;

			if (typeof aVal === "number" && typeof bVal === "number") {
				comparison = aVal - bVal;
			} else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
				comparison = aVal === bVal ? 0 : aVal ? 1 : -1;
			} else {
				const aStr = String(aVal).toLowerCase();
				const bStr = String(bVal).toLowerCase();
				comparison = aStr.localeCompare(bStr);
			}

			return direction === "asc" ? comparison : -comparison;
		});
	};

	// Filtered and sorted data
	const processedData = createMemo(() => {
		const evaluator = filterEvaluator();
		const filtered = props.data.filter(evaluator);
		const sorted = sortData(filtered);
		props.onFilteredDataChange?.(sorted);
		return sorted;
	});

	// Export to Excel
	const handleExport = (): void => {
		const dataToExport =
			exportType() === "visible" ? processedData() : props.data;
		const columnsToExport = props.columns.filter((col) =>
			visibleColumns().includes(col.key as string)
		);

		// Build CSV content
		const headers = columnsToExport.map((col) => col.label);
		const rows = dataToExport.map((row) =>
			columnsToExport.map((col) => {
				const value = row[col.key as keyof T];
				if (value === null || value === undefined) return "";
				if (typeof value === "boolean") return value ? "Yes" : "No";
				// Escape quotes and wrap in quotes if contains comma
				const str = String(value);
				if (str.includes(",") || str.includes('"') || str.includes("\n")) {
					return `"${str.replace(/"/g, '""')}"`;
				}
				return str;
			})
		);

		const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
			"\n"
		);

		// Create and download file
		const blob = new Blob(["\ufeff" + csvContent], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;

		// Format: YYYY-MM-DD_HH-mm-ss
		const now = new Date();
		const timestamp = now.getFullYear() +
			"-" + String(now.getMonth() + 1).padStart(2, "0") +
			"-" + String(now.getDate()).padStart(2, "0") +
			"_" + String(now.getHours()).padStart(2, "0") +
			"-" + String(now.getMinutes()).padStart(2, "0") +
			"-" + String(now.getSeconds()).padStart(2, "0");
		const baseName = props.exportFileName || "export";
		link.download = `${baseName}_${timestamp}.csv`;

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		setShowExportModal(false);
	};

	return (
		<div class={styles["filterable-table"]}>
			<Show when={props.data.length > 0}>
				<AdvancedFilter
					columns={filterColumns()}
					onFilterChange={handleFilterChange}
					onReset={handleReset}
					defaultAutoApply={true}
				/>

				<div class={styles["toolbar"]}>
					<span class={styles["summary"]}>
						Showing <strong>{processedData().length}</strong> of{" "}
						<strong>{props.data.length}</strong> items
					</span>

					<div class={styles["toolbar-actions"]}>
						{/* Column Selector */}
						<Show when={props.showColumnSelector !== false}>
							<div class={styles["column-selector"]}>
								<button
									class={styles["column-btn"]}
									onClick={() => setShowColumnSelector(!showColumnSelector())}
								>
									<ColumnsIcon />
									Columns ({visibleColumns().length}/{allColumnKeys().length})
								</button>

								<Show when={showColumnSelector()}>
									<div class={styles["column-dropdown"]}>
										<For each={props.columns}>
											{(col) => (
												<label class={styles["column-item"]}>
													<input
														type="checkbox"
														checked={visibleColumns().includes(col.key as string)}
														onChange={() => toggleColumn(col.key as string)}
													/>
													<span>{col.label}</span>
												</label>
											)}
										</For>
										<div class={styles["column-actions"]}>
											<button
												class={styles["select-all"]}
												onClick={selectAllColumns}
											>
												All
											</button>
											<button
												class={styles["select-none"]}
												onClick={selectNoColumns}
											>
												Reset
											</button>
										</div>
									</div>
								</Show>
							</div>
						</Show>

						{/* Export Button */}
						<Show when={props.showExport !== false}>
							<button
								class={styles["export-btn"]}
								onClick={() => setShowExportModal(true)}
							>
								<ExportIcon />
								Export
							</button>
						</Show>
					</div>
				</div>

				<Card class="shadow-sm border-0">
					<DataTable
						data={processedData()}
						columns={props.columns}
						visibleColumns={visibleColumns()}
						columnWidths={columnWidths()}
						loading={props.loading}
						sortState={sortState()}
						onSortChange={handleSortChange}
						onColumnResize={handleColumnResize}
						rowClass={props.rowClass}
						allowResize={props.allowResize}
					/>
				</Card>
			</Show>

			{/* Export Modal */}
			<Show when={showExportModal()}>
				<Portal>
					<div
						class={styles["modal-backdrop"]}
						onClick={(e) => {
							if (e.target === e.currentTarget) setShowExportModal(false);
						}}
					>
						<div class={styles["export-modal"]}>
							<div class={styles["modal-header"]}>
								<h3>
									<ExportIcon />
									Export Data
								</h3>
								<button
									class={styles["modal-close"]}
									onClick={() => setShowExportModal(false)}
								>
									<CloseIcon />
								</button>
							</div>

							<div class={styles["modal-body"]}>
								<label
									class={`${styles["export-option"]} ${exportType() === "visible" ? styles["selected"] : ""}`}
								>
									<input
										type="radio"
										name="exportType"
										checked={exportType() === "visible"}
										onChange={() => setExportType("visible")}
									/>
									<div class={styles["option-content"]}>
										<div class={styles["option-title"]}>
											Visible Data ({processedData().length} rows)
										</div>
										<div class={styles["option-desc"]}>
											Export only the filtered and visible data
										</div>
									</div>
								</label>

								<label
									class={`${styles["export-option"]} ${exportType() === "all" ? styles["selected"] : ""}`}
								>
									<input
										type="radio"
										name="exportType"
										checked={exportType() === "all"}
										onChange={() => setExportType("all")}
									/>
									<div class={styles["option-content"]}>
										<div class={styles["option-title"]}>
											All Data ({props.data.length} rows)
										</div>
										<div class={styles["option-desc"]}>
											Export all data without filters applied
										</div>
									</div>
								</label>
							</div>

							<div class={styles["modal-footer"]}>
								<button
									class={styles["cancel-btn"]}
									onClick={() => setShowExportModal(false)}
								>
									Cancel
								</button>
								<button class={styles["confirm-btn"]} onClick={handleExport}>
									<DownloadIcon />
									Download CSV
								</button>
							</div>
						</div>
					</div>
				</Portal>
			</Show>
		</div>
	);
}

export default FilterableTable;

